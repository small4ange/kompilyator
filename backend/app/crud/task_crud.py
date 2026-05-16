from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.db import models
from app.schemas import course as task_schema

class TaskCRUD:
    """Класс для всех операций с задачами"""

    @staticmethod
    def create_task(
            db: Session,
            chapter_id: str,
            task_data: task_schema.TaskCreate
    ) -> models.Task:
        """
        Создает новую задачу с тестами.
        """
        print("=" * 60)
        print("=== CRUD: CREATE TASK ===")
        print(f"Chapter ID: {chapter_id}")
        print(f"Task title: {task_data.title}")
        print(f"Task description: {task_data.description[:100]}...")
        print(f"Number of tests: {len(task_data.tests)}")

        for i, test_data in enumerate(task_data.tests):
            print(f"  Test {i}: input='{test_data.input_data}', output='{test_data.expected_output}'")

        # создаем задачу
        db_task = models.Task(
            chapter_id=chapter_id,
            title=task_data.title,
            description=task_data.description,
            order=task_data.order
        )
        db.add(db_task)
        db.flush()

        # создаем тесты для задачи
        for i, test_data in enumerate(task_data.tests):
            db_test = models.TaskTest(
                task_id=db_task.id,
                input_data=test_data.input_data,
                expected_output=test_data.expected_output,
                is_example=test_data.is_example,
                order=test_data.order or i
            )
            db.add(db_test)

        db.commit()
        db.refresh(db_task)

        return db_task

    @staticmethod
    def update_task(
            db: Session,
            task_id: str,
            task_data: task_schema.TaskUpdate
    ) -> Optional[models.Task]:
        """
        Обновляет задачу и её тесты
        """

        #находим задачу
        db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
        if not db_task:
            return None

        #обновляем основные поля
        db_task.title = task_data.title
        db_task.description = task_data.description
        db_task.order = task_data.order

        existing_tests = {t.id: t for t in db_task.tests}
        updated_test_ids = []

        #удаляем тесты, которые нужно удалить
        if task_data.deleted_test_ids:
            for test_id in task_data.deleted_test_ids:
                if test_id in existing_tests:
                    db.delete(existing_tests[test_id])

        #обновляем или создаем тесты
        for i, test_data in enumerate(task_data.tests):
            test_id = getattr(test_data, 'id', None)

            if test_id and test_id in existing_tests:
                #обновляем существующий тест
                db_test = existing_tests[test_id]
                db_test.input_data = test_data.input_data
                db_test.expected_output = test_data.expected_output
                db_test.is_example = test_data.is_example
                db_test.order = test_data.order or i
                updated_test_ids.append(test_id)
            else:
                #создаем новый тест
                db_test = models.TaskTest(
                    task_id=db_task.id,
                    input_data=test_data.input_data,
                    expected_output=test_data.expected_output,
                    is_example=test_data.is_example,
                    order=test_data.order or i
                )
                db.add(db_test)

        db.commit()
        db.refresh(db_task)
        return db_task

    @staticmethod
    def delete_task(db: Session, task_id: str) -> bool:
        """
        Удаляет задачу (тесты удалятся каскадно из-за cascade="all, delete-orphan")
        """
        db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
        if not db_task:
            return False

        db.delete(db_task)
        db.commit()
        return True

    @staticmethod
    def get_task_by_id(db: Session, task_id: str, include_tests: bool = True):
        import logging
        logging.info(f"=== get_task_by_id ===")
        logging.info(f"Looking for task_id: '{task_id}'")
        logging.info(f"Task_id type: {type(task_id)}")
        logging.info(f"Task_id length: {len(task_id)}")

        all_tasks = db.query(models.Task).all()
        logging.info(f"Total tasks in DB: {len(all_tasks)}")
        for t in all_tasks:
            logging.info(f"  - Task ID: '{t.id}', Title: '{t.title}'")

        query = db.query(models.Task).filter(models.Task.id == task_id)
        task = query.first()

        logging.info(f"Query result: {task is not None}")
        return task

    @staticmethod
    def get_tasks_by_chapter(
            db: Session,
            chapter_id: str,
            include_tests: bool = False
    ) -> List[models.Task]:
        """
        Получает все задачи главы, отсортированные по order.
        """
        query = db.query(models.Task).filter(
            models.Task.chapter_id == chapter_id
        ).order_by(models.Task.order)

        if include_tests:
            query = query.options(joinedload(models.Task.tests))

        return query.all()

    @staticmethod
    def get_example_test(db: Session, task_id: str) -> Optional[models.TaskTest]:
        """
        Получает пример теста (для отображения на странице задачи).
        Сначала ищет тест с is_example=True, иначе берет первый по порядку.
        """
        #сначала ищем помеченный как пример
        example = db.query(models.TaskTest).filter(
            models.TaskTest.task_id == task_id,
            models.TaskTest.is_example == True
        ).first()

        if example:
            return example

        #если нет помеченных, берем первый по порядку
        return db.query(models.TaskTest).filter(
            models.TaskTest.task_id == task_id
        ).order_by(models.TaskTest.order).first()