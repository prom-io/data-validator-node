FROM node:10
WORKDIR /var/www/api

COPY ./backend/package.json ./
COPY ./backend ./
RUN yarn global add @nestjs/cli
RUN yarn install

EXPOSE ${DATA_VALIDATOR_API_PORT}

CMD ["yarn", "run", "start"]
