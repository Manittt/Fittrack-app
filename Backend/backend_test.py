import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
import uuid
from datetime import datetime, timezone
 
# ---------------------------------------------------------------------------
# Setup: point at a test database so we never touch production data
# ---------------------------------------------------------------------------
 
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "fittrack_test")
os.environ.setdefault("JWT_SECRET", "test-secret-key")
os.environ.setdefault("CORS_ORIGINS", "*")
 
# Import the app AFTER setting env vars
from server import app, db, hash_password, verify_password, create_token, decode_token
 
# ---------------------------------------------------------------------------
# Pytest configuration
# ---------------------------------------------------------------------------
 
@pytest.fixture(scope="session")
def event_loop():
    """Use a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()
 
 
@pytest.fixture(scope="session")
async def async_client():
    """Shared HTTP client for the whole test session."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
 
 
@pytest.fixture(autouse=True)
async def clean_test_db():
    """Wipe user-related collections before every test for isolation."""
    await db.users.delete_many({})
    await db.user_workouts.delete_many({})
    await db.user_progress.delete_many({})
    yield
    # (cleanup again after test too, optional)
 
 
@pytest.fixture(scope="session")
async def seed_exercises_and_routines():
    """Insert seed exercises/routines once per session."""
    await db.exercises.delete_many({})
    await db.workout_routines.delete_many({})
 
    exercises = [
        {
            "id": "ex_bench_press",
            "name": "Barbell Bench Press",
            "muscle_group": "Chest",
            "description": "Lie on bench, lower bar to chest, press up",
            "image_url": "https://example.com/bench.jpg",
            "default_sets": 4,
            "default_reps": 10,
        },
        {
            "id": "ex_squat",
            "name": "Barbell Squat",
            "muscle_group": "Legs",
            "description": "Squat down with bar on shoulders",
            "image_url": "https://example.com/squat.jpg",
            "default_sets": 4,
            "default_reps": 10,
        },
    ]
 
    routine_exercises = [
        {
            "exercise_id": "ex_bench_press",
            "exercise_name": "Barbell Bench Press",
            "muscle_group": "Chest",
            "image_url": "https://example.com/bench.jpg",
            "sets": 4,
            "reps": 10,
            "completed_sets": 0,
        },
        {
            "exercise_id": "ex_squat",
            "exercise_name": "Barbell Squat",
            "muscle_group": "Legs",
            "image_url": "https://example.com/squat.jpg",
            "sets": 4,
            "reps": 10,
            "completed_sets": 0,
        },
    ]
 
    routines = [
        {
            "id": "routine_full_body",
            "name": "Full Body Blast",
            "type": "full_body",
            "description": "Complete full body workout",
            "cover_image": "https://example.com/cover.jpg",
            "estimated_duration": 60,
            "exercises": routine_exercises,
        }
    ]
 
    await db.exercises.insert_many(exercises)
    await db.workout_routines.insert_many(routines)
    yield
    await db.exercises.delete_many({})
    await db.workout_routines.delete_many({})
 
 
# ---------------------------------------------------------------------------
# Helper: register a user and return (token, user_id)
# ---------------------------------------------------------------------------
 
async def register_user(client: AsyncClient, email="test@example.com", password="password123", name="Test User"):
    resp = await client.post("/api/auth/register", json={"email": email, "password": password, "name": name})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    return data["token"], data["user"]["id"]
 
 
# ===========================================================================
# AUTH HELPERS (unit tests — no HTTP)
# ===========================================================================
 
class TestAuthHelpers:
 
    def test_hash_password_returns_string(self):
        hashed = hash_password("mysecretpassword")
        assert isinstance(hashed, str)
        assert hashed != "mysecretpassword"
 
    def test_verify_password_correct(self):
        hashed = hash_password("mysecretpassword")
        assert verify_password("mysecretpassword", hashed) is True
 
    def test_verify_password_wrong(self):
        hashed = hash_password("mysecretpassword")
        assert verify_password("wrongpassword", hashed) is False
 
    def test_create_token_returns_string(self):
        token = create_token("some-user-id")
        assert isinstance(token, str)
        assert len(token) > 10
 
    def test_decode_token_roundtrip(self):
        user_id = str(uuid.uuid4())
        token = create_token(user_id)
        decoded = decode_token(token)
        assert decoded == user_id
 
    def test_decode_token_invalid_raises(self):
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            decode_token("not.a.valid.token")
        assert exc_info.value.status_code == 401
 
 
# ===========================================================================
# AUTH ROUTES
# ===========================================================================
 
class TestAuthRoutes:
 
    @pytest.mark.asyncio
    async def test_register_success(self, async_client):
        resp = await async_client.post("/api/auth/register", json={
            "email": "newuser@example.com",
            "password": "securepass",
            "name": "New User"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["email"] == "newuser@example.com"
        assert data["user"]["name"] == "New User"
        assert "password" not in data["user"]  # password must never be returned
 
    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, async_client):
        payload = {"email": "dup@example.com", "password": "pass123", "name": "User"}
        await async_client.post("/api/auth/register", json=payload)
        resp = await async_client.post("/api/auth/register", json=payload)
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"]
 
    @pytest.mark.asyncio
    async def test_register_invalid_email(self, async_client):
        resp = await async_client.post("/api/auth/register", json={
            "email": "not-an-email",
            "password": "pass123",
            "name": "User"
        })
        assert resp.status_code == 422  # Pydantic validation error
 
    @pytest.mark.asyncio
    async def test_login_success(self, async_client):
        await async_client.post("/api/auth/register", json={
            "email": "login@example.com", "password": "pass123", "name": "Login User"
        })
        resp = await async_client.post("/api/auth/login", json={
            "email": "login@example.com", "password": "pass123"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["email"] == "login@example.com"
 
    @pytest.mark.asyncio
    async def test_login_wrong_password(self, async_client):
        await async_client.post("/api/auth/register", json={
            "email": "wrongpass@example.com", "password": "correct", "name": "User"
        })
        resp = await async_client.post("/api/auth/login", json={
            "email": "wrongpass@example.com", "password": "wrong"
        })
        assert resp.status_code == 401
 
    @pytest.mark.asyncio
    async def test_login_unknown_email(self, async_client):
        resp = await async_client.post("/api/auth/login", json={
            "email": "nobody@example.com", "password": "pass"
        })
        assert resp.status_code == 401
 
    @pytest.mark.asyncio
    async def test_get_me_authenticated(self, async_client):
        token, _ = await register_user(async_client, email="me@example.com")
        resp = await async_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["email"] == "me@example.com"
 
    @pytest.mark.asyncio
    async def test_get_me_no_token(self, async_client):
        resp = await async_client.get("/api/auth/me")
        assert resp.status_code == 403
 
    @pytest.mark.asyncio
    async def test_get_me_bad_token(self, async_client):
        resp = await async_client.get("/api/auth/me", headers={"Authorization": "Bearer badtoken"})
        assert resp.status_code == 401
 
 
# ===========================================================================
# EXERCISE ROUTES
# ===========================================================================
 
class TestExerciseRoutes:
 
    @pytest.mark.asyncio
    async def test_get_exercises(self, async_client, seed_exercises_and_routines):
        token, _ = await register_user(async_client, email="ex1@example.com")
        resp = await async_client.get("/api/exercises", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
 
    @pytest.mark.asyncio
    async def test_get_exercises_filter_by_muscle_group(self, async_client, seed_exercises_and_routines):
        token, _ = await register_user(async_client, email="ex2@example.com")
        resp = await async_client.get(
            "/api/exercises?muscle_group=Chest",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert all(ex["muscle_group"] == "Chest" for ex in data)
 
    @pytest.mark.asyncio
    async def test_get_exercise_by_id(self, async_client, seed_exercises_and_routines):
        token, _ = await register_user(async_client, email="ex3@example.com")
        resp = await async_client.get(
            "/api/exercises/ex_bench_press",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == "ex_bench_press"
 
    @pytest.mark.asyncio
    async def test_get_exercise_not_found(self, async_client, seed_exercises_and_routines):
        token, _ = await register_user(async_client, email="ex4@example.com")
        resp = await async_client.get(
            "/api/exercises/nonexistent_id",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 404
 
    @pytest.mark.asyncio
    async def test_get_exercises_requires_auth(self, async_client):
        resp = await async_client.get("/api/exercises")
        assert resp.status_code == 403
 
 
# ===========================================================================
# ROUTINE ROUTES
# ===========================================================================
 
class TestRoutineRoutes:
 
    @pytest.mark.asyncio
    async def test_get_routines(self, async_client, seed_exercises_and_routines):
        token, _ = await register_user(async_client, email="rt1@example.com")
        resp = await async_client.get("/api/routines", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) >= 1
 
    @pytest.mark.asyncio
    async def test_get_routine_by_id(self, async_client, seed_exercises_and_routines):
        token, _ = await register_user(async_client, email="rt2@example.com")
        resp = await async_client.get(
            "/api/routines/routine_full_body",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == "routine_full_body"
 
    @pytest.mark.asyncio
    async def test_get_routine_not_found(self, async_client, seed_exercises_and_routines):
        token, _ = await register_user(async_client, email="rt3@example.com")
        resp = await async_client.get(
            "/api/routines/does_not_exist",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 404
 
    @pytest.mark.asyncio
    async def test_get_daily_routine(self, async_client, seed_exercises_and_routines):
        token, _ = await register_user(async_client, email="rt4@example.com")
        resp = await async_client.get(
            "/api/routines/daily/today",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data
        assert "exercises" in data
 
 
# ===========================================================================
# WORKOUT ROUTES
# ===========================================================================
 
class TestWorkoutRoutes:
 
    @pytest.mark.asyncio
    async def test_start_workout(self, async_client, seed_exercises_and_routines):
        token, _ = await register_user(async_client, email="wk1@example.com")
        resp = await async_client.post(
            "/api/workouts/start",
            json={"routine_id": "routine_full_body"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "in_progress"
        assert data["routine_id"] == "routine_full_body"
        assert "id" in data
 
    @pytest.mark.asyncio
    async def test_start_workout_invalid_routine(self, async_client, seed_exercises_and_routines):
        token, _ = await register_user(async_client, email="wk2@example.com")
        resp = await async_client.post(
            "/api/workouts/start",
            json={"routine_id": "nonexistent_routine"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 404
 
    @pytest.mark.asyncio
    async def test_get_active_workout(self, async_client, seed_exercises_and_routines):
        token, _ = await register_user(async_client, email="wk3@example.com")
 
        # No active workout yet
        resp = await async_client.get("/api/workouts/active", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json() is None
 
        # Start one
        await async_client.post(
            "/api/workouts/start",
            json={"routine_id": "routine_full_body"},
            headers={"Authorization": f"Bearer {token}"}
        )
 
        # Now it should exist
        resp = await async_client.get("/api/workouts/active", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "in_progress"
 
    @pytest.mark.asyncio
    async def test_update_workout(self, async_client, seed_exercises_and_routines):
        token, _ = await register_user(async_client, email="wk4@example.com")
 
        start_resp = await async_client.post(
            "/api/workouts/start",
            json={"routine_id": "routine_full_body"},
            headers={"Authorization": f"Bearer {token}"}
        )
        workout_id = start_resp.json()["id"]
        exercises = start_resp.json()["exercises"]
 
        # Mark 2 sets completed on the first exercise
        exercises[0]["completed_sets"] = 2
 
        resp = await async_client.put(
            f"/api/workouts/{workout_id}",
            json={"exercises": exercises},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200
        assert resp.json()["completed_sets"] == 2
 
    @pytest.mark.asyncio
    async def test_complete_workout(self, async_client, seed_exercises_and_routines):
        token, _ = await register_user(async_client, email="wk5@example.com")
 
        start_resp = await async_client.post(
            "/api/workouts/start",
            json={"routine_id": "routine_full_body"},
            headers={"Authorization": f"Bearer {token}"}
        )
        workout_id = start_resp.json()["id"]
        exercises = start_resp.json()["exercises"]
 
        # Complete all sets
        for ex in exercises:
            ex["completed_sets"] = ex["sets"]
 
        resp = await async_client.put(
            f"/api/workouts/{workout_id}/complete",
            json={"exercises": exercises},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"
        assert resp.json()["completed_at"] is not None
 
    @pytest.mark.asyncio
    async def test_get_workout_history(self, async_client, seed_exercises_and_routines):
        token, _ = await register_user(async_client, email="wk6@example.com")
 
        # Complete a workout
        start_resp = await async_client.post(
            "/api/workouts/start",
            json={"routine_id": "routine_full_body"},
            headers={"Authorization": f"Bearer {token}"}
        )
        workout_id = start_resp.json()["id"]
        exercises = start_resp.json()["exercises"]
        await async_client.put(
            f"/api/workouts/{workout_id}/complete",
            json={"exercises": exercises},
            headers={"Authorization": f"Bearer {token}"}
        )
 
        resp = await async_client.get("/api/workouts/history", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        history = resp.json()
        assert len(history) == 1
        assert history[0]["status"] == "completed"
 
    @pytest.mark.asyncio
    async def test_workout_history_empty(self, async_client):
        token, _ = await register_user(async_client, email="wk7@example.com")
        resp = await async_client.get("/api/workouts/history", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json() == []
 
 
# ===========================================================================
# PROGRESS ROUTES
# ===========================================================================
 
class TestProgressRoutes:
 
    @pytest.mark.asyncio
    async def test_progress_stats_new_user(self, async_client):
        token, _ = await register_user(async_client, email="prog1@example.com")
        resp = await async_client.get("/api/progress/stats", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_workouts"] == 0
        assert data["current_streak"] == 0
 
    @pytest.mark.asyncio
    async def test_progress_stats_after_workout(self, async_client, seed_exercises_and_routines):
        token, _ = await register_user(async_client, email="prog2@example.com")
 
        # Complete a workout
        start_resp = await async_client.post(
            "/api/workouts/start",
            json={"routine_id": "routine_full_body"},
            headers={"Authorization": f"Bearer {token}"}
        )
        workout_id = start_resp.json()["id"]
        exercises = start_resp.json()["exercises"]
        await async_client.put(
            f"/api/workouts/{workout_id}/complete",
            json={"exercises": exercises},
            headers={"Authorization": f"Bearer {token}"}
        )
 
        resp = await async_client.get("/api/progress/stats", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_workouts"] == 1
        assert data["current_streak"] == 1
        assert data["workouts_this_week"] == 1
        assert data["workouts_this_month"] == 1
 
    @pytest.mark.asyncio
    async def test_chart_data_returns_30_days(self, async_client):
        token, _ = await register_user(async_client, email="prog3@example.com")
        resp = await async_client.get("/api/progress/chart-data", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 30
 
    @pytest.mark.asyncio
    async def test_chart_data_structure(self, async_client):
        token, _ = await register_user(async_client, email="prog4@example.com")
        resp = await async_client.get("/api/progress/chart-data", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        for entry in resp.json():
            assert "date" in entry
            assert "sets" in entry
            assert "workouts" in entry
 
    @pytest.mark.asyncio
    async def test_progress_requires_auth(self, async_client):
        resp = await async_client.get("/api/progress/stats")
        assert resp.status_code == 403