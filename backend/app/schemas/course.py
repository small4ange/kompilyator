from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# ========== Схемы для тестов задачи ==========
class TaskTestBase(BaseModel):
    input_data: str = Field(default="", description="Входные данные")
    expected_output: str = Field(..., description="Ожидаемый вывод")
    is_example: bool = Field(default=False)
    order: int = Field(default=0)


class TaskTestCreate(TaskTestBase):
    id: Optional[str] = None


class TaskTestResponse(TaskTestBase):
    id: str

    class Config:
        from_attributes = True


# ========== Схемы для задач ==========
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., description="HTML описание")
    order: int = Field(default=0)


class TaskCreate(TaskBase):
    id: Optional[str] = None
    tests: List[TaskTestCreate] = Field(default_factory=list)


class TaskUpdate(TaskBase):
    tests: List[TaskTestCreate] = Field(default_factory=list)
    deleted_test_ids: Optional[List[str]] = None


class TaskResponse(TaskBase):
    id: str
    chapter_id: str
    tests: List[TaskTestResponse]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskListItemResponse(BaseModel):
    id: str
    title: str
    order: int
    has_tests: bool

    class Config:
        from_attributes = True


# ========== Схемы для Quiz ==========
class QuizBase(BaseModel):
    question: str
    options: List[str]
    correctOption: int


class QuizCreate(QuizBase):
    pass


class QuizResponse(QuizBase):
    id: str

    class Config:
        from_attributes = True


# ========== Схемы для Chapter ==========
class ChapterBase(BaseModel):
    title: str
    content: str


class ChapterCreate(ChapterBase):
    id: Optional[str] = None
    quiz: List[QuizCreate] = Field(default_factory=list)
    tasks: List[TaskCreate] = Field(default_factory=list)


class ChapterUpdate(ChapterBase):
    quiz: List[QuizCreate] = Field(default_factory=list)
    tasks: List[TaskCreate] = Field(default_factory=list)
    deleted_quiz_ids: Optional[List[str]] = None
    deleted_task_ids: Optional[List[str]] = None


class ChapterResponse(ChapterBase):
    id: str
    quiz: List[QuizResponse]
    tasks: List[TaskResponse] = Field(default_factory=list)  # ← Теперь TaskResponse определен!
    completed: Optional[bool] = False

    class Config:
        from_attributes = True


# ========== Схемы для Course ==========
class CourseBase(BaseModel):
    title: str
    description: str
    imageUrl: str


class CourseCreate(CourseBase):
    chapters: List[ChapterCreate]


class CourseUpdate(CourseBase):
    chapters: List[ChapterCreate]


class CourseResponse(CourseBase):
    id: str
    chapters: List[ChapterResponse]
    progress: Optional[int] = 0
    enrolled: Optional[bool] = False
    enrollmentCode: Optional[str] = None

    class Config:
        from_attributes = True


# ========== Схемы для выполнения задач ==========
class TaskSubmissionBase(BaseModel):
    code: str = Field(..., description="Код решения пользователя")
    language: str = Field("python", description="Язык программирования")


class TaskSubmissionResponse(TaskSubmissionBase):
    id: str
    passed: bool
    tests_passed: int
    total_tests: int
    execution_time: Optional[int]
    submitted_at: datetime
    test_results: Optional[List['TaskTestResultResponse']] = None


class TaskTestResultResponse(BaseModel):
    test_id: str
    input_data: str
    expected_output: str
    actual_output: str
    passed: bool
    is_example: bool


class TaskExecutionRequest(BaseModel):
    code: str
    language: str = "python"
    tests: List[TaskTestCreate]


class TaskExecutionResponse(BaseModel):
    passed: bool
    tests_passed: int
    total_tests: int
    test_results: List[TaskTestResultResponse]
    compilation_error: Optional[str] = None


class QuizSubmission(BaseModel):
    answers: Dict[str, int]


class QuizResult(BaseModel):
    score: int
    passed: bool
    correctAnswers: int
    totalQuestions: int


class EnrollmentCodeRequest(BaseModel):
    enrollmentCode: str


class EnrollmentResponse(BaseModel):
    success: bool
    message: str