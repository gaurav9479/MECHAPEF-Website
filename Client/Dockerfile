FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Vite requires the --host flag to be accessible from outside the container
CMD ["npm", "run", "dev", "--", "--host"]
