const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const dbPath = path.join(__dirname, '../db.json');

const readDB = () => {
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (error) {
    return { users: [], lessons: [], quizzes: [], classes: [] };
  }
};

const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

router.get('/stats', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  try {
    const db = readDB();
    const students = db.users?.filter(u => u.role === 'student') || [];
    const teachers = db.users?.filter(u => u.role === 'teacher') || [];

    res.json({
      success: true,
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalAssignments: db.quizzes?.length || 0,
      totalClasses: db.classes?.length || 0,
      chart: {
        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
        visitData: [2, 3, 1, 5, 2, 4, 1]
      },
      allData: db
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/students', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  try {
    const db = readDB();
    const students = db.users?.filter(u => u.role === 'student') || [];
    res.json({
      success: true,
      students: students.map(s => ({
        id: s.id,
        name: s.fullName,
        email: s.email,
        class: s.class,
        progress: s.progress,
        score: s.score
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/teachers', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  try {
    const db = readDB();
    const teachers = db.users?.filter(u => u.role === 'teacher') || [];
    res.json({
      success: true,
      teachers: teachers.map(t => ({
        id: t.id,
        name: t.fullName,
        email: t.email,
        classes: t.classes || []
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/classes', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  try {
    const db = readDB();
    res.json({
      success: true,
      classes: db.classes || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/content', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  try {
    const db = readDB();
    const content = [
      ...(db.lessons || []).map(l => ({ ...l, type: 'Bài Giảng' })),
      ...(db.quizzes || []).map(q => ({ ...q, type: 'Bài Tập' }))
    ];
    res.json({
      success: true,
      content: content
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/add-user', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const db = readDB();

    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
    }

    const newUser = {
      id: Math.max(...db.users.map(u => u.id), 0) + 1,
      fullName: name,
      email: email,
      password: password,
      role: role,
      class: role === 'student' ? 'Lớp 2' : undefined,
      classes: role === 'teacher' ? ['Lớp 2'] : undefined,
      progress: 0,
      score: 0,
      createdAt: new Date()
    };

    db.users.push(newUser);
    writeDB(db);

    res.json({
      success: true,
      message: 'Thêm tài khoản thành công',
      user: newUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/grade/:studentId', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  try {
    const { score, comment } = req.body;
    const db = readDB();
    const student = db.users.find(u => u.id === parseInt(req.params.studentId));

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.score = score;
    student.comment = comment;

    if (!db.grades) db.grades = [];
    db.grades.push({
      id: Math.max(...(db.grades || []).map(g => g.id), 0) + 1,
      studentId: student.id,
      studentName: student.fullName,
      class: student.class,
      score: score,
      comment: comment,
      updatedAt: new Date()
    });

    writeDB(db);

    res.json({ success: true, message: 'Cập nhật điểm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/user/:userId', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  try {
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === parseInt(req.params.userId));

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    db.users.splice(userIndex, 1);
    writeDB(db);

    res.json({ success: true, message: 'Xóa tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// ===== TẠO LỚP HỌC =====
router.post('/add-class', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  try {
    const { name, teacherName, capacity } = req.body;
    const db = readDB();
    if (!db.classes) db.classes = [];

    const newClass = {
      id: Math.max(...db.classes.map(c => c.id || 0), 0) + 1,
      name, teacherName, capacity: parseInt(capacity) || 30,
      students: [], status: 'active', createdAt: new Date()
    };

    db.classes.push(newClass);
    writeDB(db);
    res.json({ success: true, message: 'Tạo lớp thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== THÊM NỘI DUNG =====
router.post('/add-content', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  try {
    const { title, type, unit, createdBy } = req.body;
    const db = readDB();

    const newItem = {
      id: Date.now(),
      title, type, unit,
      createdBy: createdBy || 'Admin',
      createdAt: new Date(),
      isActive: true
    };

    if (type.includes('Bài Giảng')) {
      if (!db.lessons) db.lessons = [];
      db.lessons.push(newItem);
    } else {
      if (!db.quizzes) db.quizzes = [];
      db.quizzes.push(newItem);
    }
    
    writeDB(db);
    res.json({ success: true, message: 'Thêm nội dung thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== XÓA LỚP / NỘI DUNG =====
router.delete('/item/:type/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  try {
    const db = readDB();
    const { type, id } = req.params;

    if (type === 'class') {
      db.classes = (db.classes || []).filter(c => String(c.id) !== String(id));
    } else if (type === 'content') {
      if (db.lessons) db.lessons = db.lessons.filter(l => String(l.id) !== String(id));
      if (db.quizzes) db.quizzes = db.quizzes.filter(q => String(q.id) !== String(id));
    }
    
    writeDB(db);
    res.json({ success: true, message: 'Xóa dữ liệu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = router;
// ===== API CHAT (GIÁO VIÊN & HỌC VIÊN) =====
router.post('/chat', authMiddleware, (req, res) => {
  try {
    const { receiverEmail, message } = req.body;
    const db = readDB();
    if (!db.chats) db.chats = [];

    db.chats.push({
      id: Date.now(),
      senderEmail: req.user.email,
      receiverEmail: receiverEmail,
      message: message,
      timestamp: new Date()
    });
    
    writeDB(db);
    res.json({ success: true, message: 'Đã gửi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/chat/:otherEmail', authMiddleware, (req, res) => {
  try {
    const db = readDB();
    const myEmail = req.user.email;
    const otherEmail = req.params.otherEmail;

    // Lọc ra đoạn hội thoại giữa 2 người
    const messages = (db.chats || []).filter(c => 
      (c.senderEmail === myEmail && c.receiverEmail === otherEmail) ||
      (c.senderEmail === otherEmail && c.receiverEmail === myEmail)
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});