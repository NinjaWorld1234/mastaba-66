const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath);

// Initialize Database Schema
function initDatabase() {
  console.log('Initializing database...');

  // Users Table
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
      phone TEXT,
      location TEXT,
      bio TEXT,
      status TEXT DEFAULT 'active',
      -- New fields for extended profile
      whatsapp TEXT,
      country TEXT,
      age INTEGER,
      gender TEXT,
      educationLevel TEXT,
      -- Email verification fields
      emailVerified INTEGER DEFAULT 0,
      verificationCode TEXT,
      verificationExpiry TEXT
    )
  `);

  // Courses Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      titleEn TEXT,
      instructor TEXT,
      instructorEn TEXT,
      progress INTEGER DEFAULT 0,
      category TEXT,
      categoryEn TEXT,
      duration TEXT,
      durationEn TEXT,
      thumbnail TEXT,
      description TEXT,
      descriptionEn TEXT,
      lessonsCount INTEGER DEFAULT 0,
      studentsCount INTEGER DEFAULT 0,
      videoUrl TEXT,
      status TEXT DEFAULT 'published',
      passingScore INTEGER DEFAULT 80
    )
  `);

  // Episodes Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS episodes (
      id TEXT PRIMARY KEY,
      courseId TEXT NOT NULL,
      title TEXT NOT NULL,
      videoUrl TEXT NOT NULL,
      orderIndex INTEGER DEFAULT 0,
      duration TEXT,
      FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE
    )
  `);

  // Quizzes Table (Enhanced for Sequential Progression)
  db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      courseId TEXT NOT NULL,
      title TEXT NOT NULL,
      afterEpisodeIndex INTEGER, -- Index of episode after which this quiz appears
      passingScore INTEGER DEFAULT 80,
      FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE
    )
  `);

  // Quiz Questions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quizId TEXT NOT NULL,
      text TEXT NOT NULL,
      options TEXT NOT NULL, -- JSON string
      correctAnswer INTEGER NOT NULL,
      FOREIGN KEY(quizId) REFERENCES quizzes(id) ON DELETE CASCADE
    )
  `);

  // Episode Progress Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS episode_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      courseId TEXT NOT NULL,
      episodeId TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      completedAt TEXT,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(courseId) REFERENCES courses(id),
      FOREIGN KEY(episodeId) REFERENCES episodes(id),
      UNIQUE(userId, episodeId)
    )
  `);

  // Progress/Enrollments Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      courseId TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      lastAccess TEXT,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(courseId) REFERENCES courses(id),
      UNIQUE(userId, courseId)
    )
  `);

  // Certificates Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      courseId TEXT NOT NULL,
      userName TEXT NOT NULL,
      courseTitle TEXT NOT NULL,
      issueDate TEXT,
      grade TEXT,
      code TEXT UNIQUE NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);

  // Library Resources Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS library_resources (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT,
      type TEXT, -- pdf, book, doc, etc.
      size TEXT,
      image TEXT,
      url TEXT,
      downloads INTEGER DEFAULT 0
    )
  `);

  // Community Posts Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      userId TEXT,
      author TEXT NOT NULL,
      authorAvatar TEXT,
      time TEXT,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      tags TEXT, -- JSON string
      createdAt TEXT
    )
  `);

  // Check if seeding is needed
  const userCount = db.prepare('SELECT count(*) as count FROM users').get();
  if (userCount.count === 0) {
    seedDatabase();
  }

  // Seed Library if empty
  const libCount = db.prepare('SELECT count(*) as count FROM library_resources').get();
  if (libCount.count === 0) {
    seedLibrary();
  }

  // Seed Community if empty
  const postCount = db.prepare('SELECT count(*) as count FROM community_posts').get();
  if (postCount.count === 0) {
    seedCommunity();
  }
}

function seedLibrary() {
  console.log('Seeding library resources...');
  const insert = db.prepare(`
    INSERT INTO library_resources (id, title, author, type, size, image, url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const resources = [
    ['lib_1', 'ملخص فقه الطهارة', 'الشيخ أحمد', 'pdf', '2.5 MB', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=200&fit=crop', '#'],
    ['lib_2', 'الرحيق المختوم', 'المباركفوري', 'book', '15 MB', 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=300&h=200&fit=crop', '#'],
    ['lib_3', 'شجرة الأنبياء (إنفوجرافيك)', 'فريق التصميم', 'pdf', '5 MB', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop', '#'],
    ['lib_4', 'جدول متابعة الحفظ', 'المصطبة', 'doc', '0.5 MB', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=200&fit=crop', '#'],
    ['lib_5', 'أذكار الصباح والمساء', 'حصن المسلم', 'pdf', '1.2 MB', 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=300&h=200&fit=crop', '#']
  ];

  for (const res of resources) {
    insert.run(...res);
  }
}

function seedCommunity() {
  console.log('Seeding community posts...');
  const insert = db.prepare(`
    INSERT INTO community_posts (id, userId, author, authorAvatar, time, content, likes, comments, tags, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const posts = [
    ['post_1', '1', 'عمر فاروق', 'https://ui-avatars.com/api/?name=Omar+F&background=0D8ABC&color=fff&size=50', 'منذ ساعتين', 'السلام عليكم، هل يوجد ملخص جيد لدورة فقه الصلاة؟ أحتاجه للمراجعة قبل الاختبار.', 15, 4, JSON.stringify(['فقه', 'مساعدة']), new Date().toISOString()],
    ['post_2', '2', 'سارة أحمد', 'https://ui-avatars.com/api/?name=Sara+A&background=5E35B1&color=fff&size=50', 'منذ 5 ساعات', 'أتممت اليوم بحمد الله دورة السيرة النبوية. أنصح الجميع بها، أسلوب الشيخ رائع جداً ومؤثر.', 42, 12, JSON.stringify(['إنجاز', 'توصية']), new Date().toISOString()]
  ];

  for (const post of posts) {
    insert.run(...post);
  }
}

function seedDatabase() {
  console.log('Seeding database from db.json...');
  try {
    const dbJsonPath = path.join(__dirname, '../db.json');
    if (fs.existsSync(dbJsonPath)) {
      const data = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));

      // Seed Users
      const insertUser = db.prepare(`
        INSERT INTO users (id, email, password, name, nameEn, role, avatar, points, level, streak, joinDate)
        VALUES (@id, @email, @password, @name, @nameEn, @role, @avatar, @points, @level, @streak, @joinDate)
      `);

      const insertManyUsers = db.transaction((users) => {
        for (const user of users) {
          // Hash password if not already hashed (assuming db.json might have plain text for simple defaults)
          let hashedPassword = user.password;
          if (!user.password.startsWith('$2a$')) {
            hashedPassword = bcrypt.hashSync(user.password || '123456', 10);
          }

          try {
            insertUser.run({
              id: user.id || Date.now().toString(),
              email: user.email || `user_${Date.now()}@example.com`,
              password: hashedPassword,
              name: user.name || 'Unknown User',
              nameEn: user.nameEn || user.name || null,
              role: user.role || 'student',
              avatar: user.avatar || null,
              points: user.points || 0,
              level: user.level || 1,
              streak: user.streak || 0,
              joinDate: user.joinDate || new Date().toISOString().split('T')[0]
            });
          } catch (e) {
            console.error('Failed to insert user:', user.email, e.message);
          }
        }
      });

      if (data.users) insertManyUsers(data.users);

      // Seed Courses
      const insertCourse = db.prepare(`
        INSERT INTO courses (id, title, titleEn, instructor, instructorEn, category, categoryEn, duration, durationEn, thumbnail, description, descriptionEn, lessonsCount, studentsCount, videoUrl)
        VALUES (@id, @title, @titleEn, @instructor, @instructorEn, @category, @categoryEn, @duration, @durationEn, @thumbnail, @description, @descriptionEn, @lessonsCount, @studentsCount, @videoUrl)
      `);

      const insertManyCourses = db.transaction((courses) => {
        for (const course of courses) {
          try {
            insertCourse.run({
              id: course.id || 'course_' + Date.now(),
              title: course.title || 'Untitled Course',
              titleEn: course.titleEn || course.title || null,
              instructor: course.instructor || null,
              instructorEn: course.instructorEn || course.instructor || null,
              category: course.category || null,
              categoryEn: course.categoryEn || course.category || null,
              duration: course.duration || '0m',
              durationEn: course.durationEn || course.duration || null,
              thumbnail: course.thumbnail || null,
              description: course.description || null,
              descriptionEn: course.descriptionEn || course.description || null,
              lessonsCount: course.lessonsCount || 0,
              studentsCount: course.studentsCount || 0,
              videoUrl: course.videoUrl || null
            });
          } catch (e) {
            console.error('Failed to insert course:', course.id, e.message);
          }
        }
      });

      if (data.courses) insertManyCourses(data.courses);

      console.log('Database seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

module.exports = {
  db,
  initDatabase
};
