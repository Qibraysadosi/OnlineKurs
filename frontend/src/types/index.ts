/**
 * TypeScript mirrors of every API schema in SPEC §2.5.
 * Field names are snake_case exactly as the backend returns them.
 */

export type Role = "student" | "teacher" | "admin";
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PriceFilter = "free" | "paid";
export type CourseSort = "newest" | "popular" | "rating" | "price_asc" | "price_desc";

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

export interface UserPublic {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  courses_count: number;
}

export interface TeacherMini {
  id: number;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
}

export interface CourseCard {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  cover_url: string | null;
  price: number;
  level: CourseLevel;
  language: string;
  is_published: boolean;
  category: Category | null;
  teacher: TeacherMini;
  rating_avg: number;
  reviews_count: number;
  students_count: number;
  lessons_count: number;
  duration_minutes: number;
  created_at: string;
}

export interface LessonOut {
  id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  position: number;
  is_free_preview: boolean;
  has_access: boolean;
  is_completed: boolean;
  /** null when the requester has no access to the lesson */
  video_url: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
}

export interface SectionOut {
  id: number;
  title: string;
  position: number;
  lessons: LessonOut[];
}

export interface CourseDetail extends CourseCard {
  description: string;
  what_you_learn: string[];
  requirements: string[];
  updated_at: string;
  sections: SectionOut[];
  has_access: boolean;
  is_enrolled: boolean;
  progress_percent: number | null;
}

export interface Enrollment {
  id: number;
  course: CourseCard;
  progress_percent: number;
  completed_lessons: number;
  total_lessons: number;
  last_lesson_id: number | null;
  created_at: string;
}

export interface Payment {
  id: number;
  user: UserPublic;
  course: CourseCard;
  amount: number;
  status: PaymentStatus;
  provider: string;
  created_at: string;
  paid_at: string | null;
}

export interface ReviewUser {
  id: number;
  full_name: string;
  avatar_url: string | null;
}

export interface Review {
  id: number;
  user: ReviewUser;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  user: UserPublic;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface CourseProgress {
  progress_percent: number;
  completed_lessons: number;
  total_lessons: number;
  completed_lesson_ids: number[];
}

export interface LessonCompleteResult {
  progress_percent: number;
  completed_lessons: number;
  total_lessons: number;
}

export interface TeacherStats {
  courses_count: number;
  students_count: number;
  revenue: number;
  reviews_avg: number;
}

export interface MonthlyRevenue {
  /** "YYYY-MM" */
  month: string;
  revenue: number;
  payments_count: number;
}

export interface AdminStats {
  users_count: number;
  students_count: number;
  teachers_count: number;
  courses_count: number;
  published_courses_count: number;
  enrollments_count: number;
  revenue_total: number;
  revenue_last_30_days: number;
  recent_payments: Payment[];
  monthly_revenue: MonthlyRevenue[];
  top_courses: CourseCard[];
}

export interface HealthStatus {
  status: "ok";
}

export interface ApiError {
  detail: string;
}

// ---------------------------------------------------------------------------
// Request payloads
// ---------------------------------------------------------------------------

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RefreshPayload {
  refresh_token: string;
}

export interface UpdateMePayload {
  full_name?: string;
  phone?: string | null;
  bio?: string | null;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface CategoryCreatePayload {
  name: string;
  icon?: string | null;
  description?: string | null;
}

export type CategoryUpdatePayload = Partial<CategoryCreatePayload>;

export interface CourseCreatePayload {
  title: string;
  short_description: string;
  description: string;
  category_id?: number | null;
  level: CourseLevel;
  price: number;
  language?: string;
  what_you_learn?: string[];
  requirements?: string[];
}

export type CourseUpdatePayload = Partial<CourseCreatePayload>;

export interface PublishPayload {
  is_published: boolean;
}

export interface ReviewPayload {
  rating: number;
  comment?: string | null;
}

export interface SectionCreatePayload {
  title: string;
}

export type SectionUpdatePayload = Partial<SectionCreatePayload>;

export interface SectionOrderPayload {
  section_ids: number[];
}

export interface LessonCreatePayload {
  title: string;
  description?: string | null;
  video_url?: string | null;
  duration_minutes?: number;
  is_free_preview?: boolean;
}

export type LessonUpdatePayload = Partial<LessonCreatePayload>;

export interface LessonOrderPayload {
  lesson_ids: number[];
}

export interface PaymentCreatePayload {
  course_id: number;
}

export interface AdminUserUpdatePayload {
  role?: Role;
  is_active?: boolean;
}

export interface AdminPaymentUpdatePayload {
  status: PaymentStatus;
}

// ---------------------------------------------------------------------------
// Query params
// ---------------------------------------------------------------------------

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface CourseListParams extends PaginationParams {
  q?: string;
  category?: string;
  level?: CourseLevel;
  price?: PriceFilter;
  sort?: CourseSort;
}

export interface AdminUsersParams extends PaginationParams {
  q?: string;
  role?: Role;
}

export interface AdminCoursesParams extends PaginationParams {
  q?: string;
  is_published?: boolean;
}

export interface AdminPaymentsParams extends PaginationParams {
  status?: PaymentStatus;
}

/** Progress callback for uploads: value is 0..100 */
export type UploadProgress = (percent: number) => void;
