import React, { useCallback } from "react";
import { useParams, useHistory } from "react-router-dom";
import { Card, CardBody, CardHeader, CardFooter, Button, Input, Textarea, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Layout } from "../../components/layout";
import { getCourseById, updateCourse as apiUpdateCourse } from "../../api/courses";
import { ChapterForm } from "../../components/chapter-form";
import { ChapterData } from "../../types/chapter";
import { Course } from "../../types/course";

interface CourseParams {
  courseId: string;
}

interface ChapterFormData {
  id?: string;
  title: string;
  content: string;
  quiz: {
    id?: string;
    question: string;
    options: string[];
    correctOption: number;
  }[];
}

export const AdminCourseEdit: React.FC = () => {
  const { courseId } = useParams<CourseParams>();
  const history = useHistory();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [courseData, setCourseData] = React.useState({
    title: "",
    description: "",
    imageUrl: ""
  });
  const [chapters, setChapters] = React.useState<ChapterFormData[]>([]);

  React.useEffect(() => {
    const loadCourse = async () => {
      try {
        setIsLoading(true);
        const course = await getCourseById(courseId);
        
        if (course) {
          setCourseData({
            title: course.title,
            description: course.description,
            imageUrl: course.imageUrl
          });
          
          setChapters(course.chapters.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            content: chapter.content,
            quiz: chapter.quiz.map(q => ({
              id: q.id,
              question: q.question,
              options: q.options,
              correctOption: q.correctOption
            })),
            tasks: (chapter.tasks || []).map(task => ({
                  id: task.id,
                  title: task.title,
                  description: task.description,
                  tests: (task.tests || []).map(test => ({
                    id: test.id,
                    input: test.input,
                    expected_output: test.expected_output,
                    isExample: test.isExample,
                    order: test.order
                  })),
                  order: task.order
            }))
          })));
        }
      } catch (err) {
        console.error("Ошибка при загрузке курса:", err);
        alert("Ошибка загрузки данных курса. Пожалуйста, попробуйте снова.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCourse();
  }, [courseId]);

  const handleCourseInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCourseData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleAddChapter = useCallback(() => {
    setChapters(prev => [
      ...prev,
      {
        title: "",
        content: "",
        quiz: [{ question: "", options: ["", "", "", ""], correctOption: 0 }],
        tasks: []
      }
    ]);
  }, []);

  const handleChapterChange = useCallback((index: number, updatedChapter: ChapterData) => {
    setChapters(prev => {
        if (JSON.stringify(prev[index]) === JSON.stringify(updatedChapter)) {
          return prev;
        }
      const updated = [...prev];
      updated[index] = updatedChapter;
      return updated;
    });
  }, []);

  const handleRemoveChapter = useCallback((index: number) => {
    if (chapters.length > 1) {
      setChapters(prev => prev.filter((_, i) => i !== index));
    }
  }, [chapters.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Валидация
      if (!courseData.title || !courseData.description) {
        alert("Пожалуйста, заполните все поля курса");
        setIsSubmitting(false);
        return;
      }

      for (const chapter of chapters) {
        if (!chapter.title || !chapter.content) {
          alert("Пожалуйста, заполните все поля глав");
          setIsSubmitting(false);
          return;
        }

        for (const quiz of chapter.quiz) {
          if (!quiz.question || quiz.options.some(option => !option)) {
            alert("Пожалуйста, заполните все вопросы теста");
            setIsSubmitting(false);
            return;
          }
        }

        for (const task of chapter.tasks) {
          if (!task.title || !task.description) {
            alert("Пожалуйста, заполните название и описание всех задач");
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Подготовка данных для отправки
      const updateData = {
        ...courseData,
        chapters: chapters.map((chapter, index) => ({
          id: chapter.id,
          title: chapter.title,
          content: chapter.content,
          quiz: chapter.quiz.map((quiz, qIndex) => ({
            id: quiz.id,
            question: quiz.question,
            options: quiz.options,
            correctOption: quiz.correctOption
          })),
          tasks: chapter.tasks.map((task, tIndex) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            order: task.order || tIndex,
            tests: task.tests.map((test, testIndex) => ({
              id: test.id,
              input_data: test.input,
              expected_output: test.expected_output,
              is_example: test.isExample || testIndex === 0,
              order: test.order || testIndex
            }))
          }))
        }))
      };

      // 📌 ЛОГИРУЕМ ДАННЫЕ ПЕРЕД ОТПРАВКОЙ
        console.log("=== ОТПРАВКА ДАННЫХ ===");
        console.log("CourseId:", courseId);
        console.log("UpdateData:", JSON.stringify(updateData, null, 2));
        console.log("Задачи в главах:", updateData.chapters.map(ch => ({
          title: ch.title,
          tasksCount: ch.tasks.length,
          tasks: ch.tasks.map(t => ({ title: t.title, testsCount: t.tests.length }))
        })));

        // Отправляем запрос
        const response = await apiUpdateCourse(courseId, updateData);

        // 📌 ЛОГИРУЕМ ОТВЕТ
        console.log("=== ОТВЕТ СЕРВЕРА ===");
        console.log("Response:", response);

        // ВРЕМЕННО ОТКЛЮЧАЕМ РЕДИРЕКТ
        alert("Курс сохранен! Проверьте консоль (F12)");
        // history.push("/admin"); // ← ЗАКОММЕНТИРОВАЛИ
    } catch (error) {
      console.error("Error updating course:", error);
      alert("Произошла ошибка при обновлении курса");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p>Загрузка информации о курсе...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button 
            as="a" 
            href="/admin" 
            variant="light" 
            startContent={<Icon icon="lucide:arrow-left" />}
          >
            Вернуться на панель администратора
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-2">Редактирование курса</h1>
        <p className="text-default-500">Обновите информацию о курсе, добавьте главы, тесты и практические задачи</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-8" disableRipple>
          <CardHeader>
            <h2 className="text-xl font-semibold">Основная информация</h2>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-6">
            <Input
              label="Название курса"
              name="title"
              value={courseData.title}
              onChange={handleCourseInputChange}
              placeholder="Введите название курса"
              isRequired
            />
            <Textarea
              label="Описание курса"
              name="description"
              value={courseData.description}
              onChange={handleCourseInputChange}
              placeholder="Введите описание курса"
              minRows={3}
              isRequired
            />
            <Input
              label="URL изображения курса"
              name="imageUrl"
              value={courseData.imageUrl}
              onChange={handleCourseInputChange}
              placeholder="Введите URL изображения"
              isRequired
            />
            {courseData.imageUrl && (
              <div className="mt-2">
                <p className="text-small text-default-500 mb-2">Предпросмотр:</p>
                <img
                  src={courseData.imageUrl}
                  alt="Предпросмотр курса"
                  className="w-full max-w-md h-48 object-cover rounded-medium"
                />
              </div>
            )}
          </CardBody>
        </Card>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Главы курса</h2>
          <p className="text-small text-default-500">
              Каждая глава может содержать теоретический материал, тесты для самопроверки и практические задачи
          </p>
          <Button
            color="primary"
            variant="flat"
            startContent={<Icon icon="lucide:plus" />}
            onPress={handleAddChapter}
          >
            Добавить главу
          </Button>
        </div>

        {chapters.map((chapter, index) => (
          <ChapterForm
            key={index}
            chapter={chapter}
            index={index}
            onChange={handleChapterChange}
            onRemove={handleRemoveChapter}
            showRemoveButton={chapters.length > 1}
          />
        ))}

        <div className="mt-8 flex justify-end gap-3">
          <Button
            variant="flat"
            color="danger"
            onPress={() => history.push("/admin")}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            color="primary"
            isLoading={isSubmitting}
          >
            Сохранить изменения
          </Button>
        </div>
      </form>
    </Layout>
  );
};