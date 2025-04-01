# Base image
FROM node:20-alpine

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .
COPY .env ./
# COPY .env .env

# Creates a "dist" folder with the production build
RUN npx prisma db push
RUN npm run build

# Expose the port on which the app will run
EXPOSE 3000

# Start the server using the production build
# CMD ["npm", "run", "start"]
CMD ["node", "dist/main"]
