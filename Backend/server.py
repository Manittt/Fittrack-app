from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
import random
import string
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import sendgrid
from sendgrid.helpers.mail import Mail

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 720  # 30 days

# SendGrid config
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'noreply@yourdomain.com')
VERIFY_CODE_EXPIRY_MINUTES = 15

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    invite_code: Optional[str] = None

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    gym_id: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: str

class AuthResponse(BaseModel):
    token: str
    user: User

class Exercise(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    muscle_group: str
    description: str
    image_url: str
    video_url: Optional[str] = None
    default_sets: int = 3
    default_reps: int = 10

class WorkoutExercise(BaseModel):
    exercise_id: str
    exercise_name: str
    muscle_group: str
    image_url: str
    sets: int
    reps: int
    completed_sets: int = 0
    notes: Optional[str] = None

class WorkoutRoutine(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    type: str
    description: str
    exercises: List[WorkoutExercise]
    cover_image: str
    estimated_duration: int

class UserWorkout(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    routine_id: str
    routine_name: str
    date: str
    exercises: List[WorkoutExercise]
    status: str
    started_at: str
    completed_at: Optional[str] = None
    total_sets: int = 0
    completed_sets: int = 0

class StartWorkoutRequest(BaseModel):
    routine_id: str

class UpdateWorkoutRequest(BaseModel):
    exercises: List[WorkoutExercise]

class CompleteWorkoutRequest(BaseModel):
    exercises: List[WorkoutExercise]

class UserProgress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    current_streak: int = 0
    longest_streak: int = 0
    total_workouts: int = 0
    last_workout_date: Optional[str] = None
    personal_records: Dict[str, int] = {}

class ProgressStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    current_streak: int
    longest_streak: int
    total_workouts: int
    workouts_this_week: int
    workouts_this_month: int

# ============ GYM MODELS ============

class GymCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    owner_name: str

class Gym(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    owner_id: str
    invite_code: str
    created_at: str
    member_count: int = 0

class GymMemberSummary(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    joined_at: str
    total_workouts: int = 0
    current_streak: int = 0
    last_workout_date: Optional[str] = None

class AdminStats(BaseModel):
    total_members: int
    active_this_week: int
    active_this_month: int
    total_workouts_all_members: int

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        'user_id': user_id,
        'exp': expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    return decode_token(token)

async def get_gym_owner(user_id: str = Depends(get_current_user)) -> str:
    """Dependency that ensures the current user is a gym owner."""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user or user.get("role") != "gym_owner":
        raise HTTPException(status_code=403, detail="Gym owner access required")
    return user_id

def generate_invite_code(length: int = 8) -> str:
    """Generate a random uppercase alphanumeric invite code."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def generate_verification_code() -> str:
    """Generate a 6-digit numeric verification code."""
    return ''.join(random.choices(string.digits, k=6))

async def send_verification_email(to_email: str, name: str, code: str):
    """Send verification email via SendGrid."""
    if not SENDGRID_API_KEY:
        # Dev mode: just log the code so you can test without SendGrid
        logger.info(f"[DEV] Verification code for {to_email}: {code}")
        return

    message = Mail(
        from_email=FROM_EMAIL,
        to_emails=to_email,
        subject='Verify your FitTrack account',
        html_content=f"""
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0A0A0A; color: #fff; padding: 40px; border-radius: 8px;">
            <h1 style="font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-bottom: 8px;">FITTRACK</h1>
            <p style="color: #A1A1AA; margin-bottom: 32px;">Verify your email address</p>
            <p style="margin-bottom: 16px;">Hey {name}, here's your verification code:</p>
            <div style="background: #1A1A1A; border: 1px solid #27272A; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 40px; font-weight: 900; letter-spacing: 8px; color: #007AFF;">{code}</span>
            </div>
            <p style="color: #71717A; font-size: 14px;">This code expires in {VERIFY_CODE_EXPIRY_MINUTES} minutes.</p>
            <p style="color: #71717A; font-size: 14px;">If you didn't create an account, ignore this email.</p>
        </div>
        """
    )
    try:
        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        sg.send(message)
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    gym_id = None
    if user_data.invite_code:
        gym = await db.gyms.find_one({"invite_code": user_data.invite_code.upper()}, {"_id": 0})
        if not gym:
            raise HTTPException(status_code=400, detail="Invalid invite code")
        gym_id = gym["id"]

    user_id = str(uuid.uuid4())
    code = generate_verification_code()
    code_expiry = (datetime.now(timezone.utc) + timedelta(minutes=VERIFY_CODE_EXPIRY_MINUTES)).isoformat()

    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "role": "user",
        "gym_id": gym_id,
        "is_verified": False,
        "verification_code": code,
        "verification_code_expiry": code_expiry,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.users.insert_one(user_doc)

    if gym_id:
        await db.gyms.update_one({"id": gym_id}, {"$inc": {"member_count": 1}})

    progress_doc = {
        "user_id": user_id,
        "current_streak": 0,
        "longest_streak": 0,
        "total_workouts": 0,
        "last_workout_date": None,
        "personal_records": {}
    }
    await db.user_progress.insert_one(progress_doc)

    await send_verification_email(user_data.email, user_data.name, code)

    return {"detail": "Account created. Please check your email for a verification code.", "email": user_data.email}


@api_router.post("/auth/verify-email", response_model=AuthResponse)
async def verify_email(data: VerifyEmailRequest):
    user_doc = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Account not found")

    if user_doc.get("is_verified"):
        raise HTTPException(status_code=400, detail="Email already verified")

    if user_doc.get("verification_code") != data.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    expiry = datetime.fromisoformat(user_doc["verification_code_expiry"])
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    await db.users.update_one(
        {"email": data.email},
        {"$set": {"is_verified": True}, "$unset": {"verification_code": "", "verification_code_expiry": ""}}
    )

    token = create_token(user_doc["id"])
    user = User(
        id=user_doc["id"],
        email=user_doc["email"],
        name=user_doc["name"],
        role=user_doc.get("role", "user"),
        gym_id=user_doc.get("gym_id"),
        created_at=user_doc["created_at"]
    )
    return AuthResponse(token=token, user=user)


@api_router.post("/auth/resend-verification")
async def resend_verification(data: ResendVerificationRequest):
    user_doc = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Account not found")
    if user_doc.get("is_verified"):
        raise HTTPException(status_code=400, detail="Email already verified")

    code = generate_verification_code()
    code_expiry = (datetime.now(timezone.utc) + timedelta(minutes=VERIFY_CODE_EXPIRY_MINUTES)).isoformat()

    await db.users.update_one(
        {"email": data.email},
        {"$set": {"verification_code": code, "verification_code_expiry": code_expiry}}
    )

    await send_verification_email(data.email, user_doc["name"], code)
    return {"detail": "Verification code resent"}

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})

    if not user_doc or not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # is_verified missing = old account made before verification was added
    # Mark them as needing verification and send a code
    if "is_verified" not in user_doc:
        code = generate_verification_code()
        code_expiry = (datetime.now(timezone.utc) + timedelta(minutes=VERIFY_CODE_EXPIRY_MINUTES)).isoformat()
        await db.users.update_one(
            {"email": credentials.email},
            {"$set": {
                "is_verified": False,
                "verification_code": code,
                "verification_code_expiry": code_expiry
            }}
        )
        await send_verification_email(credentials.email, user_doc["name"], code)
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")

    if not user_doc.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")

    token = create_token(user_doc["id"])

    user = User(
        id=user_doc["id"],
        email=user_doc["email"],
        name=user_doc["name"],
        role=user_doc.get("role", "user"),
        gym_id=user_doc.get("gym_id"),
        created_at=user_doc["created_at"]
    )

    return AuthResponse(token=token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(user_id: str = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_doc)

@api_router.patch("/auth/profile", response_model=AuthResponse)
async def update_profile(data: ProfileUpdate, user_id: str = Depends(get_current_user)):
    updates = {}
    if data.name and data.name.strip():
        updates["name"] = data.name.strip()
    if data.avatar_url is not None:
        updates["avatar_url"] = data.avatar_url
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")

    await db.users.update_one({"id": user_id}, {"$set": updates})
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})

    token = create_token(user_id)
    return AuthResponse(token=token, user=User(**user_doc))

# ============ GYM OWNER ROUTES ============

@api_router.post("/admin/gym/register", response_model=AuthResponse)
async def register_gym_owner(data: GymCreate):
    """Register a new gym and its owner account. Called by you when onboarding a new gym client."""
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Generate unique invite code
    while True:
        invite_code = generate_invite_code()
        clash = await db.gyms.find_one({"invite_code": invite_code})
        if not clash:
            break

    # Create gym owner user
    owner_id = str(uuid.uuid4())
    owner_doc = {
        "id": owner_id,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "name": data.owner_name,
        "role": "gym_owner",
        "gym_id": None,  # will update below
        "is_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(owner_doc)

    # Create gym
    gym_id = str(uuid.uuid4())
    gym_doc = {
        "id": gym_id,
        "name": data.name,
        "owner_id": owner_id,
        "invite_code": invite_code,
        "member_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.gyms.insert_one(gym_doc)

    # Link owner to gym
    await db.users.update_one({"id": owner_id}, {"$set": {"gym_id": gym_id}})
    owner_doc["gym_id"] = gym_id

    token = create_token(owner_id)
    user = User(
        id=owner_id,
        email=data.email,
        name=data.owner_name,
        role="gym_owner",
        gym_id=gym_id,
        created_at=owner_doc["created_at"]
    )

    return AuthResponse(token=token, user=user)

@api_router.get("/admin/gym", response_model=Gym)
async def get_my_gym(user_id: str = Depends(get_gym_owner)):
    """Get the gym owned by the current gym owner."""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    gym = await db.gyms.find_one({"id": user["gym_id"]}, {"_id": 0})
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")
    return Gym(**gym)

@api_router.get("/admin/members", response_model=List[GymMemberSummary])
async def get_gym_members(user_id: str = Depends(get_gym_owner)):
    """Get all members of the gym with their progress summaries."""
    owner = await db.users.find_one({"id": user_id}, {"_id": 0})
    gym_id = owner["gym_id"]

    members = await db.users.find(
        {"gym_id": gym_id, "role": "user"},
        {"_id": 0, "id": 1, "name": 1, "email": 1, "created_at": 1}
    ).to_list(1000)

    result = []
    for member in members:
        progress = await db.user_progress.find_one({"user_id": member["id"]}, {"_id": 0})
        result.append(GymMemberSummary(
            id=member["id"],
            name=member["name"],
            email=member["email"],
            joined_at=member["created_at"],
            total_workouts=progress.get("total_workouts", 0) if progress else 0,
            current_streak=progress.get("current_streak", 0) if progress else 0,
            last_workout_date=progress.get("last_workout_date") if progress else None,
        ))

    return result

@api_router.get("/admin/stats", response_model=AdminStats)
async def get_admin_stats(user_id: str = Depends(get_gym_owner)):
    """Get high-level stats for the gym owner dashboard."""
    owner = await db.users.find_one({"id": user_id}, {"_id": 0})
    gym_id = owner["gym_id"]

    from datetime import date, timedelta
    today = date.today()
    week_ago = (today - timedelta(days=7)).isoformat()
    month_ago = (today - timedelta(days=30)).isoformat()

    members = await db.users.find(
        {"gym_id": gym_id, "role": "user"},
        {"_id": 0, "id": 1}
    ).to_list(1000)
    member_ids = [m["id"] for m in members]

    total_members = len(member_ids)

    if not member_ids:
        return AdminStats(
            total_members=0,
            active_this_week=0,
            active_this_month=0,
            total_workouts_all_members=0
        )

    # Members who worked out this week
    active_week_ids = await db.user_workouts.distinct(
        "user_id",
        {"user_id": {"$in": member_ids}, "status": "completed", "date": {"$gte": week_ago}}
    )

    # Members who worked out this month
    active_month_ids = await db.user_workouts.distinct(
        "user_id",
        {"user_id": {"$in": member_ids}, "status": "completed", "date": {"$gte": month_ago}}
    )

    # Total workouts across all members
    total_workouts = await db.user_workouts.count_documents(
        {"user_id": {"$in": member_ids}, "status": "completed"}
    )

    return AdminStats(
        total_members=total_members,
        active_this_week=len(active_week_ids),
        active_this_month=len(active_month_ids),
        total_workouts_all_members=total_workouts
    )

@api_router.delete("/admin/members/{member_id}")
async def remove_member(member_id: str, user_id: str = Depends(get_gym_owner)):
    """Remove a member from the gym (unlinks them, doesn't delete their account)."""
    owner = await db.users.find_one({"id": user_id}, {"_id": 0})
    gym_id = owner["gym_id"]

    member = await db.users.find_one({"id": member_id, "gym_id": gym_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in your gym")

    await db.users.update_one({"id": member_id}, {"$set": {"gym_id": None}})
    await db.gyms.update_one({"id": gym_id}, {"$inc": {"member_count": -1}})

    return {"detail": "Member removed successfully"}

@api_router.post("/admin/gym/regenerate-code", response_model=Gym)
async def regenerate_invite_code(user_id: str = Depends(get_gym_owner)):
    """Generate a new invite code for the gym (invalidates the old one)."""
    owner = await db.users.find_one({"id": user_id}, {"_id": 0})
    gym_id = owner["gym_id"]

    while True:
        new_code = generate_invite_code()
        clash = await db.gyms.find_one({"invite_code": new_code})
        if not clash:
            break

    await db.gyms.update_one({"id": gym_id}, {"$set": {"invite_code": new_code}})
    gym = await db.gyms.find_one({"id": gym_id}, {"_id": 0})
    return Gym(**gym)

# ============ EXERCISE ROUTES ============

@api_router.get("/exercises", response_model=List[Exercise])
async def get_exercises(muscle_group: Optional[str] = None, user_id: str = Depends(get_current_user)):
    query = {}
    if muscle_group:
        query["muscle_group"] = muscle_group
    exercises = await db.exercises.find(query, {"_id": 0}).to_list(1000)
    return exercises

@api_router.get("/exercises/{exercise_id}", response_model=Exercise)
async def get_exercise(exercise_id: str, user_id: str = Depends(get_current_user)):
    exercise = await db.exercises.find_one({"id": exercise_id}, {"_id": 0})
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return Exercise(**exercise)

# ============ WORKOUT ROUTINE ROUTES ============

@api_router.get("/routines", response_model=List[WorkoutRoutine])
async def get_routines(user_id: str = Depends(get_current_user)):
    routines = await db.workout_routines.find({}, {"_id": 0}).to_list(1000)
    return routines

@api_router.get("/routines/daily/today", response_model=WorkoutRoutine)
async def get_daily_routine(user_id: str = Depends(get_current_user)):
    day_of_year = datetime.now(timezone.utc).timetuple().tm_yday
    routines = await db.workout_routines.find({}, {"_id": 0}).to_list(1000)
    if not routines:
        raise HTTPException(status_code=404, detail="No routines available")
    index = day_of_year % len(routines)
    return WorkoutRoutine(**routines[index])

@api_router.get("/routines/{routine_id}", response_model=WorkoutRoutine)
async def get_routine(routine_id: str, user_id: str = Depends(get_current_user)):
    routine = await db.workout_routines.find_one({"id": routine_id}, {"_id": 0})
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    return WorkoutRoutine(**routine)

# ============ USER WORKOUT ROUTES ============

@api_router.post("/workouts/start", response_model=UserWorkout)
async def start_workout(request: StartWorkoutRequest, user_id: str = Depends(get_current_user)):
    routine = await db.workout_routines.find_one({"id": request.routine_id}, {"_id": 0})
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    workout_id = str(uuid.uuid4())
    total_sets = sum(ex['sets'] for ex in routine['exercises'])

    workout_doc = {
        "id": workout_id,
        "user_id": user_id,
        "routine_id": request.routine_id,
        "routine_name": routine['name'],
        "date": datetime.now(timezone.utc).date().isoformat(),
        "exercises": routine['exercises'],
        "status": "in_progress",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "total_sets": total_sets,
        "completed_sets": 0
    }

    await db.user_workouts.insert_one(workout_doc)
    return UserWorkout(**workout_doc)

@api_router.get("/workouts/active", response_model=Optional[UserWorkout])
async def get_active_workout(user_id: str = Depends(get_current_user)):
    workout = await db.user_workouts.find_one(
        {"user_id": user_id, "status": "in_progress"},
        {"_id": 0}
    )
    if workout:
        return UserWorkout(**workout)
    return None

@api_router.put("/workouts/{workout_id}", response_model=UserWorkout)
async def update_workout(workout_id: str, request: UpdateWorkoutRequest, user_id: str = Depends(get_current_user)):
    completed_sets = sum(ex.completed_sets for ex in request.exercises)
    await db.user_workouts.update_one(
        {"id": workout_id, "user_id": user_id},
        {"$set": {
            "exercises": [ex.model_dump() for ex in request.exercises],
            "completed_sets": completed_sets
        }}
    )
    workout = await db.user_workouts.find_one({"id": workout_id}, {"_id": 0})
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    return UserWorkout(**workout)

@api_router.put("/workouts/{workout_id}/complete", response_model=UserWorkout)
async def complete_workout(workout_id: str, request: CompleteWorkoutRequest, user_id: str = Depends(get_current_user)):
    completed_at = datetime.now(timezone.utc).isoformat()
    completed_sets = sum(ex.completed_sets for ex in request.exercises)

    await db.user_workouts.update_one(
        {"id": workout_id, "user_id": user_id},
        {"$set": {
            "exercises": [ex.model_dump() for ex in request.exercises],
            "status": "completed",
            "completed_at": completed_at,
            "completed_sets": completed_sets
        }}
    )

    await update_user_progress(user_id)
    workout = await db.user_workouts.find_one({"id": workout_id}, {"_id": 0})
    return UserWorkout(**workout)

@api_router.get("/workouts/history", response_model=List[UserWorkout])
async def get_workout_history(user_id: str = Depends(get_current_user), limit: int = 50):
    workouts = await db.user_workouts.find(
        {"user_id": user_id, "status": "completed"},
        {"_id": 0}
    ).sort("completed_at", -1).limit(limit).to_list(limit)
    return workouts

# ============ PROGRESS ROUTES ============

async def update_user_progress(user_id: str):
    progress = await db.user_progress.find_one({"user_id": user_id}, {"_id": 0})
    if not progress:
        progress = {
            "user_id": user_id,
            "current_streak": 0,
            "longest_streak": 0,
            "total_workouts": 0,
            "last_workout_date": None,
            "personal_records": {}
        }

    today = datetime.now(timezone.utc).date().isoformat()
    last_date = progress.get("last_workout_date")

    if last_date == today:
        return

    current_streak = progress.get("current_streak", 0)

    if last_date:
        from datetime import date
        last = date.fromisoformat(last_date)
        now = date.fromisoformat(today)
        days_diff = (now - last).days
        current_streak = current_streak + 1 if days_diff == 1 else 1
    else:
        current_streak = 1

    longest_streak = max(progress.get("longest_streak", 0), current_streak)
    total_workouts = progress.get("total_workouts", 0) + 1

    await db.user_progress.update_one(
        {"user_id": user_id},
        {"$set": {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "total_workouts": total_workouts,
            "last_workout_date": today
        }},
        upsert=True
    )

@api_router.get("/progress/stats", response_model=ProgressStats)
async def get_progress_stats(user_id: str = Depends(get_current_user)):
    progress = await db.user_progress.find_one({"user_id": user_id}, {"_id": 0})

    if not progress:
        return ProgressStats(
            current_streak=0, longest_streak=0, total_workouts=0,
            workouts_this_week=0, workouts_this_month=0
        )

    from datetime import date, timedelta
    today = date.today()
    week_ago = (today - timedelta(days=7)).isoformat()
    month_ago = (today - timedelta(days=30)).isoformat()

    workouts_this_week = await db.user_workouts.count_documents({
        "user_id": user_id, "status": "completed", "date": {"$gte": week_ago}
    })
    workouts_this_month = await db.user_workouts.count_documents({
        "user_id": user_id, "status": "completed", "date": {"$gte": month_ago}
    })

    return ProgressStats(
        current_streak=progress.get("current_streak", 0),
        longest_streak=progress.get("longest_streak", 0),
        total_workouts=progress.get("total_workouts", 0),
        workouts_this_week=workouts_this_week,
        workouts_this_month=workouts_this_month
    )

@api_router.get("/progress/chart-data")
async def get_chart_data(user_id: str = Depends(get_current_user)):
    from datetime import date, timedelta
    today = date.today()
    thirty_days_ago = (today - timedelta(days=30)).isoformat()

    workouts = await db.user_workouts.find(
        {"user_id": user_id, "status": "completed", "date": {"$gte": thirty_days_ago}},
        {"_id": 0, "date": 1, "completed_sets": 1}
    ).to_list(1000)

    data_by_date = {}
    for workout in workouts:
        workout_date = workout["date"]
        if workout_date not in data_by_date:
            data_by_date[workout_date] = {"date": workout_date, "sets": 0, "workouts": 0}
        data_by_date[workout_date]["sets"] += workout.get("completed_sets", 0)
        data_by_date[workout_date]["workouts"] += 1

    chart_data = []
    for i in range(30):
        current_date = (today - timedelta(days=29 - i)).isoformat()
        chart_data.append(data_by_date.get(current_date, {"date": current_date, "sets": 0, "workouts": 0}))

    return chart_data

# Include router
app.include_router(api_router)

# Serve local images and videos
app.mount("/static", StaticFiles(directory=ROOT_DIR / "static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()