import React from "react";
import { useParams, Link, useHistory } from "react-router-dom";
import { Card, CardBody, CardHeader, CardFooter, Button, Divider, Radio, RadioGroup } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Layout } from "../components/layout";
import { useAuth } from "../contexts/auth-context";
import { getCourseById } from "../data/courses";
import { getChapterById, submitQuizAnswers } from "../api/courses";
import { Chapter, QuizResult } from "../types/course";

interface QuizParams {
  courseId: string;
  chapterId: string;
}

export const ChapterQuiz: React.FC = () => {
  const { courseId, chapterId } = useParams<QuizParams>();
  const { user } = useAuth();
  const history = useHistory();
  const [chapter, setChapter] = React.useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedOptions, setSelectedOptions] = React.useState<Record<string, number>>({});
  const [showResults, setShowResults] = React.useState(false);
  const [quizResult, setQuizResult] = React.useState<QuizResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchChapter = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const chapterData = await getChapterById(courseId, chapterId);
        setChapter(chapterData);
      } catch (err: any) {
        console.error("Ошибка подключения к тестированию:", err);
        if (err?.response?.status === 403) {
          setError("Вы обязаны вступить на курс для доступа к тестам.");
        } else {
          setError("Ошибка загрузки тестирования. Пожалуйста, попробуйте отправить запрос позднее.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId && chapterId) {
      fetchChapter();
    }
  }, [courseId, chapterId]);

  const handleOptionSelect = (value: string) => {
    if (chapter && chapter.quiz[currentQuestionIndex]) {
      setSelectedOptions({
        ...selectedOptions,
        [chapter.quiz[currentQuestionIndex].id]: parseInt(value, 10)
      });
    }
  };

  const handleNextQuestion = () => {
    if (!chapter) return;
    
    if (currentQuestionIndex < chapter.quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    if (!chapter || !user) return;
    
    try {
      setIsSubmitting(true);
      const result = await submitQuizAnswers(courseId, chapterId, selectedOptions);
      setQuizResult(result);
      setShowResults(true);
    } catch (err) {
      console.error("Ошибка подтверждения курса:", err);
      alert("Ошибка подтверждения курса. Пожалуйста, попробуйте отправить запрос позднее.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const getCurrentQuestion = () => {
    if (!chapter || !chapter.quiz || chapter.quiz.length === 0) return null;
    return chapter.quiz[currentQuestionIndex];
  };

  const handleFinishQuiz = () => {
    history.push(`/courses/${courseId}`);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p>Загрузка...</p>
        </div>
      </Layout>
    );
  }

  if (!chapter) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Icon icon="lucide:alert-circle" className="text-danger mb-4" width={48} height={48} />
          <h2 className="text-2xl font-bold mb-2">Тест не найден</h2>
          <p className="text-default-500 mb-6">Тест не существует или был удален.</p>
          <Button as={Link} to={`/courses/${courseId}`} color="primary">
            Назад к курсу
          </Button>
        </div>
      </Layout>
    );
  }

  const currentQuestion = getCurrentQuestion();

  if (!currentQuestion) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Icon icon="lucide:alert-circle" className="text-danger mb-4" width={48} height={48} />
          <h2 className="text-2xl font-bold mb-2">Нет доступа к вопросам</h2>
          <p className="text-default-500 mb-6">В тесте нет вопросов.</p>
          <Button as={Link} to={`/courses/${courseId}`} color="primary">
            Назад к курсу
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button 
            as={Link} 
            to={`/courses/${courseId}/chapters/${chapterId}`} 
            variant="light" 
            startContent={<Icon icon="lucide:arrow-left" />}
          >
            Назад к Главе
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Quiz: {chapter.title}</h1>
        <p className="text-default-500">
          Ответьте на все вопросы для завершения тестирования.
        </p>
      </div>

      {showResults && quizResult ? (
        <Card disableRipple>
          <CardHeader>
            <h2 className="text-xl font-semibold">Quiz Results</h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col items-center py-12">
            <div className={`
              w-32 h-32 rounded-full flex items-center justify-center mb-6
              ${quizResult.passed ? 'bg-success-100 text-success' : 'bg-danger-100 text-danger'}
            `}>
              <div className="text-center">
                <div className="text-4xl font-bold">{quizResult.score}%</div>
                <div className="text-sm">{quizResult.passed ? 'Выполнено' : 'Ошибка'}</div>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-2">
              {quizResult.passed 
                ? 'Поздравляем!'
                : 'Продолжайте практиковаться!'}
            </h3>
            
            <p className="text-default-500 text-center mb-6">
              {quizResult.passed 
                ? 'Глава пройдена.'
                : 'Для прохождения этого теста вам нужно набрать не менее 70%. Попробуйте ещё раз!'}
            </p>
            
            <div className="flex gap-4">
              {!quizResult.passed && (
                <Button
                  color="primary"
                  variant="flat"
                  onPress={() => {
                    setCurrentQuestionIndex(0);
                    setSelectedOptions({});
                    setShowResults(false);
                  }}
                  startContent={<Icon icon="lucide:refresh-cw" />}
                >
                  Попробовать еще раз
                </Button>
              )}
              <Button
                color="primary"
                onPress={handleFinishQuiz}
                endContent={<Icon icon="lucide:check-circle" />}
              >
                {quizResult.passed ? 'Перейти к следующей главе' : 'Назад к курсу'}
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card disableRipple>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Question {currentQuestionIndex + 1} of {chapter.quiz.length}</h2>
              <div className="text-default-500 text-small">
                {Math.round(((currentQuestionIndex + 1) / chapter.quiz.length) * 100)}% Complete
              </div>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="py-8">
            <div className="bg-gray-100 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-medium whitespace-pre-wrap">
                {currentQuestion.question}
              </h3>
            </div>
            
            <RadioGroup
              value={selectedOptions[currentQuestion.id]?.toString() || ""}
              onValueChange={handleOptionSelect}
              className="space-y-3"
            >
              {currentQuestion.options.map((option: string, index: number) => (
                <Radio key={index} value={index.toString()}>
                  {option}
                </Radio>
              ))}
            </RadioGroup>
          </CardBody>
          <Divider />
          <CardFooter className="flex justify-between">
            <Button
              variant="flat"
              startContent={<Icon icon="lucide:arrow-left" />}
              onPress={handlePreviousQuestion}
              isDisabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button
              color="primary"
              endContent={
                currentQuestionIndex < chapter.quiz.length - 1 
                  ? <Icon icon="lucide:arrow-right" /> 
                  : <Icon icon="lucide:check-circle" />
              }
              onPress={handleNextQuestion}
              isDisabled={selectedOptions[currentQuestion.id] === undefined}
            >
              {currentQuestionIndex < chapter.quiz.length - 1 ? 'Далее' : 'Завершить тестирование'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </Layout>
  );
};