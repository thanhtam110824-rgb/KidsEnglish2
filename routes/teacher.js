const express = require('express');
const fs = require('fs');
const path = require('path');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();
const dbPath = path.join(__dirname, '../db.json');

const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Read DB Error:', error);
    return { users: [], lessons: [], quizzes: [] };
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Write DB Error:', error);
  }
};

// ===== GET DASHBOARD =====
router.get('/dashboard', authMiddleware, roleMiddleware(['teacher']), (req, res) => {
  try {
    const db = readDB();
    const teacher = db.users.find(u => u.id === req.user.userId && u.role === 'teacher');

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const classStudents = db.users?.filter(u => u.role === 'student' && teacher.classes?.includes(u.class)) || [];
    const teacherLessons = db.lessons?.filter(l => l.teacherId === teacher.id) || [];
    const teacherQuizzes = db.quizzes?.filter(q => q.teacherId === teacher.id) || [];

    res.json({
      success: true,
      teacher: {
        id: teacher.id,
        fullName: teacher.fullName,
        email: teacher.email,
        classes: teacher.classes
      },
      students: classStudents,
      lessons: teacherLessons,
      quizzes: teacherQuizzes,
      chats: db.chats?.filter(c => classStudents.some(s => s.id === c.studentId)) || [],
      stats: {
        totalStudents: classStudents.length,
        totalLessons: teacherLessons.length,
        totalQuizzes: teacherQuizzes.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET LESSONS =====
router.get('/lessons', authMiddleware, roleMiddleware(['teacher']), (req, res) => {
  try {
    const db = readDB();
    const lessons = db.lessons?.filter(l => l.teacherId === req.user.userId) || [];

    res.json({ success: true, data: lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== CREATE LESSON =====
router.post('/lessons', authMiddleware, roleMiddleware(['teacher']), (req, res) => {
  try {
    const { title, description, content, videoUrl } = req.body;
    const db = readDB();
    const teacher = db.users.find(u => u.id === req.user.userId);

    const newLesson = {
      id: Math.max(...(db.lessons || []).map(l => l.id), 0) + 1,
      title,
      description,
      content,
      videoUrl,
      teacherId: teacher.id,
      teacher: teacher.fullName,
      class: teacher.classes?.[0] || 'Lớp 2',
      duration: 15,
      createdAt: new Date(),
      completedBy: [],
      avgRating: 0
    };

    if (!db.lessons) db.lessons = [];
    db.lessons.push(newLesson);
    writeDB(db);

    res.status(201).json({ success: true, message: 'Bài giảng đã được thêm', lesson: newLesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== DELETE LESSON =====
router.delete('/lessons/:id', authMiddleware, roleMiddleware(['teacher']), (req, res) => {
  try {
    const db = readDB();
    const index = db.lessons?.findIndex(l => l.id === parseInt(req.params.id));

    if (index === -1 || index === undefined) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    db.lessons.splice(index, 1);
    writeDB(db);

    res.json({ success: true, message: 'Bài giảng đã được xóa' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET QUIZZES =====
router.get('/quizzes', authMiddleware, roleMiddleware(['teacher']), (req, res) => {
  try {
    const db = readDB();
    const quizzes = db.quizzes?.filter(q => q.teacherId === req.user.userId) || [];

    res.json({ success: true, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== CREATE QUIZ =====
router.post('/quizzes', authMiddleware, roleMiddleware(['teacher']), (req, res) => {
  try {
    const { title, type, description, questions } = req.body;
    const db = readDB();
    const teacher = db.users.find(u => u.id === req.user.userId);

    const newQuiz = {
      id: Math.max(...(db.quizzes || []).map(q => q.id), 0) + 1,
      title,
      type,
      description,
      questions,
      teacherId: teacher.id,
      teacher: teacher.fullName,
      class: teacher.classes?.[0] || 'Lớp 2',
      maxScore: 10,
      completedBy: [],
      avgScore: 0,
      createdAt: new Date()
    };

    if (!db.quizzes) db.quizzes = [];
    db.quizzes.push(newQuiz);
    writeDB(db);

    res.status(201).json({ success: true, message: 'Bài quiz đã được thêm', quiz: newQuiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== DELETE QUIZ =====
router.delete('/quizzes/:id', authMiddleware, roleMiddleware(['teacher']), (req, res) => {
  try {
    const db = readDB();
    const index = db.quizzes?.findIndex(q => q.id === parseInt(req.params.id));

    if (index === -1 || index === undefined) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    db.quizzes.splice(index, 1);
    writeDB(db);

    res.json({ success: true, message: 'Bài quiz đã được xóa' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== REPLY CHAT =====
router.put('/chat/reply/:chatId', authMiddleware, roleMiddleware(['teacher']), (req, res) => {
  try {
    const { reply } = req.body;
    const db = readDB();
    const chat = db.chats?.find(c => c.id === parseInt(req.params.chatId));

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    chat.reply = reply;
    chat.replyTime = new Date();
    writeDB(db);

    res.json({ success: true, message: 'Đã trả lời', chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== UPDATE GRADE =====
router.put('/grade/:studentId', authMiddleware, roleMiddleware(['teacher']), (req, res) => {
  try {
    const { score, comment } = req.body;
    const db = readDB();
    const student = db.users.find(u => u.id === parseInt(req.params.studentId));

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.score = score;
    student.comment = comment;
    student.gradedAt = new Date();

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

module.exports = router;