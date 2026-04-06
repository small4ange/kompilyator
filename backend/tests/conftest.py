import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os

from app.db.database import Base, get_db
from app.db import models
from app.core.security import get_password_hash
from main import app

# Use in-memory SQLite for testing (or PostgreSQL if DATABASE_URL is set for CI)
TEST_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///:memory:")

# Configure engine based on database type
if TEST_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    # PostgreSQL for CI/CD
    engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test"""
    # Drop all tables first to ensure clean state
    Base.metadata.drop_all(bind=engine)
    # Create all tables
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
        db.rollback()
    finally:
        db.close()
        # Clean up after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create a test client with database override"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db):
    """Create an admin user for testing"""
    user = models.User(
        email="admin@test.com",
        name="Admin User",
        role="admin",
        hashed_password=get_password_hash("testpass123")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def regular_user(db):
    """Create a regular user for testing"""
    user = models.User(
        email="user@test.com",
        name="Test User",
        role="user",
        hashed_password=get_password_hash("testpass123")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(client, admin_user):
    """Get admin authentication token"""
    response = client.post(
        "/auth/login",
        data={"username": admin_user.email, "password": "testpass123"}
    )
    return response.json()["access_token"]


@pytest.fixture
def user_token(client, regular_user):
    """Get regular user authentication token"""
    response = client.post(
        "/auth/login",
        data={"username": regular_user.email, "password": "testpass123"}
    )
    return response.json()["access_token"]


@pytest.fixture
def test_course(db, admin_user):
    """Create a test course"""
    from app.db.models import generate_enrollment_code
    from sqlalchemy.orm import joinedload
    
    course = models.Course(
        title="Test Course",
        description="This is a test course",
        image_url="https://example.com/image.jpg",
        enrollment_code=generate_enrollment_code()
    )
    db.add(course)
    db.flush()
    
    # Add a chapter with quiz
    chapter = models.Chapter(
        course_id=course.id,
        title="Chapter 1",
        content="Chapter content",
        order=0
    )
    db.add(chapter)
    db.flush()
    
    # Add a quiz
    quiz = models.Quiz(
        chapter_id=chapter.id,
        question="What is 2+2?",
        options=["3", "4", "5", "6"],
        correct_option=1
    )
    db.add(quiz)
    db.commit()
    
    # Reload course with relationships
    db.refresh(course)
    # Eager load relationships
    course = db.query(models.Course).options(
        joinedload(models.Course.chapters).joinedload(models.Chapter.quizzes)
    ).filter(models.Course.id == course.id).first()
    
    return course

