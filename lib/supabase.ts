import { createClient } from '@supabase/supabase-js';

// Supabase configuration - these will be set via environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client for frontend use (uses anon key with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend/API use (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database types (will be auto-generated from Supabase later)
export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    password: string;
                    name: string;
                    name_en: string | null;
                    role: 'student' | 'admin';
                    avatar: string | null;
                    points: number;
                    level: number;
                    streak: number;
                    join_date: string;
                    phone: string | null;
                    location: string | null;
                    bio: string | null;
                    status: 'active' | 'inactive' | 'pending';
                    whatsapp: string | null;
                    country: string | null;
                    age: number | null;
                    gender: string | null;
                    education_level: string | null;
                    email_verified: boolean;
                    verification_code: string | null;
                    verification_expiry: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['users']['Insert']>;
            };
            courses: {
                Row: {
                    id: string;
                    title: string;
                    title_en: string | null;
                    instructor: string | null;
                    instructor_en: string | null;
                    category: string | null;
                    category_en: string | null;
                    duration: string | null;
                    duration_en: string | null;
                    thumbnail: string | null;
                    description: string | null;
                    description_en: string | null;
                    lessons_count: number;
                    students_count: number;
                    video_url: string | null;
                    status: 'published' | 'draft';
                    passing_score: number;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['courses']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['courses']['Insert']>;
            };
            episodes: {
                Row: {
                    id: string;
                    course_id: string;
                    title: string;
                    video_url: string;
                    order_index: number;
                    duration: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['episodes']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['episodes']['Insert']>;
            };
            enrollments: {
                Row: {
                    id: number;
                    user_id: string;
                    course_id: string;
                    progress: number;
                    last_access: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['enrollments']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['enrollments']['Insert']>;
            };
            certificates: {
                Row: {
                    id: string;
                    user_id: string;
                    course_id: string;
                    user_name: string;
                    course_title: string;
                    issue_date: string;
                    grade: string | null;
                    code: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['certificates']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['certificates']['Insert']>;
            };
        };
    };
}

export default supabase;
