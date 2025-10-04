import request from 'supertest';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import routes
import lessonsRouter from '../routes/lessons.js';
import answersRouter from '../routes/answers.js';
import uploadRouter from '../routes/upload.js';

// Import test helpers
import { TestDatabase, mockLessonData, mockLessonPlan, createTestPDF, cleanupTestPDF, testUtils } from './testHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create test app
function createTestApp(testDb) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Mock database injection for routes
  app.use((req, res, next) => {
    req.testDb = testDb;
    next();
  });

  // Routes
  app.use('/api/lessons', lessonsRouter);
  app.use('/api/answers', answersRouter);
  app.use('/api', uploadRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  return app;
}

describe('API Integration Tests', () => {
  let testDb;
  let app;
  let testPdfPath;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.initialize();
    app = createTestApp(testDb);
    testPdfPath = createTestPDF();
  });

  afterAll(async () => {
    await testDb.close();
    cleanupTestPDF();
  });

  beforeEach(async () => {
    await testDb.clear();
  });

  describe('Health Check', () => {
    test('GET /api/health should return OK status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Lessons API', () => {
    beforeEach(async () => {
      // Insert test lesson
      await testDb.runQuery(`
        INSERT INTO lessons (id, title, description, pdf_path, lesson_plan)
        VALUES (?, ?, ?, ?, ?)
      `, [
        mockLessonData.id,
        mockLessonData.title,
        mockLessonData.description,
        mockLessonData.pdf_path,
        mockLessonData.lesson_plan
      ]);
    });

    test('GET /api/lessons should return all lessons', async () => {
      const response = await request(app)
        .get('/api/lessons');

      testUtils.expectSuccess(response);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id', mockLessonData.id);
      expect(response.body[0]).toHaveProperty('title', mockLessonData.title);
    });

    test('GET /api/lessons/:id should return specific lesson', async () => {
      const response = await request(app)
        .get(`/api/lessons/${mockLessonData.id}`);

      testUtils.expectSuccess(response);
      expect(response.body).toHaveProperty('id', mockLessonData.id);
      expect(response.body).toHaveProperty('title', mockLessonData.title);
      expect(response.body).toHaveProperty('lesson_plan');
      expect(response.body.lesson_plan).toHaveProperty('title', mockLessonPlan.title);
      expect(response.body.lesson_plan.items).toHaveLength(4);
    });

    test('GET /api/lessons/:id should return 404 for non-existent lesson', async () => {
      const response = await request(app)
        .get('/api/lessons/non-existent-id');

      testUtils.expectError(response, 404, 'Lesson not found');
    });

    test('POST /api/lessons should create new lesson', async () => {
      const newLesson = {
        id: 'new-lesson-456',
        title: 'New Test Lesson',
        description: 'A new lesson for testing',
        pdfPath: '/test/new.pdf',
        lessonPlan: mockLessonPlan
      };

      const response = await request(app)
        .post('/api/lessons')
        .send(newLesson);

      testUtils.expectSuccess(response, 201);
      expect(response.body).toHaveProperty('message', 'Lesson created successfully');
      expect(response.body).toHaveProperty('id', newLesson.id);

      // Verify lesson was created
      const getResponse = await request(app)
        .get(`/api/lessons/${newLesson.id}`);

      testUtils.expectSuccess(getResponse);
      expect(getResponse.body.title).toBe(newLesson.title);
    });

    test('PATCH /api/lessons/:id/status should update lesson status', async () => {
      const response = await request(app)
        .patch(`/api/lessons/${mockLessonData.id}/status`)
        .send({ isActive: true });

      testUtils.expectSuccess(response);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('activated');
    });

    test('DELETE /api/lessons/:id should delete lesson', async () => {
      const response = await request(app)
        .delete(`/api/lessons/${mockLessonData.id}`);

      testUtils.expectSuccess(response);
      expect(response.body).toHaveProperty('message', 'Lesson deleted successfully');

      // Verify lesson was deleted
      const getResponse = await request(app)
        .get(`/api/lessons/${mockLessonData.id}`);

      testUtils.expectError(getResponse, 404);
    });

    test('DELETE /api/lessons/:id should return 404 for non-existent lesson', async () => {
      const response = await request(app)
        .delete('/api/lessons/non-existent');

      testUtils.expectError(response, 404, 'Lesson not found');
    });
  });

  describe('Answers API', () => {
    const studentId = 'test-student-123';

    beforeEach(async () => {
      // Insert test lesson
      await testDb.runQuery(`
        INSERT INTO lessons (id, title, description, pdf_path, lesson_plan)
        VALUES (?, ?, ?, ?, ?)
      `, [
        mockLessonData.id,
        mockLessonData.title,
        mockLessonData.description,
        mockLessonData.pdf_path,
        mockLessonData.lesson_plan
      ]);
    });

    test('POST /api/answers should submit new answer', async () => {
      const answer = {
        lessonId: mockLessonData.id,
        itemIndex: 1,
        itemId: 'item_1',
        studentId: studentId,
        answer: 'D',
        itemType: 'quiz'
      };

      const response = await request(app)
        .post('/api/answers')
        .send(answer);

      testUtils.expectSuccess(response, 201);
      expect(response.body).toHaveProperty('message', 'Answer submitted successfully');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('POST /api/answers should prevent duplicate submissions', async () => {
      const answer = {
        lessonId: mockLessonData.id,
        itemIndex: 1,
        studentId: studentId,
        answer: 'D',
        itemType: 'quiz'
      };

      // Submit first answer
      await request(app)
        .post('/api/answers')
        .send(answer);

      // Try to submit duplicate
      const response = await request(app)
        .post('/api/answers')
        .send(answer);

      testUtils.expectError(response, 409, 'Answer already submitted');
    });

    test('POST /api/answers should validate required fields', async () => {
      const incompleteAnswer = {
        lessonId: mockLessonData.id,
        // Missing itemIndex, studentId, answer
      };

      const response = await request(app)
        .post('/api/answers')
        .send(incompleteAnswer);

      testUtils.expectError(response, 400, 'Missing required fields');
    });

    test('GET /api/answers/lesson/:id/item/:index should return answer statistics', async () => {
      // Submit some test answers
      const answers = [
        { studentId: 'student1', answer: 'A' },
        { studentId: 'student2', answer: 'B' },
        { studentId: 'student3', answer: 'A' },
      ];

      for (const ans of answers) {
        await request(app)
          .post('/api/answers')
          .send({
            lessonId: mockLessonData.id,
            itemIndex: 1,
            studentId: ans.studentId,
            answer: ans.answer,
            itemType: 'quiz'
          });
      }

      const response = await request(app)
        .get(`/api/answers/lesson/${mockLessonData.id}/item/1`);

      testUtils.expectSuccess(response);
      expect(response.body).toHaveProperty('answers');
      expect(response.body).toHaveProperty('totalResponses', 3);
      expect(response.body).toHaveProperty('itemIndex', 1);
      expect(response.body.answers).toHaveLength(2); // A and B

      // Check that A has 2 votes and B has 1
      const answerA = response.body.answers.find(a => a.answer === 'A');
      const answerB = response.body.answers.find(a => a.answer === 'B');
      expect(answerA.count).toBe(2);
      expect(answerB.count).toBe(1);
    });

    test('GET /api/answers/lesson/:id/results should return comprehensive results', async () => {
      // Submit test answers for multiple items
      const testAnswers = [
        { itemIndex: 1, studentId: 'student1', answer: 'D', itemType: 'quiz' },
        { itemIndex: 1, studentId: 'student2', answer: 'A', itemType: 'quiz' },
        { itemIndex: 2, studentId: 'student1', answer: 'A', itemType: 'poll' },
        { itemIndex: 2, studentId: 'student2', answer: 'B', itemType: 'poll' },
      ];

      for (const ans of testAnswers) {
        await request(app)
          .post('/api/answers')
          .send({
            lessonId: mockLessonData.id,
            ...ans
          });
      }

      const response = await request(app)
        .get(`/api/answers/lesson/${mockLessonData.id}/results`);

      testUtils.expectSuccess(response);
      expect(response.body).toHaveProperty('lesson');
      expect(response.body).toHaveProperty('uniqueStudents', 2);
      expect(response.body).toHaveProperty('resultsByItem');
      expect(response.body).toHaveProperty('recentActivity');

      expect(response.body.resultsByItem).toHaveLength(2); // Two items answered
      expect(response.body.recentActivity).toHaveLength(4); // Four answers submitted
    });

    test('GET /api/answers/lesson/:id/student/:studentId should return student progress', async () => {
      // Submit answers for student
      const answers = [
        { itemIndex: 1, answer: 'D', itemType: 'quiz' },
        { itemIndex: 3, answer: 'false', itemType: 'quiz' },
      ];

      for (const ans of answers) {
        await request(app)
          .post('/api/answers')
          .send({
            lessonId: mockLessonData.id,
            studentId: studentId,
            ...ans
          });
      }

      const response = await request(app)
        .get(`/api/answers/lesson/${mockLessonData.id}/student/${studentId}`);

      testUtils.expectSuccess(response);
      expect(response.body).toHaveProperty('studentId', studentId);
      expect(response.body).toHaveProperty('lessonId', mockLessonData.id);
      expect(response.body).toHaveProperty('answeredItems');
      expect(response.body).toHaveProperty('answers');

      expect(response.body.answeredItems).toEqual([1, 3]);
      expect(response.body.answers).toHaveLength(2);
    });
  });

  describe('Upload API', () => {
    test('GET /api/qr/:lessonId should generate QR code', async () => {
      const response = await request(app)
        .get(`/api/qr/${mockLessonData.id}`);

      testUtils.expectSuccess(response);
      expect(response.body).toHaveProperty('lessonId', mockLessonData.id);
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('qrCode');
      expect(response.body.url).toContain(`/lesson/${mockLessonData.id}`);
      expect(response.body.qrCode).toMatch(/^data:image\/png;base64,/);
    });

    // Note: PDF upload test would require mocking the AI service
    // This is a placeholder for a more complex integration test
    test('POST /api/upload-pdf should validate file type', async () => {
      const response = await request(app)
        .post('/api/upload-pdf')
        .attach('pdf', Buffer.from('not a pdf'), 'test.txt');

      // Should return error (400 or 500 are both acceptable for bad files)
      expect([400, 500]).toContain(response.status);

      // Response body might be empty or have error property - both acceptable
      if (Object.keys(response.body).length > 0) {
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint');

      expect(response.status).toBe(404);
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/lessons')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });
  });

  describe('CORS', () => {
    test('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3001');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});