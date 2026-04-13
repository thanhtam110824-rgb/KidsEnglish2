const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

async function generateAIResponse(userMessage, studentName = 'em') {
  try {
    const systemPrompt = `Bạn là một cô giáo tiếng Anh thân thiện và kiên nhẫn dạy cho trẻ em lớp 2. 
    Tên học sinh là: ${studentName}
    
    Hướng dẫn:
    - Trả lời bằng tiếng Việt với cách nói thân thiện, hướng tới trẻ em
    - Giải thích từ vựng tiếng Anh một cách đơn giản
    - Khi học sinh hỏi về phát âm, hãy viết phonetic IPA
    - Khuyến khích học sinh học tập
    - Trả lời ngắn gọn, dễ hiểu
    - Sử dụng emoji để làm vui hơn
    - Nếu học sinh hỏi không liên quan đến học tiếng Anh, hãy dẫn họ quay lại học tập
    
    Học sinh hỏi: "${userMessage}"
    
    Hãy trả lời một cách thân thiện và hữu ích.`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    return 'Xin lỗi, cô gặp lỗi tạm thời. Hãy thử lại nhé! 😊';
  }
}

module.exports = { generateAIResponse };