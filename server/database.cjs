const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../database.json');

// Initialize with default structure if not exists
if (!fs.existsSync(dbPath)) {
  const defaultData = {
    users: [],
    courses: [],
    episodes: [],
    quizzes: [],
    quiz_questions: [],
    episode_progress: [],
    enrollments: [],
    certificates: [],
    library_resources: [],
    announcements: [],
    quiz_results: [],
    system_activity_logs: [],
    community_posts: [],
    messages: []
  };
  fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
}

class JsonDb {
  constructor() {
    this.data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }

  save() {
    fs.writeFileSync(dbPath, JSON.stringify(this.data, null, 2));
  }

  exec(sql) {
    // Basic table creation is handled by the default structure
    // We can ignore CREATE TABLE statements for now
    console.log('[JSON DB] Executing SQL (Ignored):', sql.substring(0, 50) + '...');
  }

  prepare(sql) {
    const db = this;
    return {
      get: (...args) => {
        return this.query('get', sql, args);
      },
      all: (...args) => {
        return this.query('all', sql, args);
      },
      run: (...args) => {
        return this.query('run', sql, args);
      }
    };
  }

  transaction(fn) {
    return (...args) => {
      // JSON implementation is inherently synchronous and simple for now
      return fn(...args);
    };
  }

  query(type, sql, args) {
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();

    // --- USERS ---
    if (normalizedSql.includes('FROM users WHERE LOWER(email) = LOWER(?)')) {
      const email = args[0];
      return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    if (normalizedSql.startsWith('INSERT INTO users')) {
      let newUser = {};
      // Handle both positional and named arguments
      if (args.length === 1 && typeof args[0] === 'object') {
        newUser = { ...args[0] };
      } else {
        // Positional args mapping would be needed here if used in other places
      }
      this.data.users.push(newUser);
      this.save();
      return { lastInsertRowid: newUser.id, changes: 1 };
    }

    if (normalizedSql.includes('UPDATE users SET emailVerified = 1')) {
      const id = args[0];
      const user = this.data.users.find(u => u.id === id);
      if (user) {
        user.emailVerified = 1;
        user.verificationCode = null;
        user.verificationExpiry = null;
        this.save();
      }
      return { changes: 1 };
    }

    if (normalizedSql.includes('SELECT id, email, name, role, points, level, avatar FROM users WHERE id = ?')) {
      const id = args[0];
      return this.data.users.find(u => u.id === id);
    }

    if (normalizedSql.includes('SELECT id, name, email, role, points, level, joinDate, status FROM users')) {
      return this.data.users.map(({ id, name, email, role, points, level, joinDate, status }) => ({ id, name, email, role, points, level, joinDate, status }));
    }

    // --- COURSES ---
    if (normalizedSql === 'SELECT * FROM courses') {
      return this.data.courses;
    }

    if (normalizedSql.includes('SELECT * FROM courses WHERE id = ?')) {
      const id = args[0];
      return this.data.courses.find(c => c.id === id);
    }

    if (normalizedSql.startsWith('INSERT INTO courses')) {
      const course = args[0];
      this.data.courses.push(course);
      this.save();
      return { changes: 1 };
    }

    // --- EPISODES ---
    if (normalizedSql.includes('SELECT * FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC')) {
      const courseId = args[0];
      return this.data.episodes
        .filter(e => e.courseId === courseId)
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    }

    if (normalizedSql.startsWith('INSERT INTO episodes')) {
      const ep = args[0];
      this.data.episodes.push(ep);
      this.save();
      return { changes: 1 };
    }

    if (normalizedSql.includes('DELETE FROM episodes WHERE courseId = ?')) {
      const courseId = args[0];
      this.data.episodes = this.data.episodes.filter(e => e.courseId !== courseId);
      this.save();
      return { changes: 1 };
    }

    // --- LIBRARY ---
    if (normalizedSql === 'SELECT * FROM library_resources') {
      return this.data.library_resources;
    }

    // --- COMMUNITY ---
    if (normalizedSql === 'SELECT * FROM community_posts') {
      return this.data.community_posts;
    }

    // --- ANNOUNCEMENTS ---
    if (normalizedSql.includes('SELECT * FROM announcements ORDER BY created_at DESC')) {
      return [...this.data.announcements].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    if (normalizedSql.startsWith('INSERT INTO announcements')) {
      const [id, title, content, type, priority, is_active] = args;
      this.data.announcements.push({ id, title, content, type, priority, is_active, created_at: new Date().toISOString() });
      this.save();
      return { changes: 1 };
    }

    // --- QUIZZES ---
    if (normalizedSql === 'SELECT * FROM quizzes') {
      return this.data.quizzes;
    }

    if (normalizedSql.includes('SELECT * FROM quiz_questions WHERE quizId = ?')) {
      const quizId = args[0];
      return this.data.quiz_questions.filter(q => q.quizId === quizId);
    }

    // Fallback for counts or basic Selects
    if (normalizedSql.includes('SELECT count(*) as count FROM')) {
      const table = normalizedSql.split('FROM ')[1].trim();
      return { count: (this.data[table] || []).length };
    }

    console.warn('[JSON DB] Unhandled SQL:', normalizedSql, args);
    return type === 'all' ? [] : null;
  }
}

const db = new JsonDb();

function initDatabase() {
  console.log('Initializing JSON database...');
  // Check if seeding is needed
  if (db.data.users.length === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  console.log('Seeding JSON database from db.json...');
  try {
    const dbJsonPath = path.join(__dirname, '../db.json');
    if (fs.existsSync(dbJsonPath)) {
      const data = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
      if (data.users) {
        db.data.users = data.users.map(user => ({
          ...user,
          password: user.password.startsWith('$2a$') ? user.password : bcrypt.hashSync(user.password || '123456', 10),
          emailVerified: 1
        }));
      }
      if (data.courses) db.data.courses = data.courses;
      db.save();
      console.log('JSON Database seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding JSON database:', err);
  }
}

module.exports = {
  db,
  initDatabase
};
