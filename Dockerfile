FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev
COPY . .
# الطلبات بتتحفظ هنا؛ اربط volume دايم على المسار ده لو الاستضافة بتدعمه
ENV DATA_DIR=/app/storage
RUN mkdir -p /app/storage && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "server.js"]
