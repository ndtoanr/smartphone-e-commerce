# Bước 1: Build mã nguồn React/Vite
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Bước 2: Dùng Nginx để chạy giao diện thay vì Node.js
FROM nginx:alpine

# Tạo file cấu hình Nginx để hỗ trợ React Router (tránh lỗi 404 khi tải lại trang)
RUN rm -rf /etc/nginx/conf.d
RUN mkdir -p /etc/nginx/conf.d
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html index.htm; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

# Lấy thư mục dist vừa build đổ vào Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
