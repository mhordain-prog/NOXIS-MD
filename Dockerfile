FROM node:20-alpine

WORKDIR /app

# Install system dependencies required by npm packages and audio conversion
RUN apk add --no-cache git python3 ffmpeg

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode < 200 || r.statusCode >= 300) throw new Error(r.statusCode)})"

CMD ["npm", "start"]
