FROM node:14.9.0-alpine3.12
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY ./package.json /usr/src/app/
RUN npm install && npm cache clean --force
COPY ./ /usr/src/app
ENV NODE_ENV production
ENV PORT 80
EXPOSE 80
RUN ["npm", "run", "build"]
CMD ["npm", "run", "launch"]
