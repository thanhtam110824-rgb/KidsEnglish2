const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();
const dbPath = path.join(__dirname, '../db.json');

function readDB() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading DB:', error);
  }
  return { users: [] };
}

function writeDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing DB:', error);
    return false;
  }
}

// ===== LOGIN =====
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:', email);
    
    const db = readDB();

    if (!db.users || db.users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Database trống'
      });
    }

    const user = db.users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email không tồn tại'
      });
    }

    // So sánh password
    const passwordMatch = user.password === password; // Plain text cho demo

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không đúng'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful:', user.fullName);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token: token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        class: user.class
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== REGISTER =====
router.post('/register', (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const db = readDB();

    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({
        success: false,
        message: 'Email đã tồn tại'
      });
    }

    const newUser = {
      id: Math.max(...db.users.map(u => u.id), 0) + 1,
      fullName: fullName,
      email: email,
      password: password,
      role: role || 'student',
      class: role === 'student' ? 'Lớp 2' : undefined,
      classes: role === 'teacher' ? ['Lớp 2'] : undefined,
      progress: 0,
      score: 0,
      createdAt: new Date()
    };

    db.users.push(newUser);
    writeDB(db);

    console.log('✅ User registered:', fullName);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Đăng ký thành công',
      token: token,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;