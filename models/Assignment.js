class Assignment {
  constructor(id, title, type = 'mcq', createdBy) {
    this.id = id;
    this.title = title;
    this.type = type; // 'mcq', 'fill', 'speak'
    this.question = '';
    this.options = {}; // For MCQ
    this.correct = '';
    this.word = ''; // For speaking
    this.image = '';
    this.submissions = [];
    this.createdBy = createdBy;
    this.createdAt = new Date();
    this.isActive = true;
  }

  addSubmission(submission) {
    this.submissions.push(submission);
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      type: this.type,
      question: this.question,
      options: this.options,
      correct: this.correct,
      word: this.word,
      image: this.image,
      submissions: this.submissions.length,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      isActive: this.isActive
    };
  }
}

module.exports = Assignment;