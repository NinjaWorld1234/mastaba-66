import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Enable UUID Extension
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;

    // 2. Create Users Table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        name_en TEXT,
        role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
        avatar TEXT,
        points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        streak INTEGER DEFAULT 0,
        join_date DATE DEFAULT CURRENT_DATE,
        phone TEXT,
        location TEXT,
        bio TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
        whatsapp TEXT,
        country TEXT,
        age INTEGER,
        gender TEXT,
        education_level TEXT,
        email_verified BOOLEAN DEFAULT FALSE,
        verification_code TEXT,
        verification_expiry TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 3. Create Courses Table
    await sql`
      CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
        status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft')),
        passing_score INTEGER DEFAULT 80,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 4. Create Episodes Table
    await sql`
      CREATE TABLE IF NOT EXISTS episodes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        video_url TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        duration TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 5. Create Enrollments Table
    await sql`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        progress INTEGER DEFAULT 0,
        last_access TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      );
    `;

    // 6. Create Episode Progress Table
    await sql`
      CREATE TABLE IF NOT EXISTS episode_progress (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMPTZ,
        UNIQUE(user_id, episode_id)
      );
    `;

    // 7. Create Certificates Table
    await sql`
      CREATE TABLE IF NOT EXISTS certificates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        user_name TEXT NOT NULL,
        course_title TEXT NOT NULL,
        issue_date DATE DEFAULT CURRENT_DATE,
        grade TEXT,
        code TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 8. Create Library Resources Table
    await sql`
      CREATE TABLE IF NOT EXISTS library_resources (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        author TEXT,
        type TEXT,
        size TEXT,
        image TEXT,
        url TEXT,
        downloads INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 9. Create Community Posts Table
    await sql`
      CREATE TABLE IF NOT EXISTS community_posts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        author TEXT NOT NULL,
        author_avatar TEXT,
        content TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        tags JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 10. Create Quizzes Table
    await sql`
      CREATE TABLE IF NOT EXISTS quizzes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        title_en TEXT,
        after_episode_index INTEGER,
        passing_score INTEGER DEFAULT 80,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 11. Create Quiz Questions Table
    await sql`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        text_en TEXT,
        options JSONB NOT NULL,
        options_en JSONB,
        correct_answer INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 12. Create Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));`;
    await sql`CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_episodes_course ON episodes(course_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_episode_progress_user ON episode_progress(user_id);`;

    // 7. Seed Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    await sql`
      INSERT INTO users (id, email, password, name, role, email_verified)
      VALUES (
        'a0000000-0000-0000-0000-000000000001',
        'admin@example.com',
        ${adminPassword},
        'مدير النظام',
        'admin',
        TRUE
      ) ON CONFLICT (email) DO UPDATE SET
        password = ${adminPassword},
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        email_verified = EXCLUDED.email_verified;
    `;

    // 8. Seed Student User
    const studentPassword = await bcrypt.hash('123456', 10);
    await sql`
      INSERT INTO users (id, email, password, name, role, email_verified)
      VALUES (
        'a0000000-0000-0000-0000-000000000002',
        'ahmed@example.com',
        ${studentPassword},
        'أحمد محمد',
        'student',
        TRUE
      ) ON CONFLICT (email) DO UPDATE SET
        password = ${studentPassword},
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        email_verified = EXCLUDED.email_verified;
    `;

    return res.status(200).json({
      success: true,
      message: 'Database initialized successfully! Tables created and data seeded.'
    });

  } catch (error) {
    console.error('Init DB Error:', error);
    return res.status(500).json({
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
