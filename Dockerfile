FROM node:14.9.0-alpine3.12
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package*.json /usr/src/app/
COPY ./ /usr/src/app
RUN npm install
ENV NODE_ENV production
ENV PORT 80
EXPOSE 80
RUN ["npm", "run", "build"]
RUN ["npx", "prisma", "generate"]
CMD ["npm", "run", "launch"]
