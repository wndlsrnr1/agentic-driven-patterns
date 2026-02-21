# 서버 런타임 표준 베이스 이미지(Node 20 LTS)를 사용한다.
FROM node:20-alpine

# 컨테이너 내부 작업 기준 경로를 `/app`으로 고정한다.
WORKDIR /app
# 도커 환경에서는 빌드 출력 경로를 `/tmp/adp-server-dist`로 분리하기 위해 모드를 고정한다.
ENV ADP_BUILD_MODE=docker

# 의존성 캐시 효율을 위해 package manifest를 먼저 복사한다.
COPY package*.json ./
# 컨테이너 전용 node_modules를 잠금 파일 기준으로 설치한다.
RUN npm ci

# 애플리케이션 소스를 복사한다(개발모드에서는 compose bind mount가 이를 덮어쓴다).
COPY . .

# 컨테이너가 노출할 서버 포트를 문서화한다.
EXPOSE 3001

# 개발 모드 엔트리포인트: 파일 변경 감지 후 자동 재시작.
CMD ["npm", "run", "dev"]
