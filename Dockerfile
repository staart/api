FROM node:14.15.3-alpine3.11
ENV NODE_ENV production
ENV PORT 80
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV CHROMIUM_PATH /usr/bin/chromium-browser
RUN apk add --no-cache udev ttf-freefont chromium git g++ gcc libgcc libstdc++ linux-headers make python build-base cairo-dev jpeg-dev pango-dev musl-dev giflib-dev pixman-dev pangomm-dev libjpeg-turbo-dev freetype-dev
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN ["npm", "ci", "--also=dev"]
COPY prisma .
RUN ["npx", "prisma", "generate"]
COPY . .
RUN ["npm", "run", "build"]
EXPOSE 80
WORKDIR /usr/src/app
CMD ["npm", "run", "start:prod"]
