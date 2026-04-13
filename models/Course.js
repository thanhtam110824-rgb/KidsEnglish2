class Course {
  constructor(id, title, description, level = 'grade2', createdBy) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.level = level;
    this.units = [];
    this.lessons = [];
    this.assignments = [];
    this.isActive = true;
    this.createdBy = createdBy;
    this.createdAt = new Date();
  }

  addLesson(lesson) {
    this.lessons.push(lesson);
  }

  addAssignment(assignment) {
    this.assignments.push(assignment);
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      level: this.level,
      units: this.units.length,
      lessons: this.lessons.length,
      assignments: this.assignments.length,
      isActive: this.isActive,
      createdBy: this.createdBy,
      createdAt: this.createdAt
    };
  }
}

module.exports = Course;