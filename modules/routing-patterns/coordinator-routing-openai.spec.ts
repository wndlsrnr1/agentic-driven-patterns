import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildRuntimeConfigFromEnv,
  resolveCliRequest,
  runRout3Workflow,
  type RoutingResult,
  type RuntimeConfig,
} from "./coordinator-routing-openai.ts";

test("buildRuntimeConfigFromEnv throws when SYNTHETIC_API_KEY is missing", (): void => {
  assert.throws(
    (): RuntimeConfig => buildRuntimeConfigFromEnv({}),
    /SYNTHETIC_API_KEY is missing\./,
  );
});

test("resolveCliRequest returns first user argument", (): void => {
  const cliRequest: string | undefined = resolveCliRequest([
    "node",
    "rout3.ts",
    "Book me a hotel in Paris.",
  ]);
  assert.equal(cliRequest, "Book me a hotel in Paris.");
});

test("runRout3Workflow returns normalized routing result from injected runner", async (): Promise<void> => {
  const routingResult: RoutingResult = await runRout3Workflow(
    "Book me a hotel in Paris.",
    {
      env: {
        SYNTHETIC_API_KEY: "test-key",
        SYNTHETIC_BASE_URL: "https://example.test/v1",
        SYNTHETIC_MODEL: "test-model",
      },
      agentsRunner: async (
        requestText: string,
      ): Promise<{ finalOutput: string }> => {
        assert.equal(requestText, "Book me a hotel in Paris.");
        return {
          finalOutput: JSON.stringify({
            decision: "booker",
            agentName: "booking_agent",
            output:
              "Booking Handler processed request: 'Book me a hotel in Paris.'. Result: Simulated booking action.",
          }),
        };
      },
    },
  );

  assert.equal(routingResult.request, "Book me a hotel in Paris.");
  assert.equal(routingResult.decision, "booker");
  assert.equal(routingResult.agentName, "booking_agent");
  assert.equal(routingResult.modelName, "test-model");
});

test("runRout3Workflow falls back to unclear when finalOutput is not JSON", async (): Promise<void> => {
  const routingResult: RoutingResult = await runRout3Workflow(
    "Please handle this.",
    {
      env: {
        SYNTHETIC_API_KEY: "test-key",
      },
      agentsRunner: async (): Promise<{ finalOutput: string }> => {
        return {
          finalOutput: "non-json",
        };
      },
    },
  );

  assert.equal(routingResult.decision, "unclear");
  assert.equal(routingResult.agentName, "unclear_agent");
  assert.match(
    routingResult.output,
    /Coordinator could not delegate request: 'Please handle this\.'/,
  );
});
