FROM node:lts
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]