import { useState } from 'react';
import { usePromptChain } from '@/features/prompt-chain/hooks/usePromptChain';

const defaultText =
  'The new laptop model features a 3.5 GHz octa-core processor, 16GB of RAM, and a 1TB NVMe SSD.';

export function PromptChainForm() {
  const [sourceText, setSourceText] = useState(defaultText);
  const chainMutation = usePromptChain();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    chainMutation.mutate({ sourceText });
  };

  return (
    <div className="card">
      <h2>Prompt Chaining Demo</h2>
      <p>Step1 extract specs, Step2 transform to JSON via Nest API.</p>
      <form onSubmit={onSubmit}>
        <label htmlFor="textInput">Input Text</label>
        <textarea
          id="textInput"
          rows={6}
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
        />
        <div className="row" style={{ marginTop: 12 }}>
          <button type="submit" disabled={chainMutation.isPending}>
            {chainMutation.isPending ? 'Running...' : 'Run Chain'}
          </button>
        </div>
      </form>

      {chainMutation.isError ? (
        <p className="error">Failed: {(chainMutation.error as Error)?.message ?? 'Unknown error'}</p>
      ) : null}

      {chainMutation.data ? (
        <>
          <h3>Output</h3>
          <pre>{JSON.stringify(chainMutation.data, null, 2)}</pre>
        </>
      ) : null}
    </div>
  );
}
