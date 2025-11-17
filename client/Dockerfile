# Stage 1: Build
FROM node:20-alpine AS build

# *** FIX APPLIED HERE ***
# 1. Accept the URL as a build argument
ARG VITE_BACKEND_URL

# 2. Set it as an environment variable so `npm run build` can access it
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
# *** END OF FIX ***

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production=false

# Copy all files
COPY . .

# Build the frontend.
# `npm run build` will now see the VITE_BACKEND_URL env variable.
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]