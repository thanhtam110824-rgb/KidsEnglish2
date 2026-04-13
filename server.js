const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ===== 1. CẤU HÌNH MIDDLEWARE =====
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ===== 2. KHAI BÁO THƯ MỤC GIAO DIỆN (PUBLIC) =====
app.use(express.static(path.join(__dirname, 'public')));

// ===== 3. KẾT NỐI API (TỪ THƯ MỤC ROUTES) =====
// Gọi các file admin.js và auth.js mà bạn đã viết
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// ===== 4. ĐIỀU HƯỚNG TRANG WEB =====
// Khi gõ /admin sẽ tự động mở file admin.html
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Trang đăng nhập
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Trang chủ mặc định cũng là đăng nhập
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 
app.get('/teacher', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'giaovien.html')); 
});

app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'hocvien.html')); 
});
// ===== 5. XỬ LÝ LỖI =====
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Đường dẫn không tồn tại!' });
});

// ===== 6. KHỞI CHẠY SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 KidsEnglish Server đang chạy tại Port: ${PORT}`);
    console.log(`🔑 Cổng Đăng nhập: http://localhost:${PORT}/login`);
    console.log(`💻 Giao diện Admin: http://localhost:${PORT}/admin`);
    console.log(`=================================================\n`);
});