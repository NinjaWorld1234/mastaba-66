const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Direct path to the main db.json file
const dbPath = path.join(__dirname, '../db.json');

// Ensure db.json exists with default structure if missing
if (!fs.existsSync(dbPath)) {
  const defaultData = {
    users: [
      {
        id: "1",
        name: "أحمد محمد",
        nameEn: "Ahmed Mohamed",
        email: "ahmed@example.com",
        password: "123456", // Will be hashed on first run
        role: "student",
        avatar: "https://ui-avatars.com/api/?name=Ahmed+M&background=064e3b&color=fff&size=100",
        points: 0,
        level: 1,
        streak: 0,
        joinDate: new Date().toISOString().split('T')[0],
        emailVerified: 1
      },
      {
        id: "2",
        name: "مدير النظام",
        nameEn: "System Admin",
        email: "admin@example.com",
        password: "admin123", // Will be hashed on first run
        role: "admin",
        avatar: "https://ui-avatars.com/api/?name=Admin&background=5E35B1&color=fff&size=100",
        points: 0,
        level: 0,
        streak: 0,
        joinDate: new Date().toISOString().split('T')[0]
      }
    ],
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
    messages: [],
    favorites: []
  };
  fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
}

class JsonDb {
  constructor() {
    this.reload();
  }

  reload() {
    try {
      this.data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (error) {
      console.error('Error reloading database:', error);
      this.data = { users: [] }; // Fallback
    }
  }

  save() {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  exec(sql) {
    console.log('[JSON DB] Executing SQL (Ignored):', sql.substring(0, 50) + '...');
  }

  prepare(sql) {
    // Reload data on every query to ensure we have the latest file state
    // (Optional, but good for dev if file is edited externally)
    this.reload();

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

  query(type, sql, args) {
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();

    // --- USERS ---
    if (normalizedSql.includes('FROM users WHERE LOWER(email) = LOWER(?)')) {
      const email = args[0];
      return this.data.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    }

    if (normalizedSql.startsWith('INSERT INTO users')) {
      let newUser = {};
      if (args.length === 1 && typeof args[0] === 'object') {
        newUser = { ...args[0] };
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
      return this.data.courses || [];
    }

    if (normalizedSql.includes('SELECT * FROM courses WHERE id = ?')) {
      const id = args[0];
      return (this.data.courses || []).find(c => c.id === id);
    }

    if (normalizedSql.startsWith('INSERT INTO courses')) {
      const course = args[0];
      if (!this.data.courses) this.data.courses = [];
      this.data.courses.push({ ...course, progress: 0, studentsCount: 0 });
      this.save();
      return { changes: 1 };
    }

    // --- EPISODES ---
    if (normalizedSql.includes('SELECT * FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC')) {
      const courseId = args[0];
      return (this.data.episodes || [])
        .filter(e => e.courseId === courseId)
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    }

    if (normalizedSql.startsWith('INSERT INTO episodes')) {
      const ep = args[0];
      if (!this.data.episodes) this.data.episodes = [];
      this.data.episodes.push(ep);
      this.save();
      return { changes: 1 };
    }

    if (normalizedSql.includes('DELETE FROM episodes WHERE courseId = ?')) {
      const courseId = args[0];
      if (this.data.episodes) {
        const initialLength = this.data.episodes.length;
        this.data.episodes = this.data.episodes.filter(e => e.courseId !== courseId);
        if (this.data.episodes.length !== initialLength) this.save();
      }
      return { changes: 1 };
    }

    // --- ENROLLMENTS & PROGRESS ---
    if (normalizedSql.includes('FROM enrollments WHERE user_id = ? AND course_id = ?')) {
      const [userId, courseId] = args;
      return (this.data.enrollments || []).find(e => e.user_id === userId && e.course_id === courseId);
    }

    if (normalizedSql.includes('INSERT OR REPLACE INTO enrollments') || normalizedSql.includes('UPSERT INTO enrollments')) {
      const payload = args[0];
      if (!this.data.enrollments) this.data.enrollments = [];

      const index = this.data.enrollments.findIndex(e => e.user_id === payload.user_id && e.course_id === payload.course_id);
      if (index !== -1) {
        this.data.enrollments[index] = { ...this.data.enrollments[index], ...payload };
      } else {
        this.data.enrollments.push({ id: Date.now(), ...payload });
      }
      this.save();
      return { changes: 1 };
    }

    if (normalizedSql.includes('FROM enrollments WHERE user_id = ? AND is_favorite = 1')) {
      const userId = args[0];
      return (this.data.enrollments || []).filter(e => e.user_id === userId && e.is_favorite);
    }

    if (normalizedSql.includes('UPSERT INTO episode_progress')) {
      const payload = args[0];
      if (!this.data.episode_progress) this.data.episode_progress = [];

      const index = this.data.episode_progress.findIndex(ep => ep.user_id === payload.user_id && ep.episode_id === payload.episode_id);
      if (index !== -1) {
        this.data.episode_progress[index] = { ...this.data.episode_progress[index], ...payload };
      } else {
        this.data.episode_progress.push({ id: Date.now(), ...payload });
      }
      this.save();
      return { changes: 1 };
    }

    // --- CERTIFICATES ---
    if (normalizedSql.includes('FROM certificates WHERE user_id = ?')) {
      const userId = args[0];
      return (this.data.certificates || []).filter(c => c.user_id === userId);
    }

    if (normalizedSql.startsWith('INSERT INTO certificates')) {
      const cert = args[0];
      if (!this.data.certificates) this.data.certificates = [];
      this.data.certificates.push({ ...cert, created_at: cert.created_at || new Date().toISOString() });
      this.save();
      return { changes: 1 };
    }

    // --- LIBRARY ---
    if (normalizedSql === 'SELECT * FROM library_resources') {
      return this.data.library_resources || [];
    }

    // --- COMMUNITY ---
    if (normalizedSql === 'SELECT * FROM community_posts') {
      return this.data.community_posts || null;
    }

    // --- ANNOUNCEMENTS ---
    if (normalizedSql.includes('SELECT * FROM announcements ORDER BY created_at DESC')) {
      return [...(this.data.announcements || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    if (normalizedSql.startsWith('INSERT INTO announcements')) {
      const data = args[0];
      const id = data.id || Date.now().toString();
      if (!this.data.announcements) this.data.announcements = [];
      this.data.announcements.push({ ...data, id, created_at: new Date().toISOString() });
      this.save();
      return { changes: 1 };
    }

    // --- QUIZZES ---
    if (normalizedSql === 'SELECT * FROM quizzes') {
      return this.data.quizzes || [];
    }

    if (normalizedSql.includes('SELECT * FROM quiz_questions WHERE quizId = ?')) {
      const quizId = args[0];
      return (this.data.quiz_questions || []).filter(q => q.quizId === quizId);
    }

    if (normalizedSql.startsWith('INSERT INTO quiz_results')) {
      const result = args[0];
      if (!this.data.quiz_results) this.data.quiz_results = [];
      this.data.quiz_results.push({ id: Date.now(), ...result, completedAt: new Date().toISOString() });
      this.save();
      return { changes: 1 };
    }

    if (normalizedSql.includes('FROM quiz_results WHERE userId = ?')) {
      const userId = args[0];
      return (this.data.quiz_results || []).filter(r => r.userId === userId);
    }

    // --- MESSAGES ---
    if (normalizedSql.includes('FROM messages WHERE (senderId = ? OR receiverId = ?)')) {
      const [userId1, userId2] = args;
      return (this.data.messages || []).filter(m => m.senderId === userId1 || m.receiverId === userId1);
    }

    if (normalizedSql.startsWith('INSERT INTO messages')) {
      const msg = args[0];
      if (!this.data.messages) this.data.messages = [];
      this.data.messages.push({ id: Date.now().toString(), ...msg, read: 0, timestamp: new Date().toISOString() });
      this.save();
      return { changes: 1 };
    }

    if (normalizedSql.includes('UPDATE messages SET read = 1 WHERE id = ?')) {
      const id = args[0];
      const msg = (this.data.messages || []).find(m => m.id === id);
      if (msg) {
        msg.read = 1;
        this.save();
      }
      return { changes: 1 };
    }

    // --- ACTIVITY LOGS ---
    if (normalizedSql.includes('FROM system_activity_logs ORDER BY timestamp DESC')) {
      return [...(this.data.system_activity_logs || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    if (normalizedSql.startsWith('INSERT INTO system_activity_logs')) {
      const log = args[0];
      if (!this.data.system_activity_logs) this.data.system_activity_logs = [];
      this.data.system_activity_logs.push({ id: Date.now().toString(), ...log, timestamp: new Date().toISOString() });
      this.save();
      return { changes: 1 };
    }

    // --- FAVORITES ---
    if (normalizedSql.includes('FROM favorites WHERE userId = ?')) {
      const userId = args[0];
      return (this.data.favorites || []).filter(f => f.userId === userId);
    }

    if (normalizedSql.includes('INSERT INTO favorites')) {
      const fav = args[0];
      const id = Date.now().toString();
      if (!this.data.favorites) this.data.favorites = [];
      this.data.favorites.push({ id, ...fav, createdAt: new Date().toISOString() });
      this.save();
      return { changes: 1 };
    }

    if (normalizedSql.includes('DELETE FROM favorites WHERE userId = ? AND targetId = ? AND type = ?')) {
      const [userId, targetId, type] = args;
      if (this.data.favorites) {
        const initialLength = this.data.favorites.length;
        this.data.favorites = this.data.favorites.filter(f =>
          !(f.userId === userId && f.targetId === String(targetId) && f.type === type)
        );
        if (this.data.favorites.length !== initialLength) this.save();
        return { changes: initialLength - this.data.favorites.length };
      }
      return { changes: 0 };
    }

    if (normalizedSql.includes('FROM favorites WHERE userId = ? AND targetId = ? AND type = ?')) {
      const [userId, targetId, type] = args;
      return (this.data.favorites || []).find(f =>
        f.userId === userId && f.targetId === String(targetId) && f.type === type
      );
    }

    // Fallback for counts or basic Selects
    if (normalizedSql.includes('SELECT count(*) as count FROM')) {
      const tableParts = normalizedSql.split('FROM ');
      const table = tableParts[1] ? tableParts[1].trim() : 'unknown';
      return { count: (this.data[table] || []).length };
    }

    console.warn('[JSON DB] Unhandled SQL:', normalizedSql, args);
    return type === 'all' ? [] : null;
  }
}

const db = new JsonDb();

function initDatabase() {
  console.log('Initializing JSON database (Direct db.json persistence)...');

  // Hash passwords if they are plain text
  let modified = false;
  if (db.data.users) {
    // --- Enforce Default Users (Admin & Student) ---
    // This ensures Quick Login always works, regardless of previous DB state
    const defaultUsers = [
      {
        id: "1",
        email: "ahmed@example.com",
        passwordPlain: "123456",
        role: "student",
        name: "أحمد محمد"
      },
      {
        id: "2",
        email: "admin@example.com",
        passwordPlain: "admin123",
        role: "admin",
        name: "مدير النظام"
      }
    ];

    defaultUsers.forEach(defUser => {
      const existingUser = db.data.users.find(u => u.email === defUser.email);
      if (existingUser) {
        // Enforce password reset if it doesn't match expected hash (simplified: just re-hash on startup to be safe)
        // Actually, re-hashing every time is fine, or we can check against hash.
        // Let's just update the password to the known correct hash.
        const newHash = bcrypt.hashSync(defUser.passwordPlain, 10);
        if (!bcrypt.compareSync(defUser.passwordPlain, existingUser.password)) {
          console.log(`Resetting password for ${defUser.email} to ensure Quick Login works.`);
          existingUser.password = newHash;
          modified = true;
        }
      } else {
        // Create if missing
        console.log(`Creating missing default user: ${defUser.email}`);
        db.data.users.push({
          id: defUser.id,
          name: defUser.name,
          email: defUser.email,
          password: bcrypt.hashSync(defUser.passwordPlain, 10),
          role: defUser.role,
          joinDate: new Date().toISOString().split('T')[0],
          points: 0,
          level: 1,
          emailVerified: 1,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(defUser.name)}&background=random`
        });
        modified = true;
      }
    });

    // Hash other users if needed
    db.data.users.forEach(user => {
      if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        console.log(`Hashing password for user: ${user.email}`);
        user.password = bcrypt.hashSync(user.password, 10);
        modified = true;
      }
    });
  }

  if (modified) {
    db.save();
    console.log('Database passwords migrated to secure hash.');
  }
}

module.exports = {
  db,
  initDatabase
};
