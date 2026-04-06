from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, courses, admin, tasks
from app.db.database import engine
from app.db import models

# создание бд при запуске
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Educational Platform API")

origins = [
    "http://localhost:5173",   # Vite
    "http://localhost:5174",   # Vite (если порт занят)
    "http://localhost:3000",   # React
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# роуты
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(courses.router, prefix="/courses", tags=["Courses"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Educational Platform API"}

@app.on_event("startup")
def startup_event():
    from app.core.security import get_password_hash
    from app.db.database import get_db
    from app.db import models
    from alembic.config import Config
    from alembic import command
    import os

    # Run database migrations
    print("Running database migrations...")
    try:
        alembic_cfg = Config("alembic.ini")
        # Set database URL from environment or use default
        database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/eduplatform")
        alembic_cfg.set_main_option("sqlalchemy.url", database_url)
        command.upgrade(alembic_cfg, "head")
        print("Migrations completed successfully.")
    except Exception as e:
        print(f"Migration error (this is normal on first run or if tables don't exist yet): {e}")
        # If migrations fail, try to create tables directly
        try:
            models.Base.metadata.create_all(bind=engine)
            print("Tables created directly.")
        except Exception as e2:
            print(f"Error creating tables: {e2}")

    print("Checking if admin user exists...")

    db = next(get_db())
    
    # Create admin user
    admin_email = "admin@admin.com"
    if not db.query(models.User).filter(models.User.email == admin_email).first():
        admin = models.User(
            email=admin_email,
            name="admin",
            role="admin",
            hashed_password=get_password_hash("Start!2345")
        )
        db.add(admin)
        db.commit()
        print("Admin user created.")
    else:
        print("Admin already exists.")
    
    # Create regular user
    print("Checking if regular user exists...")
    user_email = "user@user.com"
    if not db.query(models.User).filter(models.User.email == user_email).first():
        user = models.User(
            email=user_email,
            name="user",
            role="user",
            hashed_password=get_password_hash("Start!2345")
        )
        db.add(user)
        db.commit()
        print("Regular user created.")
    else:
        print("Regular user already exists.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
