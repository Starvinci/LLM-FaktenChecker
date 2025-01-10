import pytest
from app import create_app
from app.models import db

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client

def test_index(client):
    response = client.get('/api/')
    assert response.status_code == 200
    assert response.json['message'] == "Hello from the LLM-FaktenChecker Backend!"

def test_bereich(client):
    response = client.post('/api/bereich', json={"message": "Test"})
    assert response.status_code == 200
    assert response.json['status'] == "success"
    assert response.json['received_message'] == "Test"

def test_bereich_invalid_input(client):
    response = client.post('/api/bereich', json={})
    assert response.status_code == 400
    assert response.json['error'] == "Invalid input, 'message' key is required"
