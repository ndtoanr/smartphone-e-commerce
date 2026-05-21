# Smartphone E-commerce Platform

Chào mừng bạn đến với dự án **Smartphone E-commerce**! Đây là một nền tảng thương mại điện tử chuyên dụng để bán lẻ điện thoại thông minh, đi kèm với các tính năng quản lý sản phẩm, đơn hàng dành cho Admin và trải nghiệm mua sắm mượt mà dành cho Khách hàng.

## 🚀 Công nghệ sử dụng

Dự án được chia thành hai phần chính: Frontend và Backend.

### Frontend (Giao diện người dùng)
- **Framework:** React.js (Sử dụng Vite để build nhanh và tối ưu).
- **Styling:** Tailwind CSS cho giao diện hiện đại và Responsive.
- **Routing:** React Router v6.
- **Quản lý State & Call API:** React Hooks, Axios.
- **Thư viện khác:** 
  - `recharts`: Vẽ biểu đồ thống kê cho Admin Dashboard.
  - `react-hot-toast`: Hiển thị thông báo (toast notifications) đẹp mắt.
  - `qrcode.react`: Hỗ trợ tạo mã QR (thanh toán/chia sẻ).

### Backend (Máy chủ & API)
- **Runtime & Framework:** Node.js, Express.js.
- **Cơ sở dữ liệu:** MongoDB với Mongoose (Hỗ trợ quản lý dữ liệu linh hoạt).
- **Xác thực (Authentication):** JWT (JSON Web Token) kết hợp bcryptjs để mã hóa mật khẩu. (Có hỗ trợ đăng nhập Google).
- **Upload File:** Multer (Quản lý hình ảnh sản phẩm/banner).
- **Gửi Email:** Nodemailer (Gửi email thông báo đơn hàng).

### Triển khai & Khác
- **Docker:** Cung cấp sẵn file `docker-compose.yml` để dễ dàng thiết lập môi trường chạy ứng dụng.

---

## 🌟 Tính năng nổi bật

### Dành cho Khách hàng
- Xem danh sách điện thoại, lọc sản phẩm theo danh mục/thương hiệu, tình trạng (Mới/Cũ).
- Xem chi tiết sản phẩm: Bao gồm lựa chọn biến thể (Màu sắc, Dung lượng lưu trữ) với giá và số lượng tồn kho tương ứng.
- Giỏ hàng & Thanh toán.
- Quản lý tài khoản: Xem lịch sử đơn hàng, chi tiết từng đơn hàng, nhận thông báo trạng thái đơn hàng.

### Dành cho Quản trị viên (Admin)
- **Bảng điều khiển (Dashboard):** Xem thống kê tổng quan, biểu đồ doanh thu (chỉ tính các đơn đã giao thành công).
- **Quản lý Sản phẩm & Biến thể:** Thêm, sửa, xóa sản phẩm. Quản lý chi tiết biến thể (Màu sắc, dung lượng) kèm theo số lượng tồn kho.
- **Quản lý Đơn hàng:** Xem, cập nhật trạng thái đơn hàng. Tự động cập nhật số lượng tồn kho khi đơn hàng thay đổi trạng thái.
- Phân quyền rõ ràng, ngăn chặn người dùng không có quyền truy cập vào khu vực Admin.

---

## 🛠 Hướng dẫn Cài đặt & Chạy ứng dụng

Bạn có thể chạy dự án thông qua Docker (Khuyên dùng) hoặc chạy thủ công bằng Node.js.

### Cách 1: Sử dụng Docker (Nhanh nhất)
Yêu cầu đã cài đặt Docker và Docker Compose trên máy tính.

1. Mở terminal tại thư mục gốc của dự án (`d:\Smartphone`).
2. Chạy lệnh sau để build và khởi động các container:
   ```bash
   docker-compose up -d --build
   ```
3. Sau khi khởi động thành công:
   - Frontend sẽ chạy tại: `http://localhost:80`
   - Backend sẽ chạy tại: `http://localhost:9000`

### Cách 2: Chạy thủ công (Dành cho nhà phát triển)

**1. Thiết lập Backend:**
- Di chuyển vào thư mục backend: `cd backend`
- Cài đặt các dependencies: `npm install`
- Sao chép file `.env.example` thành `.env` và điền các thông tin kết nối CSDL MongoDB, cấu hình JWT, Nodemailer, v.v.
- Chạy seed dữ liệu mẫu (nếu cần): `npm run seed`
- Khởi động server (chế độ dev): `npm run dev` (Server mặc định chạy ở cổng 9000).

**2. Thiết lập Frontend:**
- Mở một terminal mới, di chuyển vào thư mục frontend: `cd frontend`
- Cài đặt các dependencies: `npm install`
- Khởi động giao diện (chế độ dev): `npm run dev`
- Truy cập vào đường dẫn mà Vite cung cấp (thường là `http://localhost:5173`).

---

## 📂 Cấu trúc thư mục chính

```text
d:\Smartphone\
├── backend/            # Chứa mã nguồn API, models, controllers, cấu hình CSDL
│   ├── models/         # Định nghĩa các schema MongoDB (VD: Banner, BuyingAdvice...)
│   ├── server.js       # File khởi chạy server chính
│   └── package.json
├── frontend/           # Chứa mã nguồn giao diện người dùng (React/Vite)
│   ├── src/            
│   │   ├── components/ # Các UI components dùng chung (VD: AdminLayout)
│   │   ├── pages/      # Các trang chính (VD: HomePage, Checkout)
│   │   └── App.jsx     # Cấu hình Routing chính
│   └── package.json
├── docker-compose.yml  # File cấu hình chạy dự án với Docker
└── README.md           # File tài liệu dự án
```

---

## 📝 Lưu ý
Dự án này là kết quả của quá trình phát triển liên tục với các tính năng phức tạp như quản lý tồn kho theo biến thể, phân quyền bảo mật, thông báo thời gian thực và quản lý đơn hàng. Các tính năng luôn được tối ưu và cải tiến về mặt giao diện (UI/UX) cũng như logic (Backend).
