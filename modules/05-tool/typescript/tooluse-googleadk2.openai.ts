import {
  Agent,
  MemorySession,
  OpenAIProvider,
  Runner,
  tool,
  type Session,
} from "@openai/agents";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";

export type OpenAICalculatorSessionRouting = {
  appName: string;
  userId: string;
  sessionId: string;
};

export type OpenAICalculatorRuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  sessionRouting: OpenAICalculatorSessionRouting;
};

export function resolveOpenAICalculatorRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): OpenAICalculatorRuntimeConfig {
  const apiKey: string =
    env.API_KEY?.trim() || env.OPENAI_API_KEY?.trim() || "";
  if (apiKey.length === 0) {
    throw new Error("API_KEY or OPENAI_API_KEY is missing.");
  }

  const config: OpenAICalculatorRuntimeConfig = {
    apiKey,
    baseUrl: env.BASE_URL?.trim() || "https://api.synthetic.new/openai/v1",
    modelName: env.MODEL?.trim() || "hf:moonshotai/Kimi-K2.5",
    sessionRouting: {
      appName: "calculator",
      userId: env.OPENAI_CALCULATOR_USER_ID?.trim() || env.USER_ID?.trim() || randomUUID(),
      sessionId:
        env.OPENAI_CALCULATOR_SESSION_ID?.trim() ||
        env.SESSION_ID?.trim() ||
        randomUUID(),
    },
  };
  return config;
}

function toTextOutput(output: unknown): string {
  if (typeof output === "string") {
    return output;
  }

  const serializedOutput: string | undefined = JSON.stringify(output, null, 2);
  return serializedOutput ?? "";
}

export async function runOpenAICalculatorAgent(
  query: string,
  config: OpenAICalculatorRuntimeConfig = resolveOpenAICalculatorRuntimeConfig(process.env),
): Promise<string> {
  const provider: OpenAIProvider = new OpenAIProvider({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    useResponses: false,
  });

  const runner: Runner = new Runner({
    modelProvider: provider,
    tracingDisabled: true,
  });

  const calculatorToolSchema: z.ZodObject<{
    expression: z.ZodString;
  }> = z.object({
    expression: z.string(),
  });

  const calculatorTool: ReturnType<typeof tool> = tool({
    name: "safe_calculator",
    description:
      "Safely evaluate arithmetic expressions with +, -, *, /, parentheses, and factorial requests.",
    parameters: calculatorToolSchema,
    execute: (input: { expression: string }): string => {
      const rawExpression: string = input.expression.trim();
      if (rawExpression.length === 0) {
        throw new Error("Expression is empty.");
      }

      const lowerExpression: string = rawExpression.toLowerCase();
      const factorialPatternA: RegExp = /^(?:what\s+is\s+)?(\d+)\s+factorial\??$/;
      const factorialPatternB: RegExp = /^factorial\s+of\s+(\d+)\??$/;
      const factorialMatchA: RegExpMatchArray | null = lowerExpression.match(factorialPatternA);
      const factorialMatchB: RegExpMatchArray | null = lowerExpression.match(factorialPatternB);
      const factorialValueText: string = factorialMatchA?.[1] || factorialMatchB?.[1] || "";

      if (factorialValueText.length > 0) {
        const factorialValue: number = Number.parseInt(factorialValueText, 10);
        if (!Number.isFinite(factorialValue) || factorialValue < 0) {
          throw new Error("Factorial requires a non-negative integer.");
        }

        let result: number = 1;
        for (let index: number = 2; index <= factorialValue; index += 1) {
          result *= index;
        }
        return String(result);
      }

      const mathExpression: string = rawExpression
        .replace(/calculate\s+the\s+value\s+of/gi, "")
        .replace(/calculate/gi, "")
        .replace(/what\s+is/gi, "")
        .replace(/\?/g, "")
        .trim();

      if (!/^[0-9+\-*/().\s]+$/.test(mathExpression)) {
        throw new Error(
          "Only digits, spaces, parentheses, and operators + - * / are allowed.",
        );
      }

      const tokenRegex: RegExp = /\d+(?:\.\d+)?|[()+\-*/]/g;
      const tokenMatches: Array<string> = mathExpression.match(tokenRegex) || [];
      if (tokenMatches.length === 0) {
        throw new Error("No arithmetic tokens found.");
      }

      const outputQueue: Array<string> = [];
      const operatorStack: Array<string> = [];
      let expectingValue: boolean = true;

      for (const token of tokenMatches) {
        if (/^\d/.test(token)) {
          outputQueue.push(token);
          expectingValue = false;
          continue;
        }

        if (token === "(") {
          operatorStack.push(token);
          expectingValue = true;
          continue;
        }

        if (token === ")") {
          let foundOpenParenthesis: boolean = false;
          while (operatorStack.length > 0) {
            const currentOperator: string = operatorStack.pop()!;
            if (currentOperator === "(") {
              foundOpenParenthesis = true;
              break;
            }
            outputQueue.push(currentOperator);
          }
          if (!foundOpenParenthesis) {
            throw new Error("Mismatched parentheses.");
          }
          expectingValue = false;
          continue;
        }

        if (!["+", "-", "*", "/"].includes(token)) {
          throw new Error(`Unsupported operator token: ${token}`);
        }

        if (token === "-" && expectingValue) {
          outputQueue.push("0");
        }

        const incomingPrecedence: number = token === "+" || token === "-" ? 1 : 2;
        while (operatorStack.length > 0) {
          const topOperator: string = operatorStack[operatorStack.length - 1]!;
          if (topOperator === "(") {
            break;
          }

          const topPrecedence: number = topOperator === "+" || topOperator === "-" ? 1 : 2;
          if (topPrecedence < incomingPrecedence) {
            break;
          }

          outputQueue.push(operatorStack.pop()!);
        }

        operatorStack.push(token);
        expectingValue = true;
      }

      while (operatorStack.length > 0) {
        const remainingOperator: string = operatorStack.pop()!;
        if (remainingOperator === "(") {
          throw new Error("Mismatched parentheses.");
        }
        outputQueue.push(remainingOperator);
      }

      const evaluationStack: Array<number> = [];
      for (const token of outputQueue) {
        if (/^\d/.test(token)) {
          const numericTokenValue: number = Number.parseFloat(token);
          evaluationStack.push(numericTokenValue);
          continue;
        }

        if (evaluationStack.length < 2) {
          throw new Error("Invalid expression structure.");
        }

        const rightOperand: number = evaluationStack.pop()!;
        const leftOperand: number = evaluationStack.pop()!;
        let operationResult: number = 0;

        if (token === "+") {
          operationResult = leftOperand + rightOperand;
        } else if (token === "-") {
          operationResult = leftOperand - rightOperand;
        } else if (token === "*") {
          operationResult = leftOperand * rightOperand;
        } else {
          if (rightOperand === 0) {
            throw new Error("Division by zero is not allowed.");
          }
          operationResult = leftOperand / rightOperand;
        }

        evaluationStack.push(operationResult);
      }

      if (evaluationStack.length !== 1) {
        throw new Error("Expression evaluation did not resolve to one value.");
      }

      const finalNumber: number = evaluationStack[0]!;
      const integerNumber: number = Math.trunc(finalNumber);
      if (Math.abs(finalNumber - integerNumber) < 1e-12) {
        return String(integerNumber);
      }

      return String(finalNumber);
    },
  });

  const calculatorAgent: Agent = new Agent({
    name: "calculator_agent",
    model: config.modelName,
    instructions: [
      "You are a calculator agent.",
      "Always call safe_calculator for every user request.",
      "Return only the tool output as plain text, without markdown.",
    ].join("\n"),
    tools: [calculatorTool],
    toolUseBehavior: "stop_on_first_tool",
  });

  const mappedSessionId: string = `${config.sessionRouting.appName}:${config.sessionRouting.userId}:${config.sessionRouting.sessionId}`;
  const session: Session = new MemorySession({
    sessionId: mappedSessionId,
  });

  const runResult: unknown = await runner.run(
    calculatorAgent,
    query,
    {
      maxTurns: 4,
      session,
    },
  );
  const finalOutput: unknown =
    typeof runResult === "object" && runResult !== null
      ? Reflect.get(runResult, "finalOutput")
      : undefined;

  const finalText: string = toTextOutput(finalOutput).trim();
  if (finalText.length === 0) {
    throw new Error("OpenAI calculator agent completed without a text response.");
  }

  return finalText;
}

export async function runOpenAICalculatorExamples(
  config: OpenAICalculatorRuntimeConfig = resolveOpenAICalculatorRuntimeConfig(process.env),
): Promise<void> {
  const firstResult: string = await runOpenAICalculatorAgent(
    "Calculate the value of (5 + 7) * 3",
    config,
  );
  console.log(`==> Final Agent Response: ${firstResult}`);

  const secondResult: string = await runOpenAICalculatorAgent(
    "What is 10 factorial?",
    config,
  );
  console.log(`==> Final Agent Response: ${secondResult}`);
}

const isNodeTestContext: boolean = process.env.NODE_TEST_CONTEXT !== undefined;
const cliPath: string | undefined = process.argv[1];
if (!isNodeTestContext && cliPath) {
  const cliUrl: string = pathToFileURL(resolve(process.cwd(), cliPath)).href;
  if (cliUrl === import.meta.url) {
    void runOpenAICalculatorExamples()
      .catch((error: unknown): void => {
        const message: string = error instanceof Error ? error.message : String(error);
        console.error(message);
        process.exitCode = 1;
      });
  }
}
