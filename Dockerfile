# Use Node.js as base image
FROM --platform=linux/amd64 node:latest

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Build the TypeScript code
RUN npm run tsc

# Expose the port your app runs on
EXPOSE 3000

# Command to run your app
CMD ["node", "./dist/index.js"]