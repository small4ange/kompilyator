// components/chapter-form.tsx
import React from "react";
import {
  Card, CardBody, CardHeader, Button, Input, Textarea,
  Divider, Accordion, AccordionItem, Tab, Tabs
} from "@heroui/react";
import { Icon } from "@iconify/react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Quiz, Task, TestCase } from "../types/chapter";
import { ChapterData, ChapterFormProps, QuizQuestion } from "../types/chapter";
import { TaskForm } from "./task-form";

interface ChapterData {
  id?: string;
  title: string;
  content: string;
  quiz: Quiz[];
  tasks: Task[];  // Добавляем задачи
}

interface ChapterFormProps {
  chapter: ChapterData;
  index: number;
  onChange: (index: number, chapter: ChapterData) => void;
  onRemove: (index: number) => void;
  showRemoveButton: boolean;
}

export const ChapterForm: React.FC<ChapterFormProps> = ({
  chapter,
  index,
  onChange,
  onRemove,
  showRemoveButton
}) => {
  // Обработчики для основных полей
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange(index, {
      ...chapter,
      [name]: value
    });
  };

  // Обработчики для Quiz
  const handleQuizQuestionChange = (qIndex: number, field: string, value: string) => {
    const updatedQuiz = [...chapter.quiz];
    updatedQuiz[qIndex] = {
      ...updatedQuiz[qIndex],
      [field]: value
    };
    onChange(index, {
      ...chapter,
      quiz: updatedQuiz
    });
  };

  const handleQuizOptionChange = (qIndex: number, optionIndex: number, value: string) => {
    const updatedQuiz = [...chapter.quiz];
    const updatedOptions = [...updatedQuiz[qIndex].options];
    updatedOptions[optionIndex] = value;
    updatedQuiz[qIndex] = {
      ...updatedQuiz[qIndex],
      options: updatedOptions
    };
    onChange(index, {
      ...chapter,
      quiz: updatedQuiz
    });
  };

  const handleCorrectOptionChange = (qIndex: number, value: number) => {
    const updatedQuiz = [...chapter.quiz];
    updatedQuiz[qIndex] = {
      ...updatedQuiz[qIndex],
      correctOption: value
    };
    onChange(index, {
      ...chapter,
      quiz: updatedQuiz
    });
  };

  const addQuizQuestion = () => {
    onChange(index, {
      ...chapter,
      quiz: [
        ...chapter.quiz,
        {
          question: "",
          options: ["", "", "", ""],
          correctOption: 0
        }
      ]
    });
  };

  const removeQuizQuestion = (qIndex: number) => {
    console.log("Удаляем вопрос с индексом:", qIndex);
    if (chapter.quiz.length > 1) {
      const updatedQuiz = chapter.quiz.filter((_, i) => i !== qIndex);
      updatedQuiz.splice(qIndex, 1);
      onChange(index, {
        ...chapter,
        quiz: updatedQuiz
      });
    }
  };

  //Обработчики для задач
   const handleAddTask = () => {
    const newTask: Task = {
      title: "",
      description: "",
      tests: [{ input: "", expected_output: "", isExample: true, order: 0 }]
    };
    onChange(index, {
      ...chapter,
      tasks: [...(chapter.tasks || []), newTask]
    });
  };

  const handleTaskChange = (taskIndex: number, updatedTask: Task) => {
    const updatedTasks = [...(chapter.tasks || [])];
    updatedTasks[taskIndex] = updatedTask;
    onChange(index, { ...chapter, tasks: updatedTasks });
  };

  const handleRemoveTask = (taskIndex: number) => {
    const updatedTasks = (chapter.tasks || []).filter((_, i) => i !== taskIndex);
    onChange(index, { ...chapter, tasks: updatedTasks });
  };

  return (
    <Card className="mb-6" disableRipple>
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Глава {index + 1}</h3>
        {showRemoveButton && (
          <Button
            size="sm"
            color="danger"
            variant="light"
            isIconOnly
            onPress={() => onRemove(index)}
          >
            <Icon icon="lucide:trash" />
          </Button>
        )}
      </CardHeader>
      <Divider />

      <CardBody className="space-y-6">
        {/* Основные поля главы */}
        <Input
          label="Заголовок главы"
          name="title"
          value={chapter.title}
          onChange={handleInputChange}
          placeholder="Введите заголовок главы"
          isRequired
        />

        {/* Теоретический материал */}
        <div>
          <label className="block text-small font-medium mb-2">Теоретический материал</label>
          <ReactQuill
            theme="snow"
            value={chapter.content}
            onChange={(value) => {
              if (value !== chapter.content) {
                onChange(index, { ...chapter, content: value });
              }
            }}
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
              ]
            }}
            placeholder="Введите теоретический материал (поддерживается HTML, изображения, код)"
          />
        </div>

        {/* Вкладки для Quiz и Tasks */}
        <Tabs aria-label="Типы контента" variant="underlined">
          {/* Вкладка с тестами (Quiz) */}
        <Tab key="quiz" title={
          <div className="flex items-center gap-2">
            <Icon icon="lucide:help-circle" />
            <span>Тесты (Quiz)</span>
          </div>
        }>
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-semibold">Вопросы для самопроверки</h4>
              <Button
                size="sm"
                color="primary"
                variant="flat"
                startContent={<Icon icon="lucide:plus" />}
                onPress={addQuizQuestion}
              >
                Добавить вопрос
              </Button>
            </div>

            <div className="space-y-4">
              {chapter.quiz.map((question, qIndex) => (
                <Card key={qIndex} className="border border-default-200">
                  <CardHeader className="flex justify-between items-center">
                    <span className="font-semibold">Вопрос {qIndex + 1}</span>
                    {chapter.quiz.length > 1 && (
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        isIconOnly
                        onClick={() => {
                          removeQuizQuestion(qIndex);
                        }}
                      >
                        <Icon icon="lucide:trash" size={16} />
                      </Button>
                    )}
                  </CardHeader>
                  <Divider />
                  <CardBody className="space-y-4">
                    <Input
                      label="Вопрос"
                      value={question.question}
                      onChange={(e) => handleQuizQuestionChange(qIndex, "question", e.target.value)}
                      placeholder="Введите вопрос"
                      isRequired
                    />

                    <div className="space-y-3">
                      <p className="text-small font-medium">Варианты ответов</p>
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-option-${index}-${qIndex}`}
                            checked={question.correctOption === optIndex}
                            onChange={() => handleCorrectOptionChange(qIndex, optIndex)}
                            className="w-4 h-4 text-primary"
                          />
                          <Input
                            value={option}
                            onChange={(e) => handleQuizOptionChange(qIndex, optIndex, e.target.value)}
                            placeholder={`Вариант ${optIndex + 1}`}
                            className="flex-1"
                            isRequired
                          />
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </Tab>

          {/*  Вкладка с задачами (Task) */}
          <Tab key="tasks" title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:code-2" />
              <span>Практические задачи</span>
            </div>
          }>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="text-md font-semibold">Задачи для программирования</h4>
                  <p className="text-small text-default-500">
                    Студенты пишут код, который проверяется автоматическими тестами
                  </p>
                </div>
                <Button
                  size="sm"
                  color="success"
                  variant="flat"
                  startContent={<Icon icon="lucide:plus" />}
                  onPress={handleAddTask}
                >
                  Добавить задачу
                </Button>
              </div>

              {(chapter.tasks || []).length === 0 ? (
                <div className="text-center py-8 text-default-400 border-2 border-dashed rounded-lg">
                  <Icon icon="lucide:code-2" className="w-12 h-12 mx-auto mb-2" />
                  <p>Нет практических задач</p>
                  <p className="text-sm">Нажмите "Добавить задачу" чтобы создать</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(chapter.tasks || []).map((task, taskIndex) => (
                    <TaskForm
                      key={taskIndex}
                      task={task}
                      taskIndex={taskIndex}
                      onChange={handleTaskChange}
                      onRemove={handleRemoveTask}
                      showRemoveButton={(chapter.tasks || []).length > 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
};