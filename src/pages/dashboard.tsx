import React from "react";
import { Card, CardBody, CardHeader, Divider, Tabs, Tab, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Layout } from "../components/layout";
import { CourseCard } from "../components/course-card";
import { useAuth } from "../contexts/auth-context";
import { getUserCourses } from "../api/courses";
import { Course } from "../types/course";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = React.useState("all");
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = React.useState<Course[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const userCourses = await getUserCourses();
        setCourses(userCourses);
        setEnrolledCourses(userCourses.filter(course => course.enrolled));
      } catch (error) {
        console.error("Ошибка при получении курсов:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchCourses();
    }
  }, [user]);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Добро пожаловать, {user?.name}!</h1>
        <p className="text-default-500">Продолжайте обучение или изучайте новые курсы.</p>
      </div>

      <Tabs 
        selectedKey={selectedTab} 
        onSelectionChange={setSelectedTab as any}
        aria-label="Course tabs"
        className="mb-6"
      >
        <Tab 
          key="all" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:layout-grid" />
              <span>Все курсы</span>
            </div>
          }
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" color="primary" />
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-12">
                <Icon icon="lucide:book-x" className="text-default-400 mb-4" width={48} height={48} />
                <p className="text-default-500">Нет курсов доступных на данный момент.</p>
              </CardBody>
            </Card>
          )}
        </Tab>
        <Tab 
          key="enrolled" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:bookmark" />
              <span>Мои курсы</span>
            </div>
          }
        >
          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-12">
                <Icon icon="lucide:book-marked" className="text-default-400 mb-4" width={48} height={48} />
                <p className="text-default-500">У вас нет начатых курсов на данный момент.</p>
              </CardBody>
            </Card>
          )}
        </Tab>
      </Tabs>

      <Card className="mt-8" disableRipple>
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md font-semibold">Рекомендации для эффективного обучения</p>
            <p className="text-small text-default-500">Как получить максимум от вашего обучения</p>
          </div>
        </CardHeader>
        <Divider />
        {/*todo: расписать памятку как учиться на курсах*/}
        <CardBody>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <Icon icon="lucide:clock" className="text-primary mt-1" />
              <span>Ежедневно уделяйте время обучению.</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="lucide:notebook-pen" className="text-primary mt-1" />
              <span>Конспектируйте материалы курса.</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="lucide:brain-circuit" className="text-primary mt-1" />
              <span>Закрепляйте знания на реальных проектах.</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="lucide:milestone" className="text-primary mt-1" />
              <span>Ставьте измеримые цели и следите за успехами.</span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </Layout>
  );
};