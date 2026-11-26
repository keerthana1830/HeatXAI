FROM node:20-alpine

WORKDIR /app

# Copy package configurations
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

EXPOSE 5173

# CMD to start the Vite dev server bound to 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
