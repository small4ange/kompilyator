import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db import models
from app.schemas import course as course_schema
from app.core.security import get_admin_user
from app.crud import TaskCRUD
from app.schemas.course import TaskResponse

router = APIRouter()


@router.post("/courses", response_model=course_schema.CourseResponse)
def create_course(
        course: course_schema.CourseCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_admin_user)
):
    db_course = models.Course(
        title=course.title,
        description=course.description,
        image_url=course.imageUrl
    )
    db.add(db_course)
    db.flush()

    for i, chapter_data in enumerate(course.chapters):
        db_chapter = models.Chapter(
            course_id=db_course.id,
            title=chapter_data.title,
            content=chapter_data.content,
            order=i
        )
        db.add(db_chapter)
        db.flush()

        for quiz_data in chapter_data.quiz:
            db_quiz = models.Quiz(
                chapter_id=db_chapter.id,
                question=quiz_data.question,
                options=quiz_data.options,
                correct_option=quiz_data.correctOption
            )
            db.add(db_quiz)

        if hasattr(chapter_data, 'tasks') and chapter_data.tasks:
            for task_data in chapter_data.tasks:
                TaskCRUD.create_task(
                    db=db,
                    chapter_id=db_chapter.id,
                    task_data=task_data
                )
    db.commit()
    db.refresh(db_course)

    formatted_chapters = []
    for chapter in db_course.chapters:
        formatted_quizzes = [
            {
                "id": quiz.id,
                "question": quiz.question,
                "options": quiz.options,
                "correctOption": quiz.correct_option
            }
            for quiz in chapter.quizzes
        ]

        formatted_tasks = [TaskResponse.model_validate(task) for task in chapter.tasks]

        formatted_chapters.append({
            "id": chapter.id,
            "title": chapter.title,
            "content": chapter.content,
            "quiz": formatted_quizzes,
            "tasks": formatted_tasks,
            "completed": False
        })

    return {
        "id": db_course.id,
        "title": db_course.title,
        "description": db_course.description,
        "imageUrl": db_course.image_url,
        "chapters": formatted_chapters,
        "progress": 0,
        "enrolled": False,
        "enrollmentCode": db_course.enrollment_code
    }


@router.put("/courses/{course_id}", response_model=course_schema.CourseResponse)
def update_course(
        course_id: str,
        course_update: course_schema.CourseUpdate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_admin_user)
):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    db_course.title = course_update.title
    db_course.description = course_update.description
    db_course.image_url = course_update.imageUrl

    existing_chapters = {str(ch.id): ch for ch in db_course.chapters}
    updated_chapter_ids = []

    for i, chapter_data in enumerate(course_update.chapters):
        chapter_id = getattr(chapter_data, "id", None)

        if chapter_id and chapter_id in existing_chapters:
            # ===== ОБНОВЛЕНИЕ СУЩЕСТВУЮЩЕЙ ГЛАВЫ =====
            db_chapter = existing_chapters[chapter_id]
            db_chapter.title = chapter_data.title
            db_chapter.content = chapter_data.content
            db_chapter.order = i

            # 1. Обновляем Quiz
            existing_quizzes = {str(q.id): q for q in db_chapter.quizzes}
            updated_quiz_ids = []

            for quiz_data in chapter_data.quiz:
                quiz_id = getattr(quiz_data, "id", None)

                if quiz_id and quiz_id in existing_quizzes:
                    db_quiz = existing_quizzes[quiz_id]
                    db_quiz.question = quiz_data.question
                    db_quiz.options = quiz_data.options
                    db_quiz.correct_option = quiz_data.correctOption
                    updated_quiz_ids.append(quiz_id)
                else:
                    db_quiz = models.Quiz(
                        chapter_id=db_chapter.id,
                        question=quiz_data.question,
                        options=quiz_data.options,
                        correct_option=quiz_data.correctOption
                    )
                    db.add(db_quiz)
                    if quiz_id:
                        updated_quiz_ids.append(quiz_id)

            # Удаляем Quiz, которых нет в обновлении
            for quiz_id, quiz in existing_quizzes.items():
                if quiz_id not in updated_quiz_ids:
                    db.delete(quiz)

            # ===== НОВЫЙ КОД: 2. Обновляем Tasks =====
            existing_tasks = {str(t.id): t for t in db_chapter.tasks}
            updated_task_ids = []

            if hasattr(chapter_data, 'tasks') and chapter_data.tasks:
                for task_data in chapter_data.tasks:
                    task_id = getattr(task_data, "id", None)

                    if task_id and task_id in existing_tasks:
                        # Обновляем существующую задачу через CRUD
                        TaskCRUD.update_task(db, task_id, task_data)
                        updated_task_ids.append(task_id)
                    else:
                        # Создаем новую задачу
                        new_task = TaskCRUD.create_task(db, db_chapter.id, task_data)
                        updated_task_ids.append(new_task.id)

            # Удаляем задачи, которых нет в обновлении
            for task_id, task in existing_tasks.items():
                if task_id not in updated_task_ids:
                    db.delete(task)

        else:
            # ===== СОЗДАНИЕ НОВОЙ ГЛАВЫ =====
            db_chapter = models.Chapter(
                course_id=db_course.id,
                title=chapter_data.title,
                content=chapter_data.content,
                order=i
            )
            db.add(db_chapter)
            db.flush()

            # Создаем Quiz
            for quiz_data in chapter_data.quiz:
                db_quiz = models.Quiz(
                    chapter_id=db_chapter.id,
                    question=quiz_data.question,
                    options=quiz_data.options,
                    correct_option=quiz_data.correctOption
                )
                db.add(db_quiz)

            # Создаем Tasks
            if hasattr(chapter_data, 'tasks') and chapter_data.tasks:
                for task_data in chapter_data.tasks:
                    TaskCRUD.create_task(db, db_chapter.id, task_data)

        if chapter_id:
            updated_chapter_ids.append(chapter_id)

    # Удаляем главы, которых нет в обновлении
    for chapter_id, chapter in existing_chapters.items():
        if chapter_id not in updated_chapter_ids:
            # Удаляем прогресс пользователей
            db.query(models.UserProgress).filter(
                models.UserProgress.chapter_id == chapter.id
            ).delete()
            db.delete(chapter)

    db.commit()
    db.refresh(db_course)

    # Формируем ответ с задачами
    formatted_chapters = []
    for chapter in db_course.chapters:
        formatted_quizzes = [
            {
                "id": quiz.id,
                "question": quiz.question,
                "options": quiz.options,
                "correctOption": quiz.correct_option
            }
            for quiz in chapter.quizzes
        ]

        formatted_tasks = [TaskResponse.model_validate(task) for task in chapter.tasks]

        formatted_chapters.append({
            "id": chapter.id,
            "title": chapter.title,
            "content": chapter.content,
            "quiz": formatted_quizzes,
            "tasks": formatted_tasks,
            "completed": False
        })

    return {
        "id": db_course.id,
        "title": db_course.title,
        "description": db_course.description,
        "imageUrl": db_course.image_url,
        "chapters": formatted_chapters,
        "progress": 0,
        "enrolled": False,
        "enrollmentCode": db_course.enrollment_code
    }


@router.delete("/courses/{course_id}")
def delete_course(
        course_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_admin_user)
):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    db.delete(db_course)
    db.commit()

    return {"message": "Course deleted successfully"}