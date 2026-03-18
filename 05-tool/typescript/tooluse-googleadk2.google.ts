import {
  BuiltInCodeExecutor,
  Gemini,
  InMemoryRunner,
  LlmAgent,
  isFinalResponse,
  type Event,
} from "@google/adk";
import { createUserContent, type Content, type Part } from "@google/genai";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export type GoogleCalculatorSessionRouting = {
  appName: string;
  userId: string;
  sessionId: string;
};

export type GoogleCalculatorRuntimeConfig = {
  apiKey: string;
  modelName: string;
  sessionRouting: GoogleCalculatorSessionRouting;
};

export type GoogleCalculatorRunResult = {
  finalResponse: string;
};

export function resolveGoogleCalculatorRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): GoogleCalculatorRuntimeConfig {
  const apiKey: string =
    env.GEMINI_API_KEY?.trim() || env.GOOGLE_API_KEY?.trim() || "";
  if (apiKey.length === 0) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is missing.");
  }

  const config: GoogleCalculatorRuntimeConfig = {
    apiKey,
    modelName: env.GOOGLE_MODEL?.trim() || "gemini-2.0-flash",
    sessionRouting: {
      appName: "calculator",
      userId: env.GOOGLE_CALCULATOR_USER_ID?.trim() || env.USER_ID?.trim() || randomUUID(),
      sessionId:
        env.GOOGLE_CALCULATOR_SESSION_ID?.trim() ||
        env.SESSION_ID?.trim() ||
        randomUUID(),
    },
  };
  return config;
}

export async function runGoogleCalculatorAgent(
  query: string,
  config: GoogleCalculatorRuntimeConfig = resolveGoogleCalculatorRuntimeConfig(
    process.env,
  ),
): Promise<GoogleCalculatorRunResult> {
  const model: Gemini = new Gemini({
    model: config.modelName,
    apiKey: config.apiKey,
  });

  const calculatorAgent: LlmAgent = new LlmAgent({
    name: "calculator_agent",
    model,
    codeExecutor: new BuiltInCodeExecutor(),
    instruction: [
      "You are a calculator agent.",
      "When given a mathematical expression, write and execute Python code",
      "to calculate the result.",
      "Return only the final numerical result as plain text, without markdown or code blocks.",
    ].join("\n"),
    description: "Executes Python code to perform calculations.",
  });

  const runner: InMemoryRunner = new InMemoryRunner({
    agent: calculatorAgent,
    appName: config.sessionRouting.appName,
  });

  await runner.sessionService.createSession({
    appName: config.sessionRouting.appName,
    userId: config.sessionRouting.userId,
    sessionId: config.sessionRouting.sessionId,
  });

  const userMessage: Content = createUserContent(query);
  let finalResponseText: string = "";

  console.log(`\n--- Running Query: ${query} ---`);

  try {
    for await (const event of runner.runAsync({
      userId: config.sessionRouting.userId,
      sessionId: config.sessionRouting.sessionId,
      newMessage: userMessage,
    })) {
      const eventId: string = String(event.id ?? "");
      const eventAuthor: string = String(event.author ?? "");
      console.log(`Event ID: ${eventId}, Author: ${eventAuthor}`);

      if (!event.content || !event.content.parts) {
        continue;
      }

      const parts: Array<Part> = event.content.parts;
      for (const part of parts) {
        const executableCode: string = part.executableCode?.code?.trim() || "";
        if (executableCode.length > 0) {
          console.log(` Debug: Agent generated code:\n${executableCode}`);
          continue;
        }

        const codeExecutionOutcome: string = String(
          part.codeExecutionResult?.outcome ?? "",
        );
        const codeExecutionOutput: string =
          part.codeExecutionResult?.output?.trim() || "";
        if (codeExecutionOutcome.length > 0 || codeExecutionOutput.length > 0) {
          console.log(
            ` Debug: Code Execution Result: ${codeExecutionOutcome} -\nOutput:\n${codeExecutionOutput}`,
          );
          continue;
        }

        const textPart: string = part.text?.trim() || "";
        if (textPart.length > 0) {
          console.log(` Text: '${textPart}'`);
        }
      }

      if (isFinalResponse(event)) {
        const textParts: Array<string> = [];
        for (const part of event.content.parts) {
          const textPart: string = part.text?.trim() || "";
          if (textPart.length > 0) {
            textParts.push(textPart);
          }
        }

        if (textParts.length > 0) {
          finalResponseText = textParts.join("").trim();
        }
      }
    }
  } catch (error: unknown) {
    const message: string =
      error instanceof Error ? error.message : String(error);
    console.log(`ERROR during agent run: ${message}`);
    throw new Error(`Google calculator agent run failed: ${message}`);
  }

  if (finalResponseText.length === 0) {
    throw new Error("Google calculator agent completed without a text response.");
  }

  console.log(`==> Final Agent Response: ${finalResponseText}`);
  console.log("-".repeat(30));

  const result: GoogleCalculatorRunResult = {
    finalResponse: finalResponseText,
  };
  return result;
}

export async function runGoogleCalculatorExamples(
  config: GoogleCalculatorRuntimeConfig = resolveGoogleCalculatorRuntimeConfig(
    process.env,
  ),
): Promise<void> {
  await runGoogleCalculatorAgent("Calculate the value of (5 + 7) * 3", config);
  await runGoogleCalculatorAgent("What is 10 factorial?", config);
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
const cliPath: string | undefined = process.argv[1];
if (!isNodeTestContext && cliPath) {
  const cliUrl: string = pathToFileURL(resolve(process.cwd(), cliPath)).href;
  if (cliUrl === import.meta.url) {
    void runGoogleCalculatorExamples().catch((error: unknown): void => {
      const message: string =
        error instanceof Error ? error.message : String(error);
      console.error(message);
      process.exitCode = 1;
    });
  }
}
