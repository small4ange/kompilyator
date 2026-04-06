// Типы для тестов
export interface Quiz {
  id?: string;
  question: string;
  options: string[];
  correctOption: number;
}

// Типы для задач
export interface TaskTest {
  id?: string;
  input: string;
  expected_output: string;
  isExample?: boolean;
  order?: number;
}
// Типы для задач
export interface Task {
  id?: string;
  title: string;
  description: string;
  tests: TaskTest[];
  order?: number;
}

// Основной тип главы
export interface ChapterData {
  id?: string;
  title: string;
  content: string;
  quiz: QuizQuestion[];
  tasks?: Task[];
}

// Тип пропсов для компонента ChapterForm
export interface ChapterFormProps {
  chapter: ChapterData;
  index: number;
  onChange: (index: number, chapter: ChapterData) => void;
  onRemove: (index: number) => void;
  showRemoveButton: boolean;
}