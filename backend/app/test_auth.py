import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_login_valid_credentials():
    response = client.post("/auth/login", json={"email": "test@example.com", "password": "testpass"})
    assert response.status_code == 200
    assert "token" in response.json() or response.json().get("message") == "User logged in successfully"

def test_register_new_user():
    response = client.post("/auth/register", json={"email": "newuser@example.com", "password": "newpass", "name": "Test User"})
    assert response.status_code in (200, 201)
    assert response.json().get("message") == "Account created" or "user" in response.json()
