export interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  chapters: Chapter[];
  progress?: number;
  enrolled?: boolean;
  enrollmentCode?: string;
}

export interface QuizResult {
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
}

