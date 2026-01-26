const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'db.sqlite');
const db = new Database(dbPath);
// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

function initDatabase() {
  console.log('Initializing SQLite database...');

  // --- Users Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            nameEn TEXT,
            role TEXT DEFAULT 'student',
            avatar TEXT,
            points INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            streak INTEGER DEFAULT 0,
            joinDate TEXT,
            status TEXT DEFAULT 'active',
            emailVerified INTEGER DEFAULT 0,
            verificationCode TEXT,
            verificationExpiry TEXT,
            whatsapp TEXT,
            country TEXT,
            age INTEGER,
            gender TEXT,
            educationLevel TEXT
        )
    `);

  // --- Courses Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            title_en TEXT,
            instructor TEXT,
            instructor_en TEXT,
            category TEXT,
            category_en TEXT,
            duration TEXT,
            duration_en TEXT,
            thumbnail TEXT,
            description TEXT,
            description_en TEXT,
            lessons_count INTEGER DEFAULT 0,
            students_count INTEGER DEFAULT 0,
            video_url TEXT,
            status TEXT DEFAULT 'published',
            passing_score INTEGER DEFAULT 80,
            quiz_frequency INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // --- Episodes Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS episodes (
            id TEXT PRIMARY KEY,
            courseId TEXT NOT NULL,
            title TEXT NOT NULL,
            title_en TEXT,
            duration TEXT,
            videoUrl TEXT,
            orderIndex INTEGER,
            isLocked INTEGER DEFAULT 0,
            FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE
        )
    `);

  // --- Enrollments Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS enrollments (
            user_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
            progress INTEGER DEFAULT 0,
            completed INTEGER DEFAULT 0,
            last_accessed TEXT,
            is_favorite INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, course_id),
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
        )
    `);

  // --- Episode Progress Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS episode_progress (
            user_id TEXT NOT NULL,
            episode_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            watched_duration INTEGER DEFAULT 0,
            last_position INTEGER DEFAULT 0,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, episode_id),
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

  // --- Certificates Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS certificates (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            issue_date TEXT DEFAULT CURRENT_TIMESTAMP,
            grade INTEGER,
            certificate_code TEXT UNIQUE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

  // --- Quizzes Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS quizzes (
            id TEXT PRIMARY KEY,
            courseId TEXT,
            title TEXT NOT NULL,
            title_en TEXT,
            description TEXT,
            questions TEXT, -- Storing JSON string of questions for now
            passing_score INTEGER DEFAULT 70,
            afterEpisodeIndex INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Migration for quizzes table
  try { db.prepare('ALTER TABLE quizzes ADD COLUMN courseId TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE quizzes ADD COLUMN title_en TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE quizzes ADD COLUMN passing_score INTEGER DEFAULT 70').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE quizzes ADD COLUMN afterEpisodeIndex INTEGER').run(); } catch (e) { }

  db.exec(`
        CREATE TABLE IF NOT EXISTS quiz_results (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            quizId TEXT NOT NULL,
            score INTEGER,
            total INTEGER,
            percentage INTEGER,
            completedAt TEXT,
            FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

  // --- Library ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS library_resources (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            type TEXT,
            url TEXT,
            category TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

  db.exec(`CREATE TABLE IF NOT EXISTS community_posts (id TEXT PRIMARY KEY, userId TEXT, content TEXT, timestamp TEXT)`);

  // --- Other Tables ---
  db.exec(`CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY, title TEXT, content TEXT, type TEXT, date TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      senderId TEXT,
      receiverId TEXT,
      content TEXT,
      read INTEGER DEFAULT 0,
      timestamp TEXT,
      attachmentUrl TEXT,
      attachmentType TEXT,
      attachmentName TEXT,
      expiryDate TEXT
    )
  `);

  // Migration for existing tables
  try { db.prepare('ALTER TABLE messages ADD COLUMN attachmentUrl TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE messages ADD COLUMN attachmentType TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE messages ADD COLUMN attachmentName TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE messages ADD COLUMN expiryDate TEXT').run(); } catch (e) { }

  db.exec(`CREATE TABLE IF NOT EXISTS favorites (id TEXT PRIMARY KEY, userId TEXT, targetId TEXT, type TEXT, createdAt TEXT)`);

  db.exec(`CREATE TABLE IF NOT EXISTS system_activity_logs (id TEXT PRIMARY KEY, action TEXT, userId TEXT, details TEXT, timestamp TEXT)`);

  // --- Seed Default Users ---
  const checkUser = db.prepare('SELECT id, password FROM users WHERE email = ?');
  const insertUser = db.prepare(`
        INSERT INTO users (id, email, password, name, role, joinDate, emailVerified, avatar)
        VALUES (@id, @email, @password, @name, @role, @joinDate, @emailVerified, @avatar)
    `);
  const updateUserPass = db.prepare('UPDATE users SET password = ? WHERE id = ?');

  const defaultUsers = [
    {
      id: "1", email: "ahmed@example.com", passwordPlain: "123456",
      role: "student", name: "أحمد محمد"
    },
    {
      id: "2", email: "admin@example.com", passwordPlain: "admin123",
      role: "admin", name: "مدير النظام"
    }
  ];

  for (const defUser of defaultUsers) {
    const existing = checkUser.get(defUser.email);
    const hash = bcrypt.hashSync(defUser.passwordPlain, 10);

    if (existing) {
      // Optional: Force reset password on startup if needed, or leave as is
      // For safety in this migration, let's update it to ensure login works
      if (!bcrypt.compareSync(defUser.passwordPlain, existing.password)) {
        console.log(`Resetting password for ${defUser.email}`);
        updateUserPass.run(hash, existing.id);
      }
    } else {
      console.log(`Creating default user: ${defUser.email}`);
      insertUser.run({
        id: defUser.id,
        email: defUser.email,
        password: hash,
        name: defUser.name,
        role: defUser.role,
        joinDate: new Date().toISOString(),
        emailVerified: 1,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(defUser.name)}&background=random`
      });
    }
  }

  console.log('SQLite database initialized successfully.');
}

module.exports = {
  db,
  initDatabase
};
