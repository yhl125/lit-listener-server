FROM node:20-alpine As build
WORKDIR /app
COPY . .
RUN yarn
RUN yarn build


FROM node:20-alpine As production

WORKDIR /app

COPY --from=build /app/dist dist
COPY --from=build /app/node_modules node_modules

CMD [ "node", "dist/main.js" ]

