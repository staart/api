FROM node:lts-alpine
RUN apk add --no-cache udev ttf-freefont chromium git
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV CHROMIUM_PATH /usr/bin/chromium-browser
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
CMD ["npm", "run", "start:prod"]
