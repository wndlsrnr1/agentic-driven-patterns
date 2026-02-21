/**
 * LangChain runtime 구현체를 주입하기 위한 DI 토큰이다.
 *
 * Context:
 * - 등록 위치: `PromptsChainModule` provider.
 * - 사용 위치: `LangchainPromptsChainClient` 생성자 `@Inject`.
 * - 사용 목적: 테스트에서 runtime mock 교체를 가능하게 한다.
 */
export const PROMPTS_CHAIN_RUNTIME = Symbol('PROMPTS_CHAIN_RUNTIME');
