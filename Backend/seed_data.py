import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Base URL — change this to your deployed domain when you deploy
BASE_URL = "http://127.0.0.1:8000"

# ─── Images: your uploaded photos served from /static/images/ ───────────────
IMG = {
    "squats":        f"{BASE_URL}/static/images/squats.jpg",
    "deadlift":      f"{BASE_URL}/static/images/deadlift.jpg",
    "bicep_curl":    f"{BASE_URL}/static/images/bicep_curl.jpg",
    "lat_pulldown":  f"{BASE_URL}/static/images/lat_pulldown.jpg",
    "arms_flex":     f"{BASE_URL}/static/images/arms_flex.jpg",
    "physique":      f"{BASE_URL}/static/images/physique.jpg",
    "leg_machine":   f"{BASE_URL}/static/images/leg_machine.jpg",
    "dumbbell_press":f"{BASE_URL}/static/images/dumbbell_press.jpg",
    "chest_cable":   f"{BASE_URL}/static/images/chest_cable.jpg",
    "dumbbell_curl": f"{BASE_URL}/static/images/dumbbell_curl.jpg",
    "bench_press": f"{BASE_URL}/static/images/benchpress.jpg",
}

# ─── Videos: your uploaded mp4s served from /static/videos/ ─────────────────
# Videos not yet uploaded use  f"{BASE_URL}/static/videos/ — frontend handles gracefully
VID = {
    "deadlift":         f"{BASE_URL}/static/videos/deadlift.mp4",
    "pullups":          f"{BASE_URL}/static/videos/pullups.mp4",
    "single_arm_rows":  f"{BASE_URL}/static/videos/single_arm_rows.mp4",
    "squats":           f"{BASE_URL}/static/videos/squats.mp4",
    "barbell_curls":    f"{BASE_URL}/static/videos/barbell_curls.mp4",
    "lateral_raises":   f"{BASE_URL}/static/videos/lateral_raises.mp4",
    "seated_rows":      f"{BASE_URL}/static/videos/seated_rows.mp4",
    "lunges":           f"{BASE_URL}/static/videos/Lunges.mp4",
    "leg_curl":         f"{BASE_URL}/static/videos/Legcurls.mp4",
    "calf_raise":       f"{BASE_URL}/static/videos/Calfraises.mp4",
    "hammer_curl":      f"{BASE_URL}/static/videos/Hammercurls.mp4",
    "tricep_dip":       f"{BASE_URL}/static/videos/Tricepdips.mp4",
    "tricep_extension": f"{BASE_URL}/static/videos/Tricepextensions.mp4",
    "plank":            f"{BASE_URL}/static/videos/Plank.mp4",
    "bench_press":      f"{BASE_URL}/static/videos/Benchpress.mp4",
    "dumbbell_press":   f"{BASE_URL}/static/videos/Dumbellpress.mp4",
    "pushups":           f"{BASE_URL}/static/videos/Pushups.mp4",
    "lat_pulldown":      f"{BASE_URL}/static/videos/Lat_pulldown.mp4",
    "shoulder_press":    f"{BASE_URL}/static/videos/Shoulderpress.mp4",
    "chest_fly":         f"{BASE_URL}/static/videos/Pecdec.mp4",
    "crunches":          f"{BASE_URL}/static/videos/Crunches.mp4",
    "russian_twist":     f"{BASE_URL}/static/videos/Russiantwists.mp4",
    "front_raise":       f"{BASE_URL}/static/videos/Frontraise.mp4",
    "leg_press":         f"{BASE_URL}/static/videos/Legpress.mp4",
    # Coming later:
    "close_grip_press":  f"{BASE_URL}/static/videos/",
}

EXERCISES = [
    # ── Chest ──────────────────────────────────────────────────────────────
    {
        "id": "ex_bench_press", "name": "Barbell Bench Press", "muscle_group": "Chest",
        "description": "Lie flat on a bench, grip the bar slightly wider than shoulder width. Lower it to your mid-chest with control, keeping elbows at about 45 degrees. Press explosively back up without bouncing off your chest. Keep your feet flat, back slightly arched, and shoulders pinched together throughout.",
        "image_url": IMG["dumbbell_press"],
        "video_url": VID["bench_press"],
        "default_sets": 4, "default_reps": 10
    },
    {
        "id": "ex_dumbbell_press", "name": "Dumbbell Press", "muscle_group": "Chest",
        "description": "Lie on a bench with a dumbbell in each hand at chest level, palms facing forward. Press both dumbbells up simultaneously until arms are fully extended, then lower slowly. The dumbbells should travel in a slight arc. This hits each side independently for balanced chest development.",
        "image_url": IMG["dumbbell_press"],
        "video_url": VID["dumbbell_press"],
        "default_sets": 3, "default_reps": 12
    },
    {
        "id": "ex_chest_fly", "name": "Dumbbell Chest Fly", "muscle_group": "Chest",
        "description": "Lie on a bench with dumbbells above your chest, slight bend in elbows. Open arms wide in a wide arc until you feel a deep chest stretch, then squeeze back to the top. Keep the elbow bend constant — this is a stretch and squeeze movement, not a press. Great for chest width.",
        "image_url": IMG["chest_cable"],
        "video_url": VID["chest_fly"],
        "default_sets": 3, "default_reps": 12
    },
    {
        "id": "ex_pushups", "name": "Push-ups", "muscle_group": "Chest",
        "description": "Start in a high plank position, hands slightly wider than shoulders. Lower your chest to just above the floor, keeping your body in a straight line from head to heels. Push back up explosively. Keep your core braced and don't let your hips sag. Squeeze chest at the top.",
        "image_url": IMG["physique"],
        "video_url": VID["pushups"],
        "default_sets": 3, "default_reps": 15
    },
    # ── Back ───────────────────────────────────────────────────────────────
    {
        "id": "ex_deadlift", "name": "Deadlift", "muscle_group": "Back",
        "description": "Stand with bar over mid-foot, hip-width stance. Hinge down and grip just outside your legs. Keep your chest up, back flat, and bar close to your body as you drive through the floor to stand. Lock out hips at top. Lower under control. This is the king of all compound lifts — respect the weight.",
        "image_url": IMG["deadlift"],
        "video_url": VID["deadlift"],
        "default_sets": 4, "default_reps": 8
    },
    {
        "id": "ex_pullups", "name": "Pull-ups", "muscle_group": "Back",
        "description": "Hang from a bar with an overhand grip, slightly wider than shoulders. Pull yourself up until your chin clears the bar by driving your elbows down toward your hips. Lower with full control to a dead hang. Keep core tight and avoid swinging. If you can't do full pull-ups, use a band for assistance.",
        "image_url": IMG["lat_pulldown"],
        "video_url": VID["pullups"],
        "default_sets": 4, "default_reps": 10
    },
    {
        "id": "ex_single_arm_row", "name": "Single Arm Dumbbell Row", "muscle_group": "Back",
        "description": "Place one knee and hand on a bench for support. With the other hand, grip a dumbbell and let it hang straight down. Row the dumbbell to your hip, leading with your elbow and keeping it close to your body. Squeeze your back at the top. Lower slowly. Keep your back flat and avoid rotating your torso.",
        "image_url": IMG["deadlift"],
        "video_url": VID["single_arm_rows"],
        "default_sets": 4, "default_reps": 10
    },
    {
        "id": "ex_seated_row", "name": "Seated Cable Row", "muscle_group": "Back",
        "description": "Sit at a cable row machine with feet on the platform, knees slightly bent. Grip the handle and sit up tall. Pull the handle to your lower chest, driving elbows back and squeezing shoulder blades together. Slowly extend arms back to the start. Don't round your lower back or use momentum.",
        "image_url": IMG["lat_pulldown"],
        "video_url": VID["seated_rows"],
        "default_sets": 4, "default_reps": 10
    },
    {
        "id": "ex_lat_pulldown", "name": "Lat Pulldown", "muscle_group": "Back",
        "description": "Sit at a lat pulldown machine, thighs secured under the pad. Grip the bar wider than shoulder width with an overhand grip. Lean back slightly and pull the bar down to your upper chest, driving your elbows toward the floor. Squeeze your lats at the bottom, then slowly return to full extension.",
        "image_url": IMG["lat_pulldown"],
        "video_url": VID["lat_pulldown"],
        "default_sets": 3, "default_reps": 12
    },
    # ── Shoulders ──────────────────────────────────────────────────────────
    {
        "id": "ex_shoulder_press", "name": "Shoulder Press", "muscle_group": "Shoulders",
        "description": "Sit or stand with dumbbells at shoulder height, palms facing forward. Press both dumbbells straight overhead until arms are fully extended. Lower back to shoulder height with control. Keep your core braced and avoid arching your lower back. This is the primary builder of shoulder mass and strength.",
        "image_url": IMG["dumbbell_press"],
        "video_url": VID["shoulder_press"],
        "default_sets": 4, "default_reps": 10
    },
    {
        "id": "ex_lateral_raise", "name": "Lateral Raise", "muscle_group": "Shoulders",
        "description": "Stand with dumbbells at your sides, slight bend in elbows. Raise both arms out to the sides until they reach shoulder height, leading with your elbows not your wrists. Pause at the top, then lower slowly over 3 seconds. Keep your torso still and avoid shrugging. Targets the medial deltoid for width.",
        "image_url": IMG["arms_flex"],
        "video_url": VID["lateral_raises"],
        "default_sets": 3, "default_reps": 15
    },
    {
        "id": "ex_front_raise", "name": "Front Raise", "muscle_group": "Shoulders",
        "description": "Stand holding dumbbells in front of your thighs. Raise one or both arms forward to shoulder height with a slight bend in the elbows. Hold briefly at the top, then lower slowly. Keep your torso upright and avoid swinging. Targets the anterior deltoid. Can be done alternating or both arms together.",
        "image_url": IMG["arms_flex"],
        "video_url": VID["front_raise"],
        "default_sets": 3, "default_reps": 12
    },
    # ── Legs ───────────────────────────────────────────────────────────────
    {
        "id": "ex_squat", "name": "Barbell Squat", "muscle_group": "Legs",
        "description": "Place bar across your upper traps. Stand shoulder-width apart, toes slightly out. Brace your core, take a big breath, and squat down until thighs are at least parallel to the floor. Drive through your heels to stand back up. Keep your chest tall, knees tracking over toes, and back neutral throughout.",
        "image_url": IMG["squats"],
        "video_url": VID["squats"],
        "default_sets": 4, "default_reps": 10
    },
    {
        "id": "ex_leg_press", "name": "Leg Press", "muscle_group": "Legs",
        "description": "Sit in the leg press machine with feet shoulder-width on the platform. Lower the platform by bending knees to 90 degrees, keeping lower back pressed into the seat. Press back up without locking knees. A higher foot placement hits glutes more, lower hits quads. Never let your lower back lift off the pad.",
        "image_url": IMG["leg_machine"],
        "video_url": VID["leg_press"],
        "default_sets": 4, "default_reps": 12
    },
    {
        "id": "ex_lunges", "name": "Lunges", "muscle_group": "Legs",
        "description": "Stand with feet together. Step one foot forward and lower your back knee toward the floor until both knees are at 90 degrees. Push through your front heel to return to the start. Keep your torso upright, front knee over your ankle, and back knee hovering just above the floor. Alternate legs each rep.",
        "image_url": IMG["leg_machine"],
        "video_url": VID["lunges"],
        "default_sets": 3, "default_reps": 12
    },
    {
        "id": "ex_leg_curl", "name": "Leg Curl", "muscle_group": "Legs",
        "description": "Lie face down on the leg curl machine with the pad just above your heels. Curl your legs up toward your glutes as far as possible, squeezing hamstrings at the top. Lower slowly over 3 seconds. Don't let your hips rise off the pad. Slow negatives on this exercise build serious hamstring size.",
        "image_url": IMG["leg_machine"],
        "video_url": VID["leg_curl"],
        "default_sets": 3, "default_reps": 12
    },
    {
        "id": "ex_calf_raise", "name": "Calf Raise", "muscle_group": "Legs",
        "description": "Stand on the edge of a step or flat ground. Rise up on your toes as high as possible, hold for 1 second, then lower your heels below the step level for a full stretch. The full range of motion is what makes this effective. Do these slowly — calves respond best to time under tension.",
        "image_url": IMG["leg_machine"],
        "video_url": VID["calf_raise"],
        "default_sets": 4, "default_reps": 15
    },
    # ── Biceps ─────────────────────────────────────────────────────────────
    {
        "id": "ex_barbell_curl", "name": "Barbell Curl", "muscle_group": "Biceps",
        "description": "Stand holding a barbell with an underhand grip, shoulder-width apart. Keep elbows pinned at your sides and curl the bar up to shoulder height. Squeeze hard at the top, then lower slowly over 3 seconds. Avoid swinging your body — if you need momentum, the weight is too heavy. Full range of motion every rep.",
        "image_url": IMG["bicep_curl"],
        "video_url": VID["barbell_curls"],
        "default_sets": 3, "default_reps": 12
    },
    {
        "id": "ex_hammer_curl", "name": "Hammer Curl", "muscle_group": "Biceps",
        "description": "Hold dumbbells with a neutral grip (palms facing each other). Curl both dumbbells up simultaneously or alternate arms, keeping the neutral grip throughout. This targets the brachialis and brachioradialis — muscles that sit under the bicep and make your arms look thicker from the side. Keep elbows locked to your sides.",
        "image_url": IMG["dumbbell_curl"],
        "video_url": VID["hammer_curl"],
        "default_sets": 3, "default_reps": 12
    },
    # ── Triceps ────────────────────────────────────────────────────────────
    {
        "id": "ex_tricep_dip", "name": "Tricep Dip", "muscle_group": "Triceps",
        "description": "Grip parallel bars and support your body weight with arms straight. Lower your body by bending your elbows until upper arms are parallel to the floor. Push back up to full lockout. Keep elbows close to your body and torso upright for more tricep focus. Lean forward for more chest involvement. Add weight with a belt when bodyweight becomes easy.",
        "image_url": IMG["physique"],
        "video_url": VID["tricep_dip"],
        "default_sets": 3, "default_reps": 12
    },
    {
        "id": "ex_tricep_extension", "name": "Tricep Extension", "muscle_group": "Triceps",
        "description": "Hold a dumbbell or EZ-bar overhead with both hands, arms fully extended. Keeping upper arms stationary and close to your head, lower the weight behind your head by bending at the elbows. Extend back up to the start. The overhead position stretches the long head of the tricep for maximum growth. Keep core tight.",
        "image_url": IMG["arms_flex"],
        "video_url": VID["tricep_extension"],
        "default_sets": 3, "default_reps": 12
    },
    {
        "id": "ex_close_grip_press", "name": "Close Grip Bench Press", "muscle_group": "Triceps",
        "description": "Lie on a bench and grip the barbell with hands shoulder-width or slightly closer. Keep elbows tucked tight to your sides as you lower the bar to your lower chest. Press back up through your triceps. The close grip shifts the focus from chest to triceps. Don't go too narrow — it stresses the wrists.",
        "image_url": IMG["dumbbell_press"],
        "video_url": VID["close_grip_press"],
        "default_sets": 3, "default_reps": 10
    },
    # ── Core ───────────────────────────────────────────────────────────────
    {
        "id": "ex_plank", "name": "Plank", "muscle_group": "Core",
        "description": "Get into a push-up position on your forearms. Keep your body in a perfectly straight line from head to heels. Squeeze your glutes, brace your abs like you're about to take a punch, and breathe steadily. Don't let your hips rise or sag. If your form breaks, stop — quality over duration every time.",
        "image_url": IMG["physique"],
        "video_url": VID["plank"],
        "default_sets": 3, "default_reps": 60
    },
    {
        "id": "ex_crunches", "name": "Crunches", "muscle_group": "Core",
        "description": "Lie on your back with knees bent, hands lightly behind your head. Curl your shoulders off the floor by contracting your abs — not pulling on your neck. Exhale at the top and hold for 1 second. Lower slowly. The range of motion is small but the contraction should be intense. Don't anchor your feet.",
        "image_url": IMG["physique"],
        "video_url": VID["crunches"],
        "default_sets": 3, "default_reps": 20
    },
    {
        "id": "ex_russian_twist", "name": "Russian Twist", "muscle_group": "Core",
        "description": "Sit on the floor with knees bent and feet elevated. Lean back slightly so your torso is at 45 degrees. Hold a weight or clasp your hands together. Rotate your torso side to side, touching the weight to the floor on each side. Keep your core braced throughout. The rotation should come from your abs, not your arms.",
        "image_url": IMG["physique"],
        "video_url": VID["russian_twist"],
        "default_sets": 3, "default_reps": 20
    },
]

# ─── Routines — each with a unique cover from your uploaded photos ───────────
ROUTINES = [
    {
        "id": "routine_full_body", "name": "Full Body Blast", "type": "full_body",
        "description": "Complete full body workout hitting all major muscle groups",
        "cover_image": IMG["physique"],
        "estimated_duration": 60,
        "exercises": [
            {"exercise_id": "ex_squat",           "exercise_name": "Barbell Squat",           "muscle_group": "Legs",      "image_url": IMG["squats"],         "sets": 4, "reps": 10, "completed_sets": 0},
            {"exercise_id": "ex_bench_press",      "exercise_name": "Barbell Bench Press",     "muscle_group": "Chest",     "image_url": IMG["dumbbell_press"], "sets": 4, "reps": 10, "completed_sets": 0},
            {"exercise_id": "ex_single_arm_row",   "exercise_name": "Single Arm DB Row",       "muscle_group": "Back",      "image_url": IMG["deadlift"],       "sets": 4, "reps": 10, "completed_sets": 0},
            {"exercise_id": "ex_shoulder_press",   "exercise_name": "Shoulder Press",          "muscle_group": "Shoulders", "image_url": IMG["dumbbell_press"], "sets": 3, "reps": 12, "completed_sets": 0},
            {"exercise_id": "ex_plank",            "exercise_name": "Plank",                   "muscle_group": "Core",      "image_url": IMG["physique"],       "sets": 3, "reps": 60, "completed_sets": 0},
        ]
    },
    {
        "id": "routine_upper", "name": "Upper Body Power", "type": "upper",
        "description": "Focus on chest, back, shoulders, and arms",
        "cover_image": IMG["dumbbell_press"],
        "estimated_duration": 50,
        "exercises": [
            {"exercise_id": "ex_bench_press",    "exercise_name": "Barbell Bench Press", "muscle_group": "Chest",     "image_url": IMG["dumbbell_press"], "sets": 4, "reps": 10, "completed_sets": 0},
            {"exercise_id": "ex_pullups",        "exercise_name": "Pull-ups",            "muscle_group": "Back",      "image_url": IMG["lat_pulldown"],   "sets": 4, "reps": 10, "completed_sets": 0},
            {"exercise_id": "ex_shoulder_press", "exercise_name": "Shoulder Press",      "muscle_group": "Shoulders", "image_url": IMG["dumbbell_press"], "sets": 3, "reps": 12, "completed_sets": 0},
            {"exercise_id": "ex_barbell_curl",   "exercise_name": "Barbell Curl",        "muscle_group": "Biceps",    "image_url": IMG["bicep_curl"],     "sets": 3, "reps": 12, "completed_sets": 0},
            {"exercise_id": "ex_tricep_dip",     "exercise_name": "Tricep Dip",          "muscle_group": "Triceps",   "image_url": IMG["physique"],       "sets": 3, "reps": 12, "completed_sets": 0},
        ]
    },
    {
        "id": "routine_lower", "name": "Lower Body Strength", "type": "lower",
        "description": "Build powerful legs and core",
        "cover_image": IMG["squats"],
        "estimated_duration": 50,
        "exercises": [
            {"exercise_id": "ex_squat",      "exercise_name": "Barbell Squat", "muscle_group": "Legs", "image_url": IMG["squats"],      "sets": 5, "reps": 8,  "completed_sets": 0},
            {"exercise_id": "ex_deadlift",   "exercise_name": "Deadlift",      "muscle_group": "Back", "image_url": IMG["deadlift"],    "sets": 4, "reps": 8,  "completed_sets": 0},
            {"exercise_id": "ex_leg_press",  "exercise_name": "Leg Press",     "muscle_group": "Legs", "image_url": IMG["leg_machine"], "sets": 4, "reps": 12, "completed_sets": 0},
            {"exercise_id": "ex_leg_curl",   "exercise_name": "Leg Curl",      "muscle_group": "Legs", "image_url": IMG["leg_machine"], "sets": 3, "reps": 12, "completed_sets": 0},
            {"exercise_id": "ex_calf_raise", "exercise_name": "Calf Raise",    "muscle_group": "Legs", "image_url": IMG["leg_machine"], "sets": 4, "reps": 15, "completed_sets": 0},
        ]
    },
    {
        "id": "routine_push", "name": "Push Day", "type": "push",
        "description": "Chest, shoulders, and triceps",
        "cover_image": IMG["chest_cable"],
        "estimated_duration": 45,
        "exercises": [
            {"exercise_id": "ex_bench_press",      "exercise_name": "Barbell Bench Press", "muscle_group": "Chest",     "image_url": IMG["dumbbell_press"], "sets": 4, "reps": 10, "completed_sets": 0},
            {"exercise_id": "ex_dumbbell_press",   "exercise_name": "Dumbbell Press",      "muscle_group": "Chest",     "image_url": IMG["dumbbell_press"], "sets": 3, "reps": 12, "completed_sets": 0},
            {"exercise_id": "ex_shoulder_press",   "exercise_name": "Shoulder Press",      "muscle_group": "Shoulders", "image_url": IMG["dumbbell_press"], "sets": 4, "reps": 10, "completed_sets": 0},
            {"exercise_id": "ex_lateral_raise",    "exercise_name": "Lateral Raise",       "muscle_group": "Shoulders", "image_url": IMG["arms_flex"],      "sets": 3, "reps": 15, "completed_sets": 0},
            {"exercise_id": "ex_tricep_extension", "exercise_name": "Tricep Extension",    "muscle_group": "Triceps",   "image_url": IMG["arms_flex"],      "sets": 3, "reps": 12, "completed_sets": 0},
        ]
    },
    {
        "id": "routine_pull", "name": "Pull Day", "type": "pull",
        "description": "Back and biceps focus",
        "cover_image": IMG["lat_pulldown"],
        "estimated_duration": 45,
        "exercises": [
            {"exercise_id": "ex_deadlift",       "exercise_name": "Deadlift",              "muscle_group": "Back",   "image_url": IMG["deadlift"],    "sets": 4, "reps": 8,  "completed_sets": 0},
            {"exercise_id": "ex_pullups",        "exercise_name": "Pull-ups",              "muscle_group": "Back",   "image_url": IMG["lat_pulldown"],"sets": 4, "reps": 10, "completed_sets": 0},
            {"exercise_id": "ex_single_arm_row", "exercise_name": "Single Arm DB Row",    "muscle_group": "Back",   "image_url": IMG["deadlift"],    "sets": 4, "reps": 10, "completed_sets": 0},
            {"exercise_id": "ex_barbell_curl",   "exercise_name": "Barbell Curl",          "muscle_group": "Biceps", "image_url": IMG["bicep_curl"],  "sets": 3, "reps": 12, "completed_sets": 0},
            {"exercise_id": "ex_hammer_curl",    "exercise_name": "Hammer Curl",           "muscle_group": "Biceps", "image_url": IMG["dumbbell_curl"],"sets": 3, "reps": 12, "completed_sets": 0},
        ]
    },
    {
        "id": "routine_legs_ppl", "name": "Leg Day (PPL)", "type": "legs",
        "description": "Complete leg destruction",
        "cover_image": IMG["leg_machine"],
        "estimated_duration": 50,
        "exercises": [
            {"exercise_id": "ex_squat",      "exercise_name": "Barbell Squat", "muscle_group": "Legs", "image_url": IMG["squats"],      "sets": 5, "reps": 8,  "completed_sets": 0},
            {"exercise_id": "ex_leg_press",  "exercise_name": "Leg Press",     "muscle_group": "Legs", "image_url": IMG["leg_machine"], "sets": 4, "reps": 12, "completed_sets": 0},
            {"exercise_id": "ex_lunges",     "exercise_name": "Lunges",        "muscle_group": "Legs", "image_url": IMG["leg_machine"], "sets": 3, "reps": 12, "completed_sets": 0},
            {"exercise_id": "ex_leg_curl",   "exercise_name": "Leg Curl",      "muscle_group": "Legs", "image_url": IMG["leg_machine"], "sets": 3, "reps": 12, "completed_sets": 0},
            {"exercise_id": "ex_calf_raise", "exercise_name": "Calf Raise",    "muscle_group": "Legs", "image_url": IMG["leg_machine"], "sets": 5, "reps": 15, "completed_sets": 0},
        ]
    },
    {
        "id": "routine_chest", "name": "Chest Focus", "type": "individual",
        "description": "Build a powerful chest",
        "cover_image": IMG["bench_press"],
        "estimated_duration": 40,
        "exercises": [
            {"exercise_id": "ex_bench_press",    "exercise_name": "Barbell Bench Press", "muscle_group": "Chest", "image_url": IMG["dumbbell_press"], "sets": 5, "reps": 8,  "completed_sets": 0},
            {"exercise_id": "ex_dumbbell_press", "exercise_name": "Dumbbell Press",      "muscle_group": "Chest", "image_url": IMG["dumbbell_press"], "sets": 4, "reps": 10, "completed_sets": 0},
            {"exercise_id": "ex_chest_fly",      "exercise_name": "Dumbbell Chest Fly",  "muscle_group": "Chest", "image_url": IMG["chest_cable"],    "sets": 3, "reps": 12, "completed_sets": 0},
            {"exercise_id": "ex_pushups",        "exercise_name": "Push-ups",            "muscle_group": "Chest", "image_url": IMG["physique"],       "sets": 3, "reps": 20, "completed_sets": 0},
        ]
    },
    {
        "id": "routine_back", "name": "Back Builder", "type": "individual",
        "description": "Build a thick, wide back",
        "cover_image": IMG["deadlift"],
        "estimated_duration": 45,
        "exercises": [
            {"exercise_id": "ex_deadlift",       "exercise_name": "Deadlift",           "muscle_group": "Back", "image_url": IMG["deadlift"],    "sets": 5, "reps": 6,  "completed_sets": 0},
            {"exercise_id": "ex_pullups",        "exercise_name": "Pull-ups",           "muscle_group": "Back", "image_url": IMG["lat_pulldown"],"sets": 4, "reps": 10, "completed_sets": 0},
            {"exercise_id": "ex_single_arm_row", "exercise_name": "Single Arm DB Row", "muscle_group": "Back", "image_url": IMG["deadlift"],    "sets": 4, "reps": 10, "completed_sets": 0},
            {"exercise_id": "ex_seated_row",     "exercise_name": "Seated Cable Row",  "muscle_group": "Back", "image_url": IMG["lat_pulldown"],"sets": 3, "reps": 12, "completed_sets": 0},
        ]
    },
]


async def seed_database():
    print("Starting database seed...")
    await db.exercises.delete_many({})
    await db.workout_routines.delete_many({})
    print("Cleared existing data")
    await db.exercises.insert_many(EXERCISES)
    print(f"Inserted {len(EXERCISES)} exercises")
    await db.workout_routines.insert_many(ROUTINES)
    print(f"Inserted {len(ROUTINES)} workout routines")
    print("Done!")

if __name__ == "__main__":
    asyncio.run(seed_database())