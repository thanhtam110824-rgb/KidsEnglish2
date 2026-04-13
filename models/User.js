class User {
  constructor(id, fullName, email, password, role, class_name = '', createdAt = new Date()) {
    this.id = id;
    this.fullName = fullName;
    this.email = email;
    this.password = password;
    this.role = role; // 'admin', 'teacher', 'student', 'parent'
    this.class = class_name;
    this.isActive = true;
    this.createdAt = createdAt;
    this.lastLogin = null;
  }

  toJSON() {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      role: this.role,
      class: this.class,
      isActive: this.isActive,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin
    };
  }
}

module.exports = User;