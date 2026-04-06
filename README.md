# Educational Platform

A full-stack educational platform with course management, user authentication, and admin features.

## Project Structure

- `/src` - React frontend
- `/backend` - FastAPI backend

## Setup

### Prerequisites

- Node.js 16+
- Python 3.8+
- PostgreSQL

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```
VITE_API_URL=http://localhost:8000
```

3. Start development server:
```bash
npm run dev
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a PostgreSQL database:
```bash
createdb eduplatform
```

5. Run the application:
```bash
python main.py
```

### Using Docker for Backend

Alternatively, you can use Docker Compose for the backend:

```bash
cd backend
docker-compose up -d
```

## Features

- User authentication (login/register)
- Course browsing and enrollment
- Chapter-based learning with progress tracking
- Quizzes with automatic grading
- Admin panel for course management

## Demo Accounts

- Admin: admin@example.com / admin123
- User: user@example.com / user123
