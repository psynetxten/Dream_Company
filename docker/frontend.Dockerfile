FROM node:20-alpine

WORKDIR /app

# 의존성 설치
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# 빌드
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:3003
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# 프로덕션 환경 설정
ENV NODE_ENV=production

EXPOSE 3000

CMD ["./node_modules/.bin/next", "start"]
