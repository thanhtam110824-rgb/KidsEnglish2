class Lesson {
  constructor(id, title, description, content, duration = 20, videoUrl = '', createdBy) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.content = content;
    this.duration = duration; // minutes
    this.videoUrl = videoUrl;
    this.createdBy = createdBy;
    this.createdAt = new Date();
    this.isActive = true;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      content: this.content,
      duration: this.duration,
      videoUrl: this.videoUrl,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      isActive: this.isActive
    };
  }
}

module.exports = Lesson;