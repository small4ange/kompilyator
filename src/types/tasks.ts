export interface TestResult {
  test_id: string;
  input_data: string;
  expected_output: string;
  actual_output: string;
  passed: boolean;
  is_example: boolean;
}
export interface TaskTest {
  id: string;
  input_data: string;
  expected_output: string;
  is_example: boolean;
  order: number;
}
export interface Task {
  id: string;
  title: string;
  description: string;
  order: number;
  chapter_id: string;
  tests: TaskTest[];
  created_at: string;
  updated_at: string | null;
}

export interface TaskResult {
  taskId: string;
  passed: boolean;
  testsPassed: number;
  totalTests: number;
  results: TestResult[];
  compilationError?: string;
}


export interface TaskListItem {
  id: string;
  title: string;
  order: number;
  has_tests: boolean;
}

export interface TaskSubmission {
  code: string;
  language: string;
}

export interface TaskSubmissionResult {
  id: string;
  passed: boolean;
  tests_passed: number;
  total_tests: number;
  execution_time: number | null;
  submitted_at: string;
  test_results?: TestResult[];
}

export interface CodeExecutionRequest {
  code: string;
  language: string;
  tests: {
    input_data: string;
    expected_output: string;
    is_example: boolean;
    order: number;
  }[];
}

export interface CodeExecutionResponse {
  passed: boolean;
  tests_passed: number;
  total_tests: number;
  test_results: TestResult[];
  compilation_error: string | null;
}
