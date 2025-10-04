# 🎓 AI-Powered Interactive Lesson Platform

A hackathon project that transforms PDF documents into interactive lessons with quizzes and polls using Google's Gemini AI.

## 🚀 Features

- **PDF to Lesson Conversion**: Upload a PDF and automatically generate interactive lesson plans
- **AI-Generated Content**: Uses Gemini 2.5 Flash to create quizzes, polls, and explanatory text
- **QR Code Access**: Students scan QR codes to join lessons on their devices
- **Real-time Results**: Professors see live student responses and engagement
- **Mobile-Friendly**: Responsive design works on phones, tablets, and computers
- **Multiple Question Types**:
  - Text explanations
  - Multiple choice quizzes
  - True/false questions
  - 2 or 4-option polls

## 🏗️ Architecture

```
HarvardHacks2025/
├── AI/                     # AI service (Gemini integration)
│   ├── simple-quiz-generator.js
│   ├── poll-generator.js
│   ├── lesson-plan-generator.js
│   └── felix.api          # Gemini API key
├── backend/               # Express.js server
│   ├── server.js
│   ├── routes/           # API endpoints
│   ├── services/         # AI & QR code services
│   └── database/         # SQLite database
├── frontend/             # Student interface
│   ├── index.html
│   ├── lesson.js
│   └── styles.css
└── dashboard/            # Professor interface
    ├── index.html
    ├── dashboard.js
    └── styles.css
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- Gemini API key (place in `AI/felix.api`)

### Quick Start

1. **Start the backend server:**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Access the application:**
   - Professor Dashboard: http://localhost:3000/
   - API Health Check: http://localhost:3000/api/health

### First Time Setup
1. Place your Gemini API key in `AI/felix.api`
2. The SQLite database will be created automatically
3. Upload a PDF through the professor dashboard to test

## 📱 How to Use

### For Professors:

1. **Upload PDF**: Go to http://localhost:3000/ and upload a PDF document
2. **Generate Lesson**: Choose number of items (6-12) and click "Generate Lesson"
3. **Share QR Code**: Students scan the QR code to access the lesson
4. **Monitor Results**: View live responses and engagement statistics

### For Students:

1. **Scan QR Code**: Use phone camera to scan the QR code
2. **Take Lesson**: Read content, answer quizzes, participate in polls
3. **Get Feedback**: See correct answers and explanations immediately

## 🔧 API Endpoints

- `GET /` - Professor dashboard
- `GET /lesson/:id` - Student lesson interface
- `POST /api/upload-pdf` - Upload PDF and generate lesson
- `GET /api/lessons/:id` - Get lesson data
- `POST /api/answers` - Submit student answers
- `GET /api/answers/lesson/:id/results` - Get live results
- `GET /api/qr/:id` - Generate QR code for lesson

## 🎯 Technical Stack

- **Backend**: Node.js, Express.js, SQLite
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **AI**: Google Gemini 2.5 Flash API
- **QR Codes**: qrcode npm package
- **File Upload**: Multer middleware

## 📊 Database Schema

```sql
-- Lessons table
CREATE TABLE lessons (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  pdf_path TEXT,
  lesson_plan TEXT, -- JSON
  created_at DATETIME,
  is_active BOOLEAN
);

-- Answers table
CREATE TABLE answers (
  id INTEGER PRIMARY KEY,
  lesson_id TEXT,
  item_index INTEGER,
  student_id TEXT,
  answer TEXT,
  item_type TEXT,
  submitted_at DATETIME
);
```

## 🔒 Security Features

- Anonymous student identification (device-based IDs)
- File type validation (PDF only)
- Input sanitization and validation
- CORS protection
- Error handling and logging

## 🎨 UI/UX Features

- **Mobile-first design** with responsive layouts
- **Loading states** and progress indicators
- **Real-time updates** with polling
- **Smooth animations** and transitions
- **Toast notifications** for user feedback
- **Accessibility** with proper ARIA labels

## 🚀 Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use PostgreSQL instead of SQLite
3. Add authentication system
4. Set up reverse proxy (nginx)
5. Use proper secrets management
6. Add monitoring and logging

## 🤝 Contributing

This is a hackathon project! Feel free to:
- Add new question types
- Improve the AI prompts
- Enhance the UI/UX
- Add analytics features
- Implement websockets for real-time updates

## 📝 License

MIT License - Built for Harvard Hacks 2025