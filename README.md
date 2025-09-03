# Training Portal Backend API

A comprehensive Node.js backend API for managing corporate training programs with trainee progress tracking, module management, and MCQ assessments.

## 🛠️ Tech Stack

- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer

## 🚀 Quick Start

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📚 API Endpoints

### 🔐 Authentication

#### POST `/api/auth/signup`
Register a new trainee account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "companyName": "Acme Corp"
}
```

**Response:**
```json
{
  "message": "Signup successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST `/api/auth/login`
Login to get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "TRAINEE",
    "companyId": 1
  }
}
```

#### POST `/api/auth/admin/signup`
Register a new admin account.

**Request Body:**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "AdminPassword123!"
}
```

**Response:**
```json
{
  "message": "Admin signup successful",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

#### POST `/api/auth/admin/login`
Admin login to get JWT token.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "AdminPassword123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

### 👨‍🎓 Trainee Endpoints

#### GET `/api/trainee/dashboard`
Get trainee dashboard with overall progress.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "overallProgress": 75,
  "modulesCompleted": 3,
  "averageScore": 85,
  "totalTimeSpent": 1800,
  "currentModule": {
    "moduleId": 4,
    "moduleName": "Module 4",
    "videoDuration": 600
  },
  "moduleProgress": [
    {
      "moduleId": 1,
      "moduleName": "Module 1",
      "timeSpentOnVideo": 300,
      "marksObtained": 90,
      "pass": true,
      "completed": true,
      "videoDuration": 600
    }
  ]
}
```

#### GET `/api/trainee/modules`
List all assigned modules with unlock status.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "moduleId": 1,
    "moduleName": "Module 1",
    "completed": true,
    "timeSpentOnVideo": 300,
    "marksObtained": 90,
    "pass": true,
    "videoDuration": 600,
    "unlocked": true
  },
  {
    "moduleId": 2,
    "moduleName": "Module 2",
    "completed": false,
    "timeSpentOnVideo": 0,
    "marksObtained": 0,
    "pass": false,
    "videoDuration": 450,
    "unlocked": true
  }
]
```

#### GET `/api/trainee/modules/:id`
Get specific module details with video and MCQs.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "name": "Module 1",
  "companyId": 1,
  "video": {
    "id": 1,
    "url": "video1.mp4",
    "duration": 600
  },
  "mcqs": [
    {
      "id": 1,
      "question": "What is Node.js?",
      "options": ["A runtime", "A database", "A browser", "A language"],
      "answer": "A runtime",
      "explanation": "Node.js is a JavaScript runtime."
    }
  ],
  "unlocked": true,
  "completed": false,
  "pass": false,
  "score": null
}
```

#### POST `/api/trainee/modules/:id/complete`
Mark module video as completed.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Module marked as completed"
}
```

#### POST `/api/trainee/modules/:id/mcq`
Submit MCQ answers and get results.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": 1,
      "selectedOption": "A runtime"
    },
    {
      "questionId": 2,
      "selectedOption": "JavaScript"
    }
  ]
}
```

**Response:**
```json
{
  "message": "MCQ submitted",
  "score": 2,
  "pass": true
}
```

### 🧑‍💼 Admin Endpoints

#### GET `/api/admin/trainees`
Get all trainees.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "TRAINEE",
    "companyId": 1,
    "isVerified": true,
    "company": {
      "id": 1,
      "name": "Acme Corp"
    }
  }
]
```

#### POST `/api/admin/trainees`
Create new trainee.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "companyId": 1
}
```

#### GET `/api/admin/companies`
Get all companies.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Acme Corp",
    "logo": "logo.png"
  }
]
```

#### POST `/api/admin/companies`
Create company with logo.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** `multipart/form-data`
- `name`: "Acme Corp"
- `logo`: [file upload]

#### GET `/api/admin/modules`
Get all modules across companies.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Module 1",
    "companyId": 1,
    "company": {
      "id": 1,
      "name": "Acme Corp"
    },
    "video": {
      "id": 1,
      "duration": 600
    },
    "_count": {
      "mcqs": 5
    }
  }
]
```

#### POST `/api/admin/companies/:id/modules`
Add module to company.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Module"
}
```

#### POST `/api/admin/modules/:id/video`
Add video to module.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** `multipart/form-data`
- `video`: [file upload]
- `duration`: "600"

#### POST `/api/admin/modules/:id/mcqs`
Add MCQs to module.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "mcqs": [
    {
      "question": "What is Node.js?",
      "options": ["A runtime", "A database", "A browser", "A language"],
      "answer": "A runtime",
      "explanation": "Node.js is a JavaScript runtime."
    }
  ]
}
```

#### GET `/api/admin/trainees/:id/progress`
Get detailed trainee progress.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "overallProgress": 75,
  "modulesCompleted": 3,
  "averageScore": 85,
  "totalTimeSpent": 1800,
  "moduleProgress": [
    {
      "moduleId": 1,
      "moduleName": "Module 1",
      "score": 90,
      "videoDuration": 600,
      "timeSpent": 300,
      "pass": true
    }
  ]
}
```

## 🔒 Authentication Flow

1. **User Registration/Login**
   - Call `/api/auth/signup` or `/api/auth/login`
   - Receive JWT token in response

2. **Store Token**
   - Save token in localStorage or secure storage
   - Include in all subsequent requests

3. **API Requests**
   - Add `Authorization: Bearer <token>` header
   - Token expires after 7 days

## 📊 Data Models

### User
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "TRAINEE",
  "companyId": 1,
  "isVerified": true
}
```

### Company
```json
{
  "id": 1,
  "name": "Acme Corp",
  "logo": "logo.png"
}
```

### TrainingModule
```json
{
  "id": 1,
  "name": "Module 1",
  "companyId": 1,
  "video": {
    "id": 1,
    "url": "video1.mp4",
    "duration": 600
  },
  "mcqs": [...]
}
```

### MCQ
```json
{
  "id": 1,
  "question": "What is Node.js?",
  "options": ["A runtime", "A database", "A browser", "A language"],
  "answer": "A runtime",
  "explanation": "Node.js is a JavaScript runtime."
}
```

## 🎯 Key Features for Frontend

### Sequential Module Unlocking
- Modules are unlocked only after passing previous ones
- Check `unlocked` field in module list
- Show appropriate UI for locked/unlocked modules

### Progress Tracking
- Real-time progress updates
- Time spent tracking
- Score calculation and pass/fail status

### File Uploads
- Company logos: `multipart/form-data`
- Videos: `multipart/form-data`
- Supported formats: Images (JPG, PNG), Videos (MP4, AVI)

### Error Handling
All endpoints return consistent error format:
```json
{
  "message": "Error description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Server Error

## 🧪 Testing

Use the provided Postman collection (`TrainingPortalBackend.postman_collection.json`) for API testing and development.

## 📞 Support

For API questions or issues:
- Check error responses for specific details
- Verify authentication headers
- Ensure proper request body format
- Contact backend team for assistance

---

**Ready for Frontend Integration! 🚀**