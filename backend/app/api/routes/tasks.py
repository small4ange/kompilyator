from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db import models
from app.schemas import course as task_schema
from app.core.security import get_current_active_user, get_admin_user
from app.crud.task_crud import TaskCRUD

router = APIRouter()


# ========== АДМИНСКИЕ РОУТЫ ДЛЯ ЗАДАЧ (создание/изменение/удаление) ==========

@router.post(
    "/chapters/{chapter_id}/tasks",
    response_model=task_schema.TaskResponse,
    status_code=status.HTTP_201_CREATED
)
def create_task(
        chapter_id: str,
        task_data: task_schema.TaskCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_admin_user)
):
    """
    Создать новую задачу в главе.
    Требует прав администратора.
    """
    #существует ли глава
    chapter = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Глава не найдена"
        )
    #создание задачи
    db_task = TaskCRUD.create_task(db, chapter_id, task_data)
    return db_task


@router.put(
    "/tasks/{task_id}",
    response_model=task_schema.TaskResponse
)
def update_task(
        task_id: str,
        task_data: task_schema.TaskUpdate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_admin_user)  # Только админ!
):
    """
    Обновить существующую задачу.
    Можно обновить название, описание, порядок и тесты.
    """
    db_task = TaskCRUD.update_task(db, task_id, task_data)
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Задача не найдена"
        )
    return db_task


@router.delete(
    "/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_task(
        task_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_admin_user)  # Только админ!
):
    """
    Удалить задачу.
    Все связанные тесты удалятся автоматически.
    """
    deleted = TaskCRUD.delete_task(db, task_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Задача не найдена"
        )
    return None  # 204


# ========== ПОЛЬЗОВАТЕЛЬСКИЕ РОУТЫ (просмотр) ==========

@router.get(
    "/chapters/{chapter_id}/tasks",
    response_model=List[task_schema.TaskListItemResponse]
)
def get_chapter_tasks(
        chapter_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user)
):
    """
    Получить список всех задач главы (без тестов, только заголовки).
    Доступно только после записи на курс.
    """
    #проверяем существование главы
    chapter = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Глава не найдена"
        )

    #проверяем, записан ли пользователь на курс
    enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id,
        models.Enrollment.course_id == chapter.course_id
    ).first()

    if not enrollment and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы должны записаться на курс, чтобы видеть задачи"
        )

    #получаем задачи
    tasks = TaskCRUD.get_tasks_by_chapter(db, chapter_id)
    return [
        task_schema.TaskListItemResponse(
            id=task.id,
            title=task.title,
            order=task.order,
            has_tests=len(task.tests) > 0
        )
        for task in tasks
    ]


@router.get(
    "/tasks/{task_id}",
    response_model=task_schema.TaskResponse
)
def get_task(
        task_id: str,
        include_example_only: bool = False,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user)
):
    """
    Получить полную информацию о задаче (с тестами).
    - include_example_only: если True, возвращает только пример теста (для отображения на странице)
    """
    #получаем задачу
    task = TaskCRUD.get_task_by_id(db, task_id, include_tests=not include_example_only)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Задача не найдена"
        )

    #проверяем доступ
    enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id,
        models.Enrollment.course_id == task.chapter.course_id
    ).first()

    if not enrollment and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы должны записаться на курс, чтобы видеть задачи"
        )

    #если нужен только пример теста
    tests = []
    if include_example_only:
        example_test = TaskCRUD.get_example_test(db, task_id)
        if example_test:
            tests = [example_test]
    else:
        tests = task.tests

    #форматируем ответ
    return task_schema.TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        order=task.order,
        chapter_id=task.chapter_id,
        tests=[
            task_schema.TaskTestResponse(
                id=t.id,
                input_data=t.input_data,
                expected_output=t.expected_output,
                is_example=t.is_example,
                order=t.order
            )
            for t in tests
        ],
        created_at=task.created_at,
        updated_at=task.updated_at
    )