from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db import models
from app.schemas import course as course_schema
from app.core.security import get_current_active_user
from sqlalchemy import func
from app.schemas.course import TaskResponse

router = APIRouter()

@router.post("/{course_id}/enroll", response_model=course_schema.EnrollmentResponse)
def enroll_in_course(
    course_id: str,
    enrollment_request: course_schema.EnrollmentCodeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )
    
    existing_enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id,
        models.Enrollment.course_id == course_id
    ).first()
    
    if existing_enrollment:
        return {
            "success": True,
            "message": "Вы уже присоединились к изучению данного курса."
        }
    
    if course.enrollment_code.upper() != enrollment_request.enrollmentCode.upper():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный код"
        )
    
    new_enrollment = models.Enrollment(
        user_id=current_user.id,
        course_id=course.id
    )
    db.add(new_enrollment)
    db.commit()
    
    return {
        "success": True,
        "message": "Вы успешно присоединились к изучению курса!"
    }

@router.get("/", response_model=List[course_schema.CourseResponse])
def get_all_courses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    courses = db.query(models.Course).all()
    
    result = []
    for course in courses:
        enrollment = db.query(models.Enrollment).filter(
            models.Enrollment.user_id == current_user.id,
            models.Enrollment.course_id == course.id
        ).first()
        
        progress = 0
        if enrollment:
            total_chapters = len(course.chapters)
            if total_chapters > 0:
                completed_chapters = db.query(models.UserProgress).filter(
                    models.UserProgress.user_id == current_user.id,
                    models.UserProgress.course_id == course.id,
                    models.UserProgress.completed == True
                ).count()
                progress = int((completed_chapters / total_chapters) * 100)
        
        formatted_chapters = []
        for chapter in course.chapters:
            chapter_completed = db.query(models.UserProgress).filter(
                models.UserProgress.user_id == current_user.id,
                models.UserProgress.chapter_id == chapter.id,
                models.UserProgress.completed == True
            ).first() is not None
            
            formatted_quizzes = [
                {
                    "id": quiz.id,
                    "question": quiz.question,
                    "options": quiz.options,
                    "correctOption": quiz.correct_option
                }
                for quiz in chapter.quizzes
            ]
            
            formatted_chapters.append({
                "id": chapter.id,
                "title": chapter.title,
                "content": chapter.content,
                "quiz": formatted_quizzes,
                "completed": chapter_completed
            })
        
        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "imageUrl": course.image_url,
            "chapters": formatted_chapters,
            "progress": progress,
            "enrolled": enrollment is not None,
            "enrollmentCode": course.enrollment_code if current_user.role == "admin" else None
        })
    
    return result

@router.get("/user", response_model=List[course_schema.CourseResponse])
def get_user_courses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return get_all_courses(db, current_user)

@router.get("/{course_id}", response_model=course_schema.CourseResponse)
def get_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )
    
    enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id,
        models.Enrollment.course_id == course.id
    ).first()
    
    progress = 0
    if enrollment:
        total_chapters = len(course.chapters)
        if total_chapters > 0:
            completed_chapters = db.query(models.UserProgress).filter(
                models.UserProgress.user_id == current_user.id,
                models.UserProgress.course_id == course.id,
                models.UserProgress.completed == True
            ).count()
            progress = int((completed_chapters / total_chapters) * 100)
    
    formatted_chapters = []
    for chapter in course.chapters:
        chapter_completed = db.query(models.UserProgress).filter(
            models.UserProgress.user_id == current_user.id,
            models.UserProgress.chapter_id == chapter.id,
            models.UserProgress.completed == True
        ).first() is not None
        
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
            "completed": chapter_completed
        })
    
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "imageUrl": course.image_url,
        "chapters": formatted_chapters,
        "progress": progress,
        "enrolled": enrollment is not None,
        "enrollmentCode": course.enrollment_code if current_user.role == "admin" else None
    }

@router.get("/{course_id}/chapters/{chapter_id}", response_model=course_schema.ChapterResponse)
def get_chapter(
    course_id: str,
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Курс не найден"
        )
    
    enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id,
        models.Enrollment.course_id == course_id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы обязаны вступить на курс прежде чем открывать его главы"
        )
    
    chapter = db.query(models.Chapter).filter(
        models.Chapter.id == chapter_id,
        models.Chapter.course_id == course_id
    ).first()
    
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Глава не найдена"
        )
    
    chapter_completed = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.chapter_id == chapter.id,
        models.UserProgress.completed == True
    ).first() is not None
    
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
    
    return {
        "id": chapter.id,
        "title": chapter.title,
        "content": chapter.content,
        "quiz": formatted_quizzes,
        "tasks": formatted_tasks,
        "completed": chapter_completed
    }

@router.post("/{course_id}/chapters/{chapter_id}/complete")
def complete_chapter(
    course_id: str,
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Check if user is enrolled
    enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id,
        models.Enrollment.course_id == course_id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы обязаны вступить на курс"
        )
    
    chapter = db.query(models.Chapter).filter(
        models.Chapter.id == chapter_id,
        models.Chapter.course_id == course_id
    ).first()
    
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Глава не найдена"
        )
    
    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.chapter_id == chapter_id
    ).first()
    
    if progress:
        progress.completed = True
        progress.completed_at = func.now()
    else:
        progress = models.UserProgress(
            user_id=current_user.id,
            course_id=course_id,
            chapter_id=chapter_id,
            completed=True,
            completed_at=func.now()
        )
        db.add(progress)
    
    db.commit()
    
    return {"message": "Глава пройдена"}

@router.post("/{course_id}/chapters/{chapter_id}/quiz", response_model=course_schema.QuizResult)
def submit_quiz(
    course_id: str,
    chapter_id: str,
    submission: course_schema.QuizSubmission,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id,
        models.Enrollment.course_id == course_id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы обязаны вступить на курс"
        )
    
    chapter = db.query(models.Chapter).filter(
        models.Chapter.id == chapter_id,
        models.Chapter.course_id == course_id
    ).first()
    
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Глава не найдена"
        )
    
    quizzes = db.query(models.Quiz).filter(models.Quiz.chapter_id == chapter_id).all()
    if not quizzes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Для этой главы тестов нет"
        )
    
    total_questions = len(quizzes)
    correct_answers = 0
    
    for quiz in quizzes:
        if quiz.id in submission.answers and submission.answers[quiz.id] == quiz.correct_option:
            correct_answers += 1
    
    score = int((correct_answers / total_questions) * 100) if total_questions > 0 else 0
    passed = score >= 70  # 70% is passing score
    
    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.chapter_id == chapter_id
    ).first()
    
    if progress:
        progress.quiz_score = score
        if passed:
            progress.completed = True
            progress.completed_at = func.now()
    else:
        progress = models.UserProgress(
            user_id=current_user.id,
            course_id=course_id,
            chapter_id=chapter_id,
            quiz_score=score,
            completed=passed,
            completed_at=func.now() if passed else None
        )
        db.add(progress)
    
    db.commit()
    
    return {
        "score": score,
        "passed": passed,
        "correctAnswers": correct_answers,
        "totalQuestions": total_questions
    }
