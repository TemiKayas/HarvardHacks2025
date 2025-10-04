import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test database helper
export class TestDatabase {
  constructor() {
    this.dbPath = ':memory:'; // Use in-memory database for tests
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath);

      this.db.serialize(() => {
        // Create test tables
        this.db.run(`
          CREATE TABLE IF NOT EXISTS lessons (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            pdf_path TEXT,
            lesson_plan TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 0
          )
        `);

        this.db.run(`
          CREATE TABLE IF NOT EXISTS answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lesson_id TEXT,
            item_index INTEGER,
            item_id TEXT,
            student_id TEXT,
            answer TEXT,
            item_type TEXT,
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lesson_id) REFERENCES lessons (id)
          )
        `);

        this.db.run(`
          CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            lesson_id TEXT,
            current_item_index INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lesson_id) REFERENCES lessons (id)
          )
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  getRow(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  getRows(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close(resolve);
      } else {
        resolve();
      }
    });
  }

  async clear() {
    await this.runQuery('DELETE FROM answers');
    await this.runQuery('DELETE FROM lessons');
    await this.runQuery('DELETE FROM sessions');
  }
}

// Mock lesson data
export const mockLessonPlan = {
  title: "Test Lesson: Introduction to Testing",
  description: "A comprehensive lesson about software testing principles",
  items: [
    {
      type: "text",
      title: "What is Testing?",
      content: "Software testing is the process of evaluating and verifying that a software application or system meets its requirements and functions correctly."
    },
    {
      type: "quiz",
      questionType: "MCQ",
      question: "What is the primary purpose of software testing?",
      answerA: "To find bugs",
      answerB: "To verify requirements are met",
      answerC: "To improve code quality",
      answerD: "All of the above",
      correctAnswer: "D",
      explanation: "Software testing serves multiple purposes including finding bugs, verifying requirements, and improving overall code quality."
    },
    {
      type: "poll",
      pollType: "POLL_2",
      question: "Have you written unit tests before?",
      optionA: "Yes, regularly",
      optionB: "No, never"
    },
    {
      type: "quiz",
      questionType: "TF",
      question: "Unit tests should test multiple functions at once.",
      correctAnswer: "false",
      explanation: "Unit tests should focus on testing a single unit of code in isolation."
    }
  ]
};

export const mockLessonData = {
  id: 'test-lesson-123',
  title: mockLessonPlan.title,
  description: mockLessonPlan.description,
  pdf_path: '/test/path/test.pdf',
  lesson_plan: JSON.stringify(mockLessonPlan),
  created_at: new Date().toISOString(),
  is_active: 1
};

// Create test PDF file
export function createTestPDF() {
  const testPdfPath = join(__dirname, 'test.pdf');

  // Create a minimal PDF-like file for testing
  // This is not a real PDF, but enough for testing file upload
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF Content) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000198 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
290
%%EOF`;

  fs.writeFileSync(testPdfPath, pdfContent);
  return testPdfPath;
}

export function cleanupTestPDF() {
  const testPdfPath = join(__dirname, 'test.pdf');
  if (fs.existsSync(testPdfPath)) {
    fs.unlinkSync(testPdfPath);
  }
}

// Test utilities
export const testUtils = {
  generateRandomId: () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

  generateStudentId: () => `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  expectError: (response, statusCode, message) => {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('error');
    if (message) {
      expect(response.body.error).toContain(message);
    }
  },

  expectSuccess: (response, statusCode = 200) => {
    expect(response.status).toBe(statusCode);
    expect(response.body).not.toHaveProperty('error');
  }
};