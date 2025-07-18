# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application using a lightweight web server
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Copy the nginx config file if you have one
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]