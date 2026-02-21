import { useMutation } from '@tanstack/react-query';
import api from '@/api/controller';

export function usePromptChain() {
  return useMutation({
    ...api.llm.runPromptChain(),
  });
}
