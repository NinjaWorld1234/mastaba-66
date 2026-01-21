/**
 * Unified Type Definitions for the Al-Mastaba Platform
 * @module types
 * 
 * This file contains all TypeScript interfaces and types used across the application.
 * All type definitions should be centralized here to avoid duplication.
 */

import { LucideIcon } from 'lucide-react';

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of activity logs to keep in storage */
export const MAX_LOG_ENTRIES = 1000;

/** Session timeout in milliseconds (30 days) */
export const SESSION_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000;

/** Maximum file size for uploads in bytes (10MB) */
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

/** Default pagination page size */
export const DEFAULT_PAGE_SIZE = 20;

// ============================================================================
// User & Authentication
// ============================================================================

/** User role types */
export type UserRole = 'student' | 'admin';

/** User account status */
export type UserStatus = 'active' | 'inactive' | 'pending';

/**
 * User interface representing a platform user
 */
export interface User {
  /** Unique user identifier */
  id: string;
  /** User's full name in Arabic */
  name: string;
  /** User's full name in English */
  nameEn: string;
  /** User's email address */
  email: string;
  /** User's role on the platform */
  role: UserRole;
  /** URL to user's avatar image */
  avatar: string;
  /** Access token for API requests */
  access_token?: string;
  /** Gamification points earned */
  points: number;
  /** User's current level */
  level: number;
  /** Consecutive days of activity */
  streak: number;
  /** Date user joined (ISO format: YYYY-MM-DD) */
  joinDate: string;
  /** User's phone number (optional) */
  phone?: string;
  /** User's location (optional) */
  location?: string;
  /** User's biography (optional) */
  bio?: string;
  /** User's account status */
  status: UserStatus;
}

// ============================================================================
// Courses
// ============================================================================

/** Course publication status */
export type CourseStatus = 'published' | 'draft';

/**
 * Course interface representing an educational course
 */
export interface Course {
  /** Unique course identifier */
  id: string;
  /** Course title in Arabic */
  title: string;
  /** Course title in English */
  titleEn?: string;
  /** Instructor name in Arabic */
  instructor: string;
  /** Instructor name in English */
  instructorEn?: string;
  /** Course completion progress (0-100) */
  progress: number;
  /** URL to course thumbnail image */
  thumbnail: string;
  /** Course category in Arabic */
  category: string;
  /** Course category in English */
  categoryEn?: string;
  /** Course duration display string in Arabic */
  duration: string;
  /** Course duration display string in English */
  durationEn?: string;
  /** Course description in Arabic */
  description?: string;
  /** Course description in English */
  descriptionEn?: string;
  /** Number of lessons in the course */
  lessonsCount?: number;
  /** Number of enrolled students */
  studentsCount?: number;
  /** URL to course video (if applicable) */
  videoUrl?: string;
  /** Course publication status */
  status?: CourseStatus;
  /** Default passing score for course quizzes */
  passingScore?: number;
  /** Episodes in this course */
  episodes?: Episode[];
}

/**
 * Episode interface representing a single lecture in a course
 */
export interface Episode {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string;
  orderIndex: number;
  duration?: string;
  completed?: boolean;
}

/**
 * Tracks user progress through an episode
 */
export interface EpisodeProgress {
  id?: number;
  userId: string;
  courseId: string;
  episodeId: string;
  completed: boolean;
  completedAt?: string;
}

/**
 * Tracks user progress through a course
 */
export interface CourseProgress {
  /** Course being tracked */
  courseId: string;
  /** Current lesson */
  lessonId: string;
  /** Whether the lesson is completed */
  completed: boolean;
  /** Seconds watched in the current session */
  watchedSeconds: number;
  /** ISO timestamp when completed (if applicable) */
  completedAt?: string;
}

// ============================================================================
// Quizzes & Questions
// ============================================================================

/**
 * Quiz question interface
 */
export interface Question {
  /** Question identifier */
  id: number;
  /** Question text in Arabic */
  text: string;
  /** Question text in English (optional) */
  textEn?: string;
  /** Answer options in Arabic */
  options: string[];
  /** Answer options in English (optional) */
  optionsEn?: string[];
  /** Index of the correct answer (0-based) */
  correctAnswer: number;
}

/**
 * Quiz interface containing questions
 */
export interface Quiz {
  /** Unique quiz identifier */
  id: string;
  /** Associated course ID */
  courseId: string;
  /** Quiz title in Arabic */
  title: string;
  /** Quiz title in English */
  titleEn: string;
  /** Array of questions */
  questions: Question[];
  /** Minimum score percentage to pass */
  passingScore: number;
  /** Index of episode after which this quiz appears */
  afterEpisodeIndex?: number;
}

/**
 * Quiz result for a user
 */
export interface QuizResult {
  /** Quiz that was taken */
  quizId: string;
  /** User's score */
  score: number;
  /** Total possible score */
  total: number;
  /** Score as percentage */
  percentage: number;
  /** ISO timestamp when completed */
  completedAt: string;
}

// ============================================================================
// Certificates
// ============================================================================

/**
 * Certificate issued upon course completion
 */
export interface Certificate {
  /** Unique certificate identifier */
  id: string;
  /** Student who earned the certificate */
  studentId: string;
  /** Student who earned the certificate (alias/legacy) */
  userId?: string;
  /** Student's name */
  studentName?: string;
  /** Student's name (preferred) */
  userName: string;
  /** Course that was completed */
  courseId: string;
  /** Course name */
  courseName?: string;
  /** Course title (preferred) */
  courseTitle: string;
  /** Date certificate was issued (ISO format) */
  issueDate: string;
  /** Grade achieved */
  grade: number | string;
  /** Unique verification code */
  code: string;
}

// ============================================================================
// Announcements
// ============================================================================

/** Announcement target audience */
export type AnnouncementTarget = 'all' | 'students' | 'instructors';

/** Announcement priority level */
export type AnnouncementPriority = 'low' | 'medium' | 'high';

/**
 * Platform announcement interface
 */
export interface Announcement {
  /** Unique announcement identifier */
  id: string;
  /** Announcement title */
  title: string;
  /** Announcement content */
  content: string;
  /** Publication date (ISO format) */
  date: string;
  /** Target audience */
  target: AnnouncementTarget;
  /** Priority level */
  priority: AnnouncementPriority;
  /** Author name */
  author: string;
}

// ============================================================================
// Activity Logging
// ============================================================================

/** Activity log type */
export type ActivityType = 'success' | 'warning' | 'neutral';

/**
 * Activity log entry for display purposes (UI version)
 */
export interface ActivityLog {
  /** Unique log identifier */
  id: string;
  /** User name who performed the action */
  user: string;
  /** Description of the action */
  action: string;
  /** Human-readable time string */
  time: string;
  /** User's avatar URL */
  avatar: string;
  /** Type for visual styling */
  type: ActivityType;
}

/**
 * Activity log entry stored in the system (API version)
 */
export interface SystemActivityLog {
  /** Unique log identifier */
  id: string;
  /** User ID who performed the action */
  userId: string;
  /** User name who performed the action */
  userName: string;
  /** Action type/name */
  action: string;
  /** Additional details about the action */
  details: string;
  /** ISO timestamp */
  timestamp: string;
  /** Optional: IP address */
  ip?: string;
  /** Optional: Date portion for filtering */
  date?: string;
}

// ============================================================================
// UI Components
// ============================================================================

/**
 * Statistics display component props
 */
export interface Stat {
  /** Display label */
  label: string;
  /** Display value */
  value: string | number;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Tailwind color class */
  color: string;
  /** Optional change indicator */
  change?: string;
}

/**
 * Achievement/Badge interface
 */
export interface Badge {
  /** Unique badge identifier */
  id: string;
  /** Badge title */
  title: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Whether user has earned this badge */
  isUnlocked: boolean;
  /** Badge description */
  description: string;
}

/**
 * Community post interface
 */
export interface Post {
  /** Unique post identifier */
  id: string;
  /** Author name */
  author: string;
  /** Author's avatar URL */
  authorAvatar: string;
  /** Human-readable time string */
  time: string;
  /** Post content */
  content: string;
  /** Number of likes */
  likes: number;
  /** Number of comments */
  comments: number;
  /** Associated tags */
  tags: string[];
}

// ============================================================================
// Library Resources
// ============================================================================

/** Resource file type */
export type ResourceType = 'pdf' | 'image' | 'infographic' | 'spreadsheet';

/**
 * Library resource interface
 */
export interface LibraryResource {
  /** Unique resource identifier */
  id: string;
  /** Resource title */
  title: string;
  /** Resource author/creator */
  author: string;
  /** File type */
  type: ResourceType;
  /** File size display string */
  size: string;
  /** URL to resource thumbnail */
  image?: string;
  /** Download URL */
  url: string;
  /** Download count */
  downloads: number;
}

// ============================================================================
// Backup
// ============================================================================

/** Backup type */
export type BackupType = 'full' | 'auto' | 'manual';

/** Backup status */
export type BackupStatus = 'success' | 'failed' | 'pending';

/**
 * Backup record interface
 */
export interface BackupRecord {
  /** Unique backup identifier */
  id: number;
  /** Backup name/description */
  name: string;
  /** Human-readable date/time */
  date: string;
  /** File size display string */
  size: string;
  /** Backup status */
  status: BackupStatus;
  /** Type of backup */
  type: BackupType;
}
