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
    return { users: [], lessons: [], quizzes: [], chats: [], grades: [] };
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
router.get('/dashboard', authMiddleware, roleMiddleware(['student']), (req, res) => {
  try {
    const db = readDB();
    const student = db.users.find(u => u.id === req.user.userId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({
      success: true,
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        class: student.class,
        progress: student.progress,
        score: student.score
      },
      lessons: db.lessons || [],
      quizzes: db.quizzes || [],
      speaking: db.speaking || [],
      chats: db.chats?.filter(c => c.studentId === student.id) || [],
      grade: db.grades?.find(g => g.studentId === student.id) || {}
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET GRADE =====
router.get('/grade', authMiddleware, roleMiddleware(['student']), (req, res) => {
  try {
    const db = readDB();
    const student = db.users.find(u => u.id === req.user.userId);

    res.json({
      success: true,
      score: student.score || '--',
      comment: student.comment || 'Cô giáo chưa gửi nhận xét'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET LESSONS =====
router.get('/lessons', authMiddleware, roleMiddleware(['student']), (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, data: db.lessons || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET QUIZZES =====
router.get('/quizzes', authMiddleware, roleMiddleware(['student']), (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, data: db.quizzes || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== SUBMIT QUIZ =====
router.post('/quiz/submit', authMiddleware, roleMiddleware(['student']), (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const db = readDB();
    const quiz = db.quizzes?.find(q => q.id === parseInt(quizId));
    const student = db.users.find(u => u.id === req.user.userId);

    if (!quiz || !student) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    let correctCount = 0;
    quiz.questions?.forEach((q, idx) => {
      if (answers[idx] === q.correct) correctCount++;
    });

    const score = Math.round((correctCount / (quiz.questions?.length || 1)) * 10);

    if (!student.score || score > student.score) {
      student.score = score;
    }

    writeDB(db);

    res.json({
      success: true,
      score: score,
      correctCount: correctCount,
      totalQuestions: quiz.questions?.length || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== RECORD SPEAKING =====
router.post('/speaking/record', authMiddleware, roleMiddleware(['student']), (req, res) => {
  try {
    const { speakingId, score } = req.body;
    const db = readDB();
    const speaking = db.speaking?.find(s => s.id === parseInt(speakingId));
    const student = db.users.find(u => u.id === req.user.userId);

    if (!speaking || !student) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    if (!speaking.studentAttempts) speaking.studentAttempts = [];
    speaking.studentAttempts.push({
      studentId: student.id,
      studentName: student.fullName,
      score: score,
      attempts: 1,
      recordedDate: new Date()
    });

    writeDB(db);

    res.json({
      success: true,
      message: 'Luyện nói thành công!',
      score: score
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== SEND CHAT =====
router.post('/chat', authMiddleware, roleMiddleware(['student']), (req, res) => {
  try {
    const { message } = req.body;
    const db = readDB();
    const student = db.users.find(u => u.id === req.user.userId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const newChat = {
      id: Math.max(...(db.chats || []).map(c => c.id), 0) + 1,
      studentId: student.id,
      studentName: student.fullName,
      message: message,
      sender: 'student',
      timestamp: new Date(),
      reply: generateAIReply(message),
      replyTime: new Date(Date.now() + 5000)
    };

    if (!db.chats) db.chats = [];
    db.chats.push(newChat);
    writeDB(db);

    res.json({ success: true, chat: newChat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET CHATS =====
router.get('/chat', authMiddleware, roleMiddleware(['student']), (req, res) => {
  try {
    const db = readDB();
    const student = db.users.find(u => u.id === req.user.userId);
    const chats = (db.chats || []).filter(c => c.studentId === student.id);

    res.json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

function generateAIReply(question) {
  const lowerQ = question.toLowerCase();
  
  if (lowerQ.includes('hello') || lowerQ.includes('xin chào')) {
    return '👋 Xin chào em! Hôm nay em muốn học gì?';
  }
  if (lowerQ.includes('vocabulary') || lowerQ.includes('từ vựng')) {
    return '📚 Cô sẽ giúp em học từ vựng mới!';
  }
  if (lowerQ.includes('pronounce') || lowerQ.includes('phát âm')) {
    return '🎤 Luyện nói rất quan trọng!';
  }
  
  return '🤔 Em hỏi hay quá! Cô cần thêm thông tin để trả lời em nhé.';
}

module.exports = router;