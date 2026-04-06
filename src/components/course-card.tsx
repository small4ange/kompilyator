import React from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, CardFooter, Image, Button, Progress } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Course } from "../data/courses";

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const { id, title, description, imageUrl, progress, enrolled } = course;
  
  return (
    <Card className="w-full" disableRipple>
      <CardBody className="p-0">
        <Image
          removeWrapper
          alt={title}
          className="object-cover w-full h-48"
          src={imageUrl}
        />
        <div className="p-4">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-default-500 line-clamp-2">{description}</p>
        </div>
      </CardBody>
      <CardFooter className="flex flex-col items-stretch gap-2">
        {enrolled && typeof progress === 'number' && (
          <div className="w-full">
            <div className="flex justify-between text-small mb-1">
              <p>Progress</p>
              <p>{progress}%</p>
            </div>
            <Progress
              aria-label="Прогресс прохождения"
              value={progress}
              color="primary"
              className="h-2"
            />
          </div>
        )}
        <Button
          as={Link}
          to={`/courses/${id}`}
          color="primary"
          variant={enrolled ? "flat" : "solid"}
          fullWidth
          endContent={<Icon icon="lucide:arrow-right" />}
        >
          {enrolled ? "Отмена" : "Начать"}
        </Button>
      </CardFooter>
    </Card>
  );
};