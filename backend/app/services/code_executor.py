import subprocess
import tempfile
import os
import time
from typing import List, Dict, Any
from app.schemas import course as task_schema


class CodeExecutor:
    """Сервис для выполнения кода на разных языках"""

    @staticmethod
    def execute_python(code: str, tests: List[task_schema.TaskTestCreate]) -> Dict[str, Any]:
        """Выполнить Python код с тестами"""
        test_results = []
        passed_count = 0

        for i, test in enumerate(tests):
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
                full_code = f"""
    import sys
    from io import StringIO

    old_stdout = sys.stdout
    sys.stdout = StringIO()

    {code}

    output = sys.stdout.getvalue()
    sys.stdout = old_stdout

    print(output, end='')
    """
                f.write(full_code)
                temp_file = f.name

            try:
                start_time = time.time()
                process = subprocess.run(
                    ['python', temp_file],
                    input=test.input_data,
                    text=True,
                    capture_output=True,
                    timeout=5
                )
                execution_time = int((time.time() - start_time) * 1000)

                actual_output = process.stdout
                error_output = process.stderr

                if error_output:
                    test_results.append({
                        "test_id": str(i),
                        "input_data": test.input_data,
                        "expected_output": test.expected_output,
                        "actual_output": f"Ошибка: {error_output.strip()}",
                        "passed": False,
                        "is_example": test.is_example,
                        "execution_time": execution_time
                    })
                else:
                    passed = actual_output.strip() == test.expected_output.strip()
                    if passed:
                        passed_count += 1

                    test_results.append({
                        "test_id": str(i),
                        "input_data": test.input_data,
                        "expected_output": test.expected_output,
                        "actual_output": actual_output,
                        "passed": passed,
                        "is_example": test.is_example,
                        "execution_time": execution_time
                    })

            except subprocess.TimeoutExpired:
                test_results.append({
                    "test_id": str(i),
                    "input_data": test.input_data,
                    "expected_output": test.expected_output,
                    "actual_output": "Timeout (5 seconds)",
                    "passed": False,
                    "is_example": test.is_example,
                    "execution_time": 5000
                })
            except Exception as e:
                test_results.append({
                    "test_id": str(i),
                    "input_data": test.input_data,
                    "expected_output": test.expected_output,
                    "actual_output": f"Error: {str(e)}",
                    "passed": False,
                    "is_example": test.is_example,
                    "execution_time": 0
                })
            finally:
                try:
                    os.unlink(temp_file)
                except:
                    pass

        total_tests = len(tests)
        passed_all = passed_count == total_tests

        return {
            "passed": passed_all,
            "tests_passed": passed_count,
            "total_tests": total_tests,
            "test_results": test_results,
            "compilation_error": None,
            "execution_time": sum(
                r.get("execution_time", 0) for r in test_results) // total_tests if total_tests > 0 else 0
        }

    @staticmethod
    def execute(
            code: str,
            language: str,
            tests: List[task_schema.TaskTestCreate]
    ) -> Dict[str, Any]:
        """Основной метод выполнения кода"""

        if language == "python":
            return CodeExecutor.execute_python(code, tests)
        else:
            return {
                "passed": False,
                "tests_passed": 0,
                "total_tests": len(tests),
                "test_results": [],
                "compilation_error": f"Language '{language}' is not supported yet",
                "execution_time": None
            }