FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN apt-get update && apt-get install -y python3 make g++ && npm install --omit=dev && apt-get purge -y python3 make g++ && apt-get autoremove -y
COPY . .
ENV PORT=3000 DB_FILE=/data/su-portal.db
VOLUME /data
EXPOSE 3000
CMD ["node","server/server.js"]
