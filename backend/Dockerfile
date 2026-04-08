# Sử dụng môi trường Node.js nhỏ gọn
FROM node:18-alpine

# Thư mục làm việc trong container
WORKDIR /app

# Copy các file quản lý thư viện và cài đặt
COPY package*.json ./
RUN npm install

# Copy toàn bộ mã nguồn backend vào (ngoại trừ .dockerignore nếu có)
COPY . .

# Mở cổng 9000
EXPOSE 9000

# Chạy server
CMD ["npm", "start"]
