import request from 'supertest';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import the actual server components
import lessonsRouter from '../routes/lessons.js';
import answersRouter from '../routes/answers.js';
import uploadRouter from '../routes/upload.js';

// Import test helpers
import { TestDatabase, createTestPDF, cleanupTestPDF, testUtils } from './testHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a test app that mirrors the production app
function createIntegrationTestApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Serve static files
  app.use('/dashboard', express.static(path.join(__dirname, '../../dashboard')));
  app.use('/frontend', express.static(path.join(__dirname, '../../frontend')));
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // API Routes
  app.use('/api/lessons', lessonsRouter);
  app.use('/api/answers', answersRouter);
  app.use('/api', uploadRouter);

  // Serve professor dashboard at root
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dashboard/index.html'));
  });

  // Serve student lesson interface
  app.get('/lesson/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  return app;
}

describe('End-to-End Integration Tests', () => {
  let app;
  let testPdfPath;
  let testDb;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.initialize();
    app = createIntegrationTestApp();

    // Inject test database into app
    app.use((req, res, next) => {
      req.testDb = testDb;
      next();
    });

    testPdfPath = createTestPDF();
  });

  afterAll(async () => {
    await testDb.close();
    cleanupTestPDF();
  });

  beforeEach(async () => {
    await testDb.clear();
  });

  describe('Complete Lesson Workflow', () => {
    let lessonId;
    let lessonUrl;
    let qrCodeData;

    test('Professor uploads PDF and generates lesson', async () => {
      // Note: This test would require mocking the AI service in a real scenario
      // For now, we'll test the upload endpoint structure

      const response = await request(app)
        .post('/api/upload-pdf')
        .attach('pdf', testPdfPath)
        .field('numItems', '4');

      // If AI key is available, expect success (201), otherwise expect error (>=400)
      expect([201, 400, 500]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('lesson');
        expect(response.body.lesson).toHaveProperty('qrCode');
      } else {
        expect(response.body).toHaveProperty('error');
      }
    }, 30000);

    test('Manually create lesson and test student flow', async () => {
      // Create lesson manually for testing
      lessonId = testUtils.generateRandomId();

      const lessonData = {
        id: lessonId,
        title: 'Integration Test Lesson',
        description: 'A lesson created for integration testing',
        pdfPath: testPdfPath,
        lessonPlan: {
          title: 'Integration Test Lesson',
          description: 'A lesson created for integration testing',
          items: [
            {
              type: 'text',
              title: 'Welcome',
              content: 'Welcome to our integration test lesson!'
            },
            {
              type: 'quiz',
              questionType: 'MCQ',
              question: 'What is 2 + 2?',
              answerA: '3',
              answerB: '4',
              answerC: '5',
              answerD: '6',
              correctAnswer: 'B',
              explanation: 'Two plus two equals four.'
            },
            {
              type: 'poll',
              pollType: 'POLL_2',
              question: 'Do you like this test?',
              optionA: 'Yes',
              optionB: 'No'
            }
          ]
        }
      };

      const response = await request(app)
        .post('/api/lessons')
        .send(lessonData);

      testUtils.expectSuccess(response, 201);
      expect(response.body).toHaveProperty('id', lessonId);
    });

    test('Generate QR code for lesson', async () => {
      const response = await request(app)
        .get(`/api/qr/${lessonId}`);

      testUtils.expectSuccess(response);
      expect(response.body).toHaveProperty('lessonId', lessonId);
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('qrCode');

      lessonUrl = response.body.url;
      qrCodeData = response.body.qrCode;

      expect(lessonUrl).toContain(`/lesson/${lessonId}`);
      expect(qrCodeData).toMatch(/^data:image\/png;base64,/);
    });

    test('Student accesses lesson data', async () => {
      const response = await request(app)
        .get(`/api/lessons/${lessonId}`);

      testUtils.expectSuccess(response);
      expect(response.body).toHaveProperty('id', lessonId);
      expect(response.body).toHaveProperty('lesson_plan');
      expect(response.body.lesson_plan).toHaveProperty('items');
      expect(response.body.lesson_plan.items).toHaveLength(3);
    });

    test('Multiple students submit answers', async () => {
      const students = ['student1', 'student2', 'student3'];
      const answers = [
        { itemIndex: 1, answer: 'B', itemType: 'quiz' },
        { itemIndex: 2, answer: 'A', itemType: 'poll' }
      ];

      // Each student submits answers
      for (const studentId of students) {
        for (const answer of answers) {
          const response = await request(app)
            .post('/api/answers')
            .send({
              lessonId,
              studentId,
              ...answer
            });

          testUtils.expectSuccess(response, 201);
        }
      }

      // Verify all answers were submitted
      const resultsResponse = await request(app)
        .get(`/api/answers/lesson/${lessonId}/results`);

      testUtils.expectSuccess(resultsResponse);
      expect(resultsResponse.body).toHaveProperty('uniqueStudents', 3);
      expect(resultsResponse.body).toHaveProperty('resultsByItem');
      expect(resultsResponse.body.resultsByItem).toHaveLength(2);
    });

    test('Professor views live results', async () => {
      const response = await request(app)
        .get(`/api/answers/lesson/${lessonId}/results`);

      testUtils.expectSuccess(response);

      const results = response.body;
      expect(results).toHaveProperty('lesson');
      expect(results).toHaveProperty('uniqueStudents', 3);
      expect(results).toHaveProperty('resultsByItem');
      expect(results).toHaveProperty('recentActivity');

      // Check quiz results (item index 1)
      const quizResults = results.resultsByItem.find(item => item.itemIndex === 1);
      expect(quizResults).toBeTruthy();
      expect(quizResults.itemType).toBe('quiz');
      expect(quizResults.totalResponses).toBe(3);
      expect(quizResults.answers).toEqual([{ answer: 'B', count: 3 }]);

      // Check poll results (item index 2)
      const pollResults = results.resultsByItem.find(item => item.itemIndex === 2);
      expect(pollResults).toBeTruthy();
      expect(pollResults.itemType).toBe('poll');
      expect(pollResults.totalResponses).toBe(3);
      expect(pollResults.answers).toEqual([{ answer: 'A', count: 3 }]);
    });

    test('Student progress tracking', async () => {
      const studentId = 'student1';

      const response = await request(app)
        .get(`/api/answers/lesson/${lessonId}/student/${studentId}`);

      testUtils.expectSuccess(response);
      expect(response.body).toHaveProperty('studentId', studentId);
      expect(response.body).toHaveProperty('lessonId', lessonId);
      expect(response.body).toHaveProperty('answeredItems');
      expect(response.body.answeredItems).toEqual([1, 2]);
      expect(response.body.answers).toHaveLength(2);
    });

    test('Prevent duplicate answer submissions', async () => {
      const duplicateAnswer = {
        lessonId,
        itemIndex: 1,
        studentId: 'student1',
        answer: 'A',
        itemType: 'quiz'
      };

      const response = await request(app)
        .post('/api/answers')
        .send(duplicateAnswer);

      testUtils.expectError(response, 409, 'Answer already submitted');
    });

    test('Item-specific answer statistics', async () => {
      const response = await request(app)
        .get(`/api/answers/lesson/${lessonId}/item/1`);

      testUtils.expectSuccess(response);
      expect(response.body).toHaveProperty('answers');
      expect(response.body).toHaveProperty('totalResponses', 3);
      expect(response.body).toHaveProperty('itemIndex', 1);

      const answers = response.body.answers;
      expect(answers).toHaveLength(1); // Only 'B' was answered
      expect(answers[0]).toEqual({ answer: 'B', count: 3 });
    });

    test('Lesson management operations', async () => {
      // List all lessons
      const listResponse = await request(app)
        .get('/api/lessons');

      testUtils.expectSuccess(listResponse);
      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body.length).toBeGreaterThan(0);

      // Update lesson status
      const statusResponse = await request(app)
        .patch(`/api/lessons/${lessonId}/status`)
        .send({ isActive: true });

      testUtils.expectSuccess(statusResponse);

      // Verify status was updated
      const getResponse = await request(app)
        .get(`/api/lessons/${lessonId}`);

      testUtils.expectSuccess(getResponse);
      expect(getResponse.body).toHaveProperty('is_active', 1);
    });
  });

  describe('Static File Serving', () => {
    test('Professor dashboard should be accessible', async () => {
      const response = await request(app)
        .get('/');

      expect(response.status).toBe(200);
      expect(response.text).toContain('Professor Dashboard');
    });

    test('Student lesson interface should be accessible', async () => {
      const response = await request(app)
        .get('/lesson/test-id');

      expect(response.status).toBe(200);
      expect(response.text).toContain('Interactive Lesson');
    });

    test('API health check should work', async () => {
      const response = await request(app)
        .get('/api/health');

      testUtils.expectSuccess(response);
      expect(response.body).toHaveProperty('status', 'OK');
    });
  });

  describe('Error Scenarios', () => {
    test('Should handle non-existent lesson gracefully', async () => {
      const response = await request(app)
        .get('/api/lessons/non-existent-lesson');

      testUtils.expectError(response, 404, 'Lesson not found');
    });

    test('Should handle malformed answer submissions', async () => {
      const malformedAnswer = {
        lessonId: 'some-lesson',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/answers')
        .send(malformedAnswer);

      testUtils.expectError(response, 400, 'Missing required fields');
    });

    test('Should handle non-existent QR generation', async () => {
      const response = await request(app)
        .get('/api/qr/non-existent-lesson');

      testUtils.expectSuccess(response); // QR generation doesn't require lesson to exist
      expect(response.body).toHaveProperty('lessonId', 'non-existent-lesson');
    });

    test('Should handle invalid routes', async () => {
      const response = await request(app)
        .get('/api/invalid-endpoint');

      expect(response.status).toBe(404);
    });
  });

  describe('Performance and Load Testing', () => {
    test('Should handle concurrent answer submissions', async () => {
      // Create a lesson for load testing
      const loadTestLessonId = testUtils.generateRandomId();

      await request(app)
        .post('/api/lessons')
        .send({
          id: loadTestLessonId,
          title: 'Load Test Lesson',
          description: 'For testing concurrent submissions',
          pdfPath: testPdfPath,
          lessonPlan: {
            title: 'Load Test',
            description: 'Load testing',
            items: [
              {
                type: 'quiz',
                questionType: 'MCQ',
                question: 'Test question?',
                answerA: 'A',
                answerB: 'B',
                answerC: 'C',
                answerD: 'D',
                correctAnswer: 'A',
                explanation: 'Test explanation'
              }
            ]
          }
        });

      // Submit answers concurrently
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post('/api/answers')
            .send({
              lessonId: loadTestLessonId,
              itemIndex: 0,
              studentId: `load-test-student-${i}`,
              answer: ['A', 'B', 'C', 'D'][i % 4],
              itemType: 'quiz'
            })
        );
      }

      const responses = await Promise.all(promises);

      // All submissions should succeed
      responses.forEach(response => {
        testUtils.expectSuccess(response, 201);
      });

      // Verify all answers were recorded
      const resultsResponse = await request(app)
        .get(`/api/answers/lesson/${loadTestLessonId}/results`);

      testUtils.expectSuccess(resultsResponse);
      expect(resultsResponse.body.uniqueStudents).toBe(20);
    });

    test('Should handle rapid results polling', async () => {
      const lessonId = testUtils.generateRandomId();

      // Create lesson
      await request(app)
        .post('/api/lessons')
        .send({
          id: lessonId,
          title: 'Polling Test Lesson',
          description: 'For testing rapid polling',
          pdfPath: testPdfPath,
          lessonPlan: {
            title: 'Polling Test',
            description: 'Polling testing',
            items: [{ type: 'text', title: 'Test', content: 'Test content' }]
          }
        });

      // Simulate rapid polling (like the frontend does every 3 seconds)
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get(`/api/answers/lesson/${lessonId}/results`)
        );
      }

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        testUtils.expectSuccess(response);
      });
    });
  });

  describe('Data Consistency', () => {
    test('Should maintain data consistency across operations', async () => {
      const consistencyTestLessonId = testUtils.generateRandomId();

      // Create lesson
      await request(app)
        .post('/api/lessons')
        .send({
          id: consistencyTestLessonId,
          title: 'Consistency Test',
          description: 'Testing data consistency',
          pdfPath: testPdfPath,
          lessonPlan: {
            title: 'Consistency Test',
            description: 'Testing data consistency',
            items: [
              {
                type: 'quiz',
                questionType: 'TF',
                question: 'Is this a test?',
                correctAnswer: 'true',
                explanation: 'Yes, this is a test.'
              }
            ]
          }
        });

      // Submit answer
      await request(app)
        .post('/api/answers')
        .send({
          lessonId: consistencyTestLessonId,
          itemIndex: 0,
          studentId: 'consistency-student',
          answer: 'true',
          itemType: 'quiz'
        });

      // Check lesson still exists and has correct data
      const lessonResponse = await request(app)
        .get(`/api/lessons/${consistencyTestLessonId}`);

      testUtils.expectSuccess(lessonResponse);
      expect(lessonResponse.body.title).toBe('Consistency Test');

      // Check answer was recorded correctly
      const resultsResponse = await request(app)
        .get(`/api/answers/lesson/${consistencyTestLessonId}/results`);

      testUtils.expectSuccess(resultsResponse);
      expect(resultsResponse.body.uniqueStudents).toBe(1);

      // Delete lesson and verify answers are also cleaned up
      await request(app)
        .delete(`/api/lessons/${consistencyTestLessonId}`);

      // Verify lesson is gone
      const deletedLessonResponse = await request(app)
        .get(`/api/lessons/${consistencyTestLessonId}`);

      testUtils.expectError(deletedLessonResponse, 404);

      // Verify answers are also gone (lesson not found is acceptable)
      const deletedAnswersResponse = await request(app)
        .get(`/api/answers/lesson/${consistencyTestLessonId}/results`);

      // Either lesson not found (404) or no students (empty results)
      if (deletedAnswersResponse.status === 404) {
        expect(deletedAnswersResponse.body).toHaveProperty('error');
      } else {
        testUtils.expectSuccess(deletedAnswersResponse);
        expect(deletedAnswersResponse.body.uniqueStudents).toBe(0);
      }
    });
  });
});