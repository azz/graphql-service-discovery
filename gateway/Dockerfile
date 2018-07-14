FROM node:10
WORKDIR /app
COPY package.json yarn.lock ./
ENV NODE_ENV production
RUN yarn --pure-lockfile
COPY src src
CMD ["node", "src"]
