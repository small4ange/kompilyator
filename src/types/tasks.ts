export interface TaskSubmission {
  taskId: string;
  code: string;           // Код, написанный пользователем
  language: string;       // Язык программирования (java, python и т.д.)
}

export interface TaskResult {
  taskId: string;
  passed: boolean;
  testsPassed: number;
  totalTests: number;
  results: TestResult[];
  compilationError?: string;
}

export interface TestResult {
  testId?: string;
  input: string;
  expected_output: string;
  actualOutput: string;
  passed: boolean;
}