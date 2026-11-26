import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_client, init_db
from app.core.security import get_password_hash

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()
    db = get_client().get_database()
    users_col = db.get_collection("users")
    test_user = users_col.find_one({"email": "test@example.com"})
    if not test_user:
        users_col.insert_one({
            "email": "test@example.com",
            "hashed_password": get_password_hash("password123"),
            "full_name": "Test User",
            "role": "admin",
            "is_active": True
        })

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_auth_login():
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_protected_routes():
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Districts
    dist_res = client.get("/api/v1/districts", headers=headers)
    assert dist_res.status_code == 200
    assert len(dist_res.json()) > 0
    assert dist_res.json()[0]["name"] == "Ariyalur"

    # 2. Jobs
    jobs_res = client.get("/api/v1/jobs", headers=headers)
    assert jobs_res.status_code == 200

    # 3. Predictions
    dist_id = dist_res.json()[0]["id"]
    pred_res = client.get(f"/api/v1/predictions/{dist_id}", headers=headers)
    assert pred_res.status_code == 200
    assert len(pred_res.json()) > 0

def test_folium_map():
    # Current mode
    res_cur = client.get("/api/v1/districts/map/folium?mode=current")
    assert res_cur.status_code == 200
    assert "Current Hotspots" in res_cur.text

    # Forecast mode
    res_fc = client.get("/api/v1/districts/map/folium?mode=forecast")
    assert res_fc.status_code == 200
    assert "7-Day ML Forecast Heat Risk" in res_fc.text

def test_forecast_summary():
    res = client.get("/api/v1/forecast/summary?days=7")
    assert res.status_code == 200
    data = res.json()
    assert data["total_districts"] == 38
    assert "districts" in data
    assert len(data["districts"]) == 38

def test_district_forecast():
    res = client.get("/api/v1/forecast/Chennai?days=7")
    assert res.status_code == 200
    data = res.json()
    assert data["district_name"] == "Chennai"
    assert "model_used" in data
    assert "evaluation_metrics" in data
    assert "forecast_series" in data
    assert len(data["forecast_series"]) == 7
    assert data["forecast_risk_level"] in ["Low", "Moderate", "High", "Extreme"]
