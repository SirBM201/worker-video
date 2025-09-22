# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Create and change to the app directory.
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Bundle app source
COPY . .

# Your app binds to port 5000, so you need to expose it
EXPOSE 5000

# Define the command to run your app
CMD [ "node", "index.js" ]