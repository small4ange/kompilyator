import pytest
from fastapi import status


def test_register_success(client):
    """Test successful user registration"""
    response = client.post(
        "/auth/register",
        json={
            "email": "newuser@test.com",
            "name": "New User",
            "password": "password123"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "newuser@test.com"
    assert data["user"]["name"] == "New User"
    assert data["user"]["role"] == "user"


def test_register_duplicate_email(client, regular_user):
    """Test registration with duplicate email"""
    response = client.post(
        "/auth/register",
        json={
            "email": regular_user.email,
            "name": "Another User",
            "password": "password123"
        }
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already registered" in response.json()["detail"].lower()


def test_login_success(client, regular_user):
    """Test successful login"""
    response = client.post(
        "/auth/login",
        data={
            "username": regular_user.email,
            "password": "testpass123"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == regular_user.email


def test_login_wrong_password(client, regular_user):
    """Test login with wrong password"""
    response = client.post(
        "/auth/login",
        data={
            "username": regular_user.email,
            "password": "wrongpassword"
        }
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "incorrect" in response.json()["detail"].lower()


def test_login_nonexistent_user(client):
    """Test login with non-existent user"""
    response = client.post(
        "/auth/login",
        data={
            "username": "nonexistent@test.com",
            "password": "password123"
        }
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "incorrect" in response.json()["detail"].lower()


def test_get_current_user(client, user_token, regular_user):
    """Test getting current user info"""
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == regular_user.email
    assert data["name"] == regular_user.name


def test_get_current_user_unauthorized(client):
    """Test getting current user without token"""
    response = client.get("/auth/me")
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

