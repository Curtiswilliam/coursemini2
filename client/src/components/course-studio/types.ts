export interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  type: "TEXT" | "VIDEO" | "QUIZ";
  position: number;
  videoUrl?: string | null;
  duration?: number | null;
  dripDays?: number | null;
  minReadSeconds?: number | null;
  minVideoPercent?: number | null;
  minQuizScore?: number | null;
  blockNextModule?: boolean | null;
  quiz?: {
    questions: QuizQuestion[];
  };
}

export interface QuizQuestion {
  id?: number;
  question: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SINGLE_SELECTION" | "MULTI_SELECTION";
  position: number;
  selectionLabel?: string;
  options: QuizOption[];
}

export interface QuizOption {
  id?: number;
  text: string;
  isCorrect: boolean;
}

export interface Module {
  id: number;
  subjectId: number;
  title: string;
  description?: string | null;
  heroImage?: string | null;
  position: number;
  lessons: Lesson[];
}

export interface Subject {
  id: number;
  courseId: number;
  title: string;
  position: number;
  modules: Module[];
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  thumbnail?: string | null;
  categoryId?: number | null;
  level?: string | null;
  language?: string | null;
  isFree?: boolean;
  price?: number | null;
  learningOutcomes?: string | null;
  prerequisites?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  subjects: Subject[];
}

export type StudioTab = "content" | "settings";
