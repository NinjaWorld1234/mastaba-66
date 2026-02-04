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
            educationLevel TEXT,
            supervisor_id TEXT,
            supervisor_capacity INTEGER,
            supervisor_priority INTEGER
        )
    `);

  // Migration for users table (Supervisor Support)
  try { db.prepare('ALTER TABLE users ADD COLUMN supervisor_id TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE users ADD COLUMN supervisor_capacity INTEGER DEFAULT 10').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE users ADD COLUMN supervisor_priority INTEGER DEFAULT 0').run(); } catch (e) { }

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
            order_index INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // --- Course Folders Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS course_folders (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            thumbnail TEXT,
            order_index INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Migration for courses table
  try { db.prepare('ALTER TABLE courses ADD COLUMN folder_id TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE courses ADD COLUMN order_index INTEGER DEFAULT 0').run(); } catch (e) { }

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

  // --- System Settings Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Initialize default backup settings if not exist
  const defaultSettings = [
    { key: 'auto_backup_enabled', value: '1' },
    { key: 'cloud_backup_enabled', value: '1' },
    { key: 'backup_retention_days', value: '30' }
  ];

  defaultSettings.forEach(setting => {
    try {
      const exists = db.prepare('SELECT 1 FROM system_settings WHERE key = ?').get(setting.key);
      if (!exists) {
        db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run(setting.key, setting.value);
      }
    } catch (e) {
      console.error('[DB_INIT_SETTINGS_ERROR]:', e.message);
    }
  });

  // Migration for certificates table
  try { db.prepare('ALTER TABLE certificates ADD COLUMN user_name TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE certificates ADD COLUMN course_title TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE certificates ADD COLUMN student_id TEXT').run(); } catch (e) { }


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

  // --- Books (Linked to Courses) ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS books (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            path TEXT NOT NULL,
            courseId TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE SET NULL
        )
    `);

  // Migration for books
  try { db.prepare('ALTER TABLE books ADD COLUMN courseId TEXT').run(); } catch (e) { }


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
  try { db.prepare('ALTER TABLE messages ADD COLUMN isComplaint INTEGER DEFAULT 0').run(); } catch (e) { }

  db.exec(`CREATE TABLE IF NOT EXISTS favorites (id TEXT PRIMARY KEY, userId TEXT, targetId TEXT, type TEXT, createdAt TEXT)`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      userCountry TEXT,
      rating INTEGER NOT NULL,
      comment TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS rating_replies (
      id TEXT PRIMARY KEY,
      ratingId TEXT NOT NULL,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ratingId) REFERENCES ratings(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

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
    },
    {
      id: "manual_recipient", email: "manual@example.com", passwordPlain: "manual123",
      role: "student", name: "مستلم شهادة يدوي"
    },
    // Adding Naser (Admin)
    {
      id: "u_naser_admin", email: "naser@myf-online.com", passwordPlain: "naser2024",
      role: "admin", name: "المشرف العام"
    }
  ];

  for (const defUser of defaultUsers) {
    const existing = checkUser.get(defUser.email);
    const hash = bcrypt.hashSync(defUser.passwordPlain, 10);

    if (existing) {
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

  // --- Seed Initial Folder if not exists ---
  const initialFolderId = 'foundation_shariah';
  const folderExists = db.prepare('SELECT id FROM course_folders WHERE id = ?').get(initialFolderId);
  if (!folderExists) {
    console.log('Seeding initial foundational folder...');
    db.prepare(`
            INSERT INTO course_folders (id, name, thumbnail, order_index)
            VALUES (?, ?, ?, ?)
        `).run(initialFolderId, 'الدورة التأسيسية للعلوم الشرعية', 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800&h=450&fit=crop', 0);

    // Link all current courses to this folder
    db.prepare('UPDATE courses SET folder_id = ? WHERE folder_id IS NULL').run(initialFolderId);
  }

  // --- ONE-TIME RESET: Sequential Progress enforcement ---
  // This is added to meet the user's request to "out the current students from all courses"
  // and ensure they follow the new sequence. Since this is a specialized request,
  // we execute it AND THEN add a flag to ensure it doesn't run every time.
  const resetFile = path.join(dataDir, '.sequential_reset_done');
  if (!fs.existsSync(resetFile)) {
    console.log('ENFORCING SEQUENTIAL RESET: Clearing all enrollments and progress...');
    try {
      db.prepare('DELETE FROM enrollments').run();
      db.prepare('DELETE FROM episode_progress').run();
      db.prepare('DELETE FROM quiz_results').run();
      db.prepare('UPDATE courses SET students_count = 0').run();
      fs.writeFileSync(resetFile, 'Reset completed on ' + new Date().toISOString());
      console.log('SEQUENTIAL RESET COMPLETED.');
    } catch (e) {
      console.error('Error during sequential reset:', e);
    }
  }

  console.log('SQLite database initialized successfully.');
}

module.exports = {
  db,
  initDatabase
};
