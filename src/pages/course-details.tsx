import React from "react";
import { useParams, Link, useHistory } from "react-router-dom";
import { Card, CardBody, CardHeader, Button, Progress, Divider, Chip, Accordion, AccordionItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Layout } from "../components/layout";
import { useAuth } from "../contexts/auth-context";
import { getCourseById, enrollInCourse } from "../api/courses";
import { Course } from "../types/course";
import { EnrollmentModal } from "../components/enrollment-modal";

interface CourseParams {
  courseId: string;
}

export const CourseDetails: React.FC = () => {
  const { courseId } = useParams<CourseParams>();
  const { user } = useAuth();
  const history = useHistory();
  const [course, setCourse] = React.useState<Course | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = React.useState(false);
  const [isEnrolling, setIsEnrolling] = React.useState(false);
  const [enrollmentError, setEnrollmentError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const courseData = await getCourseById(courseId);
        setCourse(courseData);
      } catch (err: any) {
        console.error("Ошибка подключения к курсам:", err);
        if (err?.response?.status === 403) {
          setError("Вам необходимо вступить на курс прежде чем открыть его.");
        } else {
          setError("Ошибка просмотра деталей курса. Пожалуйста, попробуйте отправить запрос позднее.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const handleStartCourse = () => {
    if (course?.enrolled) {
      // Пользователь вступил на курс => редирект на 1 главу
      const firstChapter = course.chapters.find((ch: any) => !ch.completed) || course.chapters[0];
      if (firstChapter) {
        history.push(`/courses/${courseId}/chapters/${firstChapter.id}`);
      }
    } else {
      // Пользователь еще не вступил на курс => show modal window
      setIsEnrollmentModalOpen(true);
      setEnrollmentError(null);
    }
  };

  const handleEnroll = async (enrollmentCode: string) => {
    if (!courseId) return;
    
    try {
      setIsEnrolling(true);
      setEnrollmentError(null);
      await enrollInCourse(courseId, enrollmentCode);
      
      // Обновление информации курса
      const courseData = await getCourseById(courseId);
      setCourse(courseData);
      
      setIsEnrollmentModalOpen(false);
      
      // Редирект на первую капчу
      const firstChapter = courseData.chapters[0];
      if (firstChapter) {
        history.push(`/courses/${courseId}/chapters/${firstChapter.id}`);
      }
    } catch (err: any) {
      console.error("Ошибка вступления на курс:", err);
      if (err?.response?.status === 400) {
        setEnrollmentError("Неверный код. Пожалуйста, попробуйте еще раз.");
      } else {
        setEnrollmentError("Ошибка вступления на курс. Пожалуйста, отправьте запрос позднее.");
      }
    } finally {
      setIsEnrolling(false);
    }
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

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Icon icon="lucide:alert-circle" className="text-danger mb-4" width={48} height={48} />
          <h2 className="text-2xl font-bold mb-2">Ошибка загрузки курса</h2>
          <p className="text-default-500 mb-6">{error}</p>
          <Button as={Link} to="/dashboard" color="primary">
            Все курсы
          </Button>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Icon icon="lucide:alert-circle" className="text-danger mb-4" width={48} height={48} />
          <h2 className="text-2xl font-bold mb-2">Курс не найден</h2>
          <p className="text-default-500 mb-6">Курса не существует или он был удален.</p>
          <Button as={Link} to="/dashboard" color="primary">
            Все курсы
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            <p className="text-default-500">{course.description}</p>
          </div>

          <Card className="mb-6" disableRipple>
            <CardHeader>
              <h2 className="text-xl font-semibold">Курс</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <Accordion selectionMode="multiple" defaultSelectedKeys={["1"]}>
                {course.chapters.map((chapter: any, index: number) => (
                  <AccordionItem
                    key={chapter.id}
                    title={
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="text-default-500">Глава {index + 1}:</span>
                          <span>{chapter.title}</span>
                        </div>
                        {chapter.completed && (
                          <Chip color="success" variant="flat" size="sm">
                            Completed
                          </Chip>
                        )}
                      </div>
                    }
                  >
                    <div className="py-2">
                      <p className="text-default-500 mb-4">
                        В этой главе рассматривается {chapter.title.toLowerCase()} и прилагается тест для проверки ваших знаний.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {course.enrolled ? (
                          <>
                            <Button
                              as={Link}
                              to={`/courses/${courseId}/chapters/${chapter.id}`}
                              color="primary"
                              variant="flat"
                              size="sm"
                              startContent={<Icon icon="lucide:book-open" />}
                            >
                              Начать обучение
                            </Button>
                            <Button
                              as={Link}
                              to={`/courses/${courseId}/chapters/${chapter.id}/quiz`}
                              color="secondary"
                              variant="flat"
                              size="sm"
                              startContent={<Icon icon="lucide:check-circle" />}
                            >
                              Пройти тест
                            </Button>
                          </>
                        ) : (
                          <p className="text-default-500 text-sm">
                            Пожалуйста вступите на курс для доступа к главам.
                          </p>
                        )}
                      </div>
                    </div>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4" disableRipple>
            <CardBody>
              <div className="aspect-video mb-4 overflow-hidden rounded-medium">
                <img 
                  src={course.imageUrl} 
                  alt={course.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {course.enrolled && typeof course.progress === 'number' && (
                <div className="mb-6">
                  <div className="flex justify-between text-small mb-1">
                    <p>Прогресс обучения</p>
                    <p>{course.progress}%</p>
                  </div>
                  <Progress
                    aria-label="Course progress"
                    value={course.progress}
                    color="primary"
                    className="h-2"
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:book" className="text-primary" />
                  <span>{course.chapters.length} Главы</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:check-circle" className="text-primary" />
                  <span>{course.chapters.length} Тесты</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:clock" className="text-primary" />
                  <span>{course.chapters.length * 30} мин</span>
                </div>
              </div>
              
              <Divider className="my-6" />
              
              <Button
                color="primary"
                fullWidth
                size="lg"
                onPress={handleStartCourse}
                startContent={<Icon icon={course.enrolled ? "lucide:play" : "lucide:book-open"} />}
              >
                {course.enrolled ? "Продолжить обучение" : "Начать"}
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      <EnrollmentModal
        isOpen={isEnrollmentModalOpen}
        onClose={() => {
          setIsEnrollmentModalOpen(false);
          setEnrollmentError(null);
        }}
        onEnroll={handleEnroll}
        isLoading={isEnrolling}
        error={enrollmentError}
      />
    </Layout>
  );
};