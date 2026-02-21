import type { Config } from 'jest';

/**
 * ADP server 테스트 실행 방식을 정의하는 Jest 설정이다.
 *
 * Context:
 * - 호출자: `npm test`, `npm test -- <pattern>`.
 * - 사용 목적: NodeNext(ESM) + ts-jest 환경에서 TypeScript spec 파일을 실행한다.
 * - 데이터 흐름: `.spec.ts` 검색 -> ts-jest 변환 -> node test environment 실행.
 *
 * Side effects:
 * - 테스트 런 시 모듈 해석 규칙(`moduleNameMapper`)이 적용된다.
 */
const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};

export default config;
