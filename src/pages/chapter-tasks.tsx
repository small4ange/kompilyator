import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardBody, Button, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import { Layout } from '../components/layout';
import { getChapterTasks } from '../api/tasks';
import { TaskListItem } from '../types/task';

export const ChapterTasks: React.FC = () => {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>();
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [chapterId]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await getChapterTasks(chapterId);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Spinner label="Загрузка задач..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <Button
          as={Link}
          to={`/courses/${courseId}/chapters/${chapterId}`}
          variant="light"
          startContent={<Icon icon="lucide:arrow-left" />}
        >
          Назад к главе
        </Button>
        <h1 className="text-2xl font-bold mt-4">Практические задачи</h1>
        <p className="text-default-500">Решите задачи, чтобы закрепить материал</p>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Icon icon="lucide:code-2" className="w-12 h-12 mx-auto text-default-400 mb-3" />
            <p className="text-default-500">В этой главе пока нет задач</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardBody className="flex flex-row justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{task.title}</h3>
                </div>
                <Button
                  as={Link}
                  to={`/courses/${courseId}/chapters/${chapterId}/tasks/${task.id}`}
                  color="primary"
                  endContent={<Icon icon="lucide:arrow-right" />}
                >
                  Решить
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
};