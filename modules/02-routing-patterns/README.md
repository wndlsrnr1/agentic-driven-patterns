# routing-patterns workflows

## Environment

Required:

- `SYNTHETIC_API_KEY`

Optional:

- `SYNTHETIC_BASE_URL` (default: `https://api.synthetic.new/openai/v1`)
- `SYNTHETIC_MODEL` (default: `hf:moonshotai/Kimi-K2.5`)

## Run

Coordinator example (LLM decides `booker | info | unclear`, then delegates):

```bash
cd modules
node --env-file=.env --experimental-strip-types ./routing-patterns/coordinator-routing.workflow.ts
```

Coordinator single request mode:

```bash
cd modules
node --env-file=.env --experimental-strip-types ./routing-patterns/coordinator-routing.workflow.ts -- "Book me a flight to London."
```

`rout2.ts` single request workflow:

```bash
cd modules
node --env-file=.env --experimental-strip-types ./routing-patterns/rout2.ts -- "Book me a hotel in Paris."
```

`coordinator-routing-openai.ts` tutorial workflow (OpenAI Agents SDK style):

```bash
cd modules
node --env-file=.env --experimental-strip-types ./routing-patterns/coordinator-routing-openai.ts
```

## Output Contract

Coordinator workflow output (`coordinator-routing.workflow.ts`) returns an array item with:

```json
{
  "request": "Book me a flight to London.",
  "decision": "booker",
  "output": "Booking action for 'Book me a flight to London.' has been simulated.",
  "agentName": "booking_agent",
  "modelName": "hf:moonshotai/Kimi-K2.5"
}
```

When no CLI request is provided, the coordinator workflow returns an array with four objects in the same shape.

`rout2.ts` output returns a single object in the same schema:

```json
{
  "request": "Book me a hotel in Paris.",
  "decision": "booker",
  "output": "Booking Handler processed request: 'Book me a hotel in Paris.'. Result: Simulated booking action.",
  "agentName": "booking_agent",
  "modelName": "hf:moonshotai/Kimi-K2.5"
}
```

`coordinator-routing-openai.ts` prints tutorial-style step logs and assistant outputs:

```text
=== Step 1: Basic Agent ===
User: Hello! Introduce yourself briefly.
Assistant Output: ...

=== Step 2: Coordinator Routing Agent ===
User: Book me a flight to London.
Assistant Output: ...
```
