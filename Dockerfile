# Base image
FROM node:20-alpine

# Install openssl & tools for Prisma
RUN apk add --no-cache openssl

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .
# COPY .env .env
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Creates a "dist" folder with the production build
RUN npx prisma generate
RUN npm run build

# Expose the port on which the app will run
EXPOSE 3000

# Start the server using the production build
# CMD ["npm", "run", "start"]
# CMD ["node", "dist/main"]
ENTRYPOINT ["sh", "./entrypoint.sh"]
