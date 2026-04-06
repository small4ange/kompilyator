import pytest
from fastapi import status


def test_get_all_courses(client, user_token, test_course):
    """Test getting list of all courses"""
    response = client.get(
        "/courses",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["id"] == test_course.id
    assert data[0]["title"] == test_course.title
    assert "enrolled" in data[0]
    assert "progress" in data[0]


def test_get_all_courses_unauthorized(client):
    """Test getting courses without authentication"""
    response = client.get("/courses")
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_course_by_id(client, user_token, test_course):
    """Test getting a specific course by ID"""
    response = client.get(
        f"/courses/{test_course.id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_course.id
    assert data["title"] == test_course.title
    assert "chapters" in data
    assert len(data["chapters"]) > 0


def test_get_course_not_found(client, user_token):
    """Test getting non-existent course"""
    response = client.get(
        "/courses/nonexistent-id",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_create_course(client, admin_token):
    """Test creating a new course"""
    course_data = {
        "title": "New Test Course",
        "description": "Description of new course",
        "imageUrl": "https://example.com/image.jpg",
        "chapters": [
            {
                "id": "chapter-1",
                "title": "Chapter 1",
                "content": "Chapter content",
                "quiz": [
                    {
                        "id": "quiz-1",
                        "question": "Test question?",
                        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                        "correctOption": 0
                    }
                ]
            }
        ]
    }
    
    response = client.post(
        "/admin/courses",
        json=course_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == course_data["title"]
    assert data["description"] == course_data["description"]
    assert "enrollmentCode" in data
    assert data["enrollmentCode"] is not None
    assert len(data["chapters"]) == 1
    assert len(data["chapters"][0]["quiz"]) == 1


def test_create_course_unauthorized(client, user_token):
    """Test creating course without admin rights"""
    course_data = {
        "title": "New Test Course",
        "description": "Description",
        "imageUrl": "https://example.com/image.jpg",
        "chapters": []
    }
    
    response = client.post(
        "/admin/courses",
        json=course_data,
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_enroll_in_course(client, user_token, test_course):
    """Test enrolling in a course with correct code"""
    response = client.post(
        f"/courses/{test_course.id}/enroll",
        json={"enrollmentCode": test_course.enrollment_code},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True
    assert "enrolled" in data["message"].lower()


def test_enroll_in_course_wrong_code(client, user_token, test_course):
    """Test enrolling with wrong enrollment code"""
    response = client.post(
        f"/courses/{test_course.id}/enroll",
        json={"enrollmentCode": "WRONGCODE"},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "invalid" in response.json()["detail"].lower()


def test_enroll_in_course_already_enrolled(client, user_token, test_course, db):
    """Test enrolling when already enrolled"""
    from app.db import models
    
    # First enrollment
    client.post(
        f"/courses/{test_course.id}/enroll",
        json={"enrollmentCode": test_course.enrollment_code},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    # Try to enroll again
    response = client.post(
        f"/courses/{test_course.id}/enroll",
        json={"enrollmentCode": test_course.enrollment_code},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "already enrolled" in data["message"].lower()


def test_enroll_in_course_nonexistent(client, user_token):
    """Test enrolling in non-existent course"""
    response = client.post(
        "/courses/nonexistent-id/enroll",
        json={"enrollmentCode": "SOMECODE"},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_access_chapter_without_enrollment(client, user_token, test_course):
    """Test accessing chapter without enrollment"""
    # Get first chapter
    chapter_id = test_course.chapters[0].id
    
    response = client.get(
        f"/courses/{test_course.id}/chapters/{chapter_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "enrolled" in response.json()["detail"].lower()


def test_access_chapter_with_enrollment(client, user_token, test_course, db):
    """Test accessing chapter after enrollment"""
    # Enroll first
    client.post(
        f"/courses/{test_course.id}/enroll",
        json={"enrollmentCode": test_course.enrollment_code},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    # Get first chapter
    chapter_id = test_course.chapters[0].id
    
    response = client.get(
        f"/courses/{test_course.id}/chapters/{chapter_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == chapter_id
    assert "quiz" in data


def test_submit_quiz(client, user_token, test_course, db):
    """Test submitting quiz answers"""
    # Enroll first
    client.post(
        f"/courses/{test_course.id}/enroll",
        json={"enrollmentCode": test_course.enrollment_code},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    # Get quiz
    chapter = test_course.chapters[0]
    quiz = chapter.quizzes[0]
    
    # Submit correct answer
    response = client.post(
        f"/courses/{test_course.id}/chapters/{chapter.id}/quiz",
        json={"answers": {quiz.id: quiz.correct_option}},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "score" in data
    assert "passed" in data
    assert "correctAnswers" in data
    assert "totalQuestions" in data
    assert data["score"] == 100  # All correct
    assert data["passed"] is True


def test_submit_quiz_wrong_answers(client, user_token, test_course, db):
    """Test submitting quiz with wrong answers"""
    # Enroll first
    client.post(
        f"/courses/{test_course.id}/enroll",
        json={"enrollmentCode": test_course.enrollment_code},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    # Get quiz
    chapter = test_course.chapters[0]
    quiz = chapter.quizzes[0]
    
    # Submit wrong answer
    wrong_answer = (quiz.correct_option + 1) % len(quiz.options)
    response = client.post(
        f"/courses/{test_course.id}/chapters/{chapter.id}/quiz",
        json={"answers": {quiz.id: wrong_answer}},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["score"] == 0
    assert data["passed"] is False


def test_submit_quiz_without_enrollment(client, user_token, test_course):
    """Test submitting quiz without enrollment"""
    chapter = test_course.chapters[0]
    quiz = chapter.quizzes[0]
    
    response = client.post(
        f"/courses/{test_course.id}/chapters/{chapter.id}/quiz",
        json={"answers": {quiz.id: quiz.correct_option}},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == status.HTTP_403_FORBIDDEN

