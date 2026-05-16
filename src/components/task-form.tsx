import React from "react";
import { Card, CardBody, CardHeader, Button, Input, Textarea } from "@heroui/react";
import { Icon } from "@iconify/react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Task, TaskTest } from "../types/chapter";

interface TaskFormProps {
  task: Task;
  taskIndex: number;
  onChange: (taskIndex: number, updatedTask: Task) => void;
  onRemove: (taskIndex: number) => void;
  showRemoveButton: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  taskIndex,
  onChange,
  onRemove,
  showRemoveButton
}) => {
  //обновление полей задачи
  const handleTaskChange = (field: keyof Task, value: any) => {
    onChange(taskIndex, { ...task, [field]: value });
  };

  //добавление теста
  const handleAddTest = () => {
    const newTest: TaskTest = {
      input_data: "",
      expected_output: "",
      isExample: task.tests.length === 0, //первый тест-пример
      order: task.tests.length
    };
    onChange(taskIndex, {
      ...task,
      tests: [...task.tests, newTest]
    });
  };

  //обновление теста
  const handleTestChange = (testIndex: number, field: keyof TaskTest, value: string | boolean) => {
  const updatedTests = [...task.tests];
  updatedTests[testIndex] = { ...updatedTests[testIndex], [field]: value };
  onChange(taskIndex, { ...task, tests: updatedTests });
};

  //удаление теста
  const handleRemoveTest = (testIndex: number) => {
    const updatedTests = task.tests.filter((_, i) => i !== testIndex);
    onChange(taskIndex, { ...task, tests: updatedTests });
  };

  return (
    <Card className="mb-4 border border-default-200">
      <CardHeader className="flex justify-between items-center bg-default-50">
        <div className="flex items-center gap-2">
          <Icon icon="lucide:code-2" className="text-primary" />
          <h5 className="font-semibold">Задача {taskIndex + 1}</h5>
          {task.title && (
            <span className="text-small text-default-500">: {task.title}</span>
          )}
        </div>
        {showRemoveButton && (
          <Button
            size="sm"
            color="danger"
            variant="light"
            isIconOnly
            onPress={() => onRemove(taskIndex)}
          >
            <Icon icon="lucide:trash-2" />
          </Button>
        )}
      </CardHeader>

      <CardBody className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-small text-blue-800 flex items-start gap-2">
            <Icon icon="lucide:info" className="mt-0.5 flex-shrink-0" />
            <span>
              <strong>Что такое задача?</strong> Это практическое задание, где студент пишет код.
              Вы описываете условие, а затем добавляете тесты для автоматической проверки.
              Каждый тест сравнивает вывод программы студента с ожидаемым выводом.
            </span>
          </p>
        </div>
        <Input
          label="Название задачи"
          value={task.title}
          onChange={(e) => handleTaskChange('title', e.target.value)}
          placeholder="Пример: Сумма двух чисел"
          description="Краткое название, которое будет отображаться в списке задач"
          isRequired
        />
        <div>
          <label className="block text-small font-medium mb-2">
            Описание задачи
          </label>
          <ReactQuill
            theme="snow"
            value={task.description}
            onChange={(value) => {
                if (value !== task.description) {
                  handleTaskChange('description', value);
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
            placeholder={`Опишите условие задачи`}
          />
          <p className="text-small text-default-500 mt-1">
            Поддерживается HTML, изображения, форматирование кода. Опишите условие, примеры и подсказки.
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <div>
              <label className="text-small font-medium">Тесты для проверки</label>
              <p className="text-small text-default-500">
                Каждый тест проверяет, правильно ли работает программа
              </p>
            </div>
            <Button
              size="sm"
              color="success"
              variant="flat"
              onPress={handleAddTest}
              startContent={<Icon icon="lucide:plus" width={16} />}
            >
              Добавить тест
            </Button>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg mb-3">
            <p className="text-small text-gray-700 flex items-start gap-2">
              <Icon icon="lucide:help-circle" className="mt-0.5 flex-shrink-0" />
              <span>
                <strong>Как работают тесты:</strong> Программа студента запускается с указанными
                <strong> входными данными</strong>, и её вывод сравнивается с <strong>ожидаемым выводом</strong>.
                Если вывод совпадает точно (включая пробелы и переносы строк), тест считается пройденным.
                Первый тест обычно показывается студенту как пример.
              </span>
            </p>
          </div>

          {task.tests.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-default-200 rounded-lg">
              <Icon icon="lucide:flask" className="w-8 h-8 mx-auto text-default-400 mb-2" />
              <p className="text-default-500">Нет тестов</p>
              <p className="text-small text-default-400">Нажмите "Добавить тест" чтобы создать</p>
            </div>
          ) : (
            <div className="space-y-3">
              {task.tests.map((test, testIndex) => (
                <Card key={testIndex} className="bg-default-50">
                  <CardBody className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-small font-medium">Тест {testIndex + 1}</span>
                        {testIndex === 0 && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Пример (показывается студенту)
                          </span>
                        )}
                      </div>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleRemoveTest(testIndex)}
                      >
                        <Icon icon="lucide:trash-2" width={16} />
                      </Button>
                    </div>

                    <div className="flex gap-3 mt-2">
                      <div className="flex-1">
                        <Textarea
                          label="Входные данные"
                          value={test.input_data}
                          onChange={(e) => handleTestChange(testIndex, 'input_data', e.target.value)}
                          placeholder={`Пример:
5
10`}
                          rows={4}
                          description="Данные, которые программа получит на вход"
                        />
                      </div>
                      <div className="flex-1">
                        <Textarea
                          label="Ожидаемый вывод"
                          value={test.expected_output}
                          onChange={(e) => handleTestChange(testIndex, 'expected_output', e.target.value)}
                          placeholder={`Пример:
15`}
                          rows={4}
                          description="Точно такой вывод должна дать программа"
                        />
                      </div>
                    </div>

                    {testIndex > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`example-${taskIndex}-${testIndex}`}
                          checked={test.isExample || false}
                          onChange={(e) => handleTestChange(testIndex, 'isExample', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`example-${taskIndex}-${testIndex}`} className="text-small">
                          Показывать этот тест студенту как пример
                        </label>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};