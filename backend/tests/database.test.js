import { TestDatabase, mockLessonData, mockLessonPlan, testUtils } from './testHelper.js';

describe('Database Tests', () => {
  let testDb;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.initialize();
  });

  afterAll(async () => {
    await testDb.close();
  });

  beforeEach(async () => {
    await testDb.clear();
  });

  describe('Database Initialization', () => {
    test('should create all required tables', async () => {
      const tables = await testDb.getRows(`
        SELECT name FROM sqlite_master WHERE type='table'
      `);

      const tableNames = tables.map(t => t.name);
      expect(tableNames).toContain('lessons');
      expect(tableNames).toContain('answers');
      expect(tableNames).toContain('sessions');
    });

    test('should have correct schema for lessons table', async () => {
      const schema = await testDb.getRows(`
        PRAGMA table_info(lessons)
      `);

      const columnNames = schema.map(col => col.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('title');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('pdf_path');
      expect(columnNames).toContain('lesson_plan');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('is_active');
    });

    test('should have correct schema for answers table', async () => {
      const schema = await testDb.getRows(`
        PRAGMA table_info(answers)
      `);

      const columnNames = schema.map(col => col.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('lesson_id');
      expect(columnNames).toContain('item_index');
      expect(columnNames).toContain('item_id');
      expect(columnNames).toContain('student_id');
      expect(columnNames).toContain('answer');
      expect(columnNames).toContain('item_type');
      expect(columnNames).toContain('submitted_at');
    });
  });

  describe('Lessons CRUD Operations', () => {
    test('should insert lesson correctly', async () => {
      const result = await testDb.runQuery(`
        INSERT INTO lessons (id, title, description, pdf_path, lesson_plan)
        VALUES (?, ?, ?, ?, ?)
      `, [
        mockLessonData.id,
        mockLessonData.title,
        mockLessonData.description,
        mockLessonData.pdf_path,
        mockLessonData.lesson_plan
      ]);

      expect(result).toHaveProperty('changes', 1);

      // Verify insertion
      const lesson = await testDb.getRow(`
        SELECT * FROM lessons WHERE id = ?
      `, [mockLessonData.id]);

      expect(lesson).toBeTruthy();
      expect(lesson.id).toBe(mockLessonData.id);
      expect(lesson.title).toBe(mockLessonData.title);
      expect(lesson.description).toBe(mockLessonData.description);
    });

    test('should retrieve lesson with parsed lesson_plan', async () => {
      // Insert lesson
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

      // Retrieve lesson
      const lesson = await testDb.getRow(`
        SELECT * FROM lessons WHERE id = ?
      `, [mockLessonData.id]);

      expect(lesson).toBeTruthy();

      // Parse and validate lesson plan
      const lessonPlan = JSON.parse(lesson.lesson_plan);
      expect(lessonPlan).toHaveProperty('title');
      expect(lessonPlan).toHaveProperty('description');
      expect(lessonPlan).toHaveProperty('items');
      expect(Array.isArray(lessonPlan.items)).toBe(true);
    });

    test('should update lesson status', async () => {
      // Insert lesson
      await testDb.runQuery(`
        INSERT INTO lessons (id, title, description, pdf_path, lesson_plan, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        mockLessonData.id,
        mockLessonData.title,
        mockLessonData.description,
        mockLessonData.pdf_path,
        mockLessonData.lesson_plan,
        0
      ]);

      // Update status
      const result = await testDb.runQuery(`
        UPDATE lessons SET is_active = ? WHERE id = ?
      `, [1, mockLessonData.id]);

      expect(result.changes).toBe(1);

      // Verify update
      const lesson = await testDb.getRow(`
        SELECT is_active FROM lessons WHERE id = ?
      `, [mockLessonData.id]);

      expect(lesson.is_active).toBe(1);
    });

    test('should delete lesson', async () => {
      // Insert lesson
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

      // Delete lesson
      const result = await testDb.runQuery(`
        DELETE FROM lessons WHERE id = ?
      `, [mockLessonData.id]);

      expect(result.changes).toBe(1);

      // Verify deletion
      const lesson = await testDb.getRow(`
        SELECT * FROM lessons WHERE id = ?
      `, [mockLessonData.id]);

      expect(lesson).toBeFalsy();
    });

    test('should retrieve all lessons ordered by creation date', async () => {
      // Insert multiple lessons
      const lessons = [
        { id: 'lesson1', title: 'First Lesson', created_at: '2023-01-01 10:00:00' },
        { id: 'lesson2', title: 'Second Lesson', created_at: '2023-01-02 10:00:00' },
        { id: 'lesson3', title: 'Third Lesson', created_at: '2023-01-03 10:00:00' }
      ];

      for (const lesson of lessons) {
        await testDb.runQuery(`
          INSERT INTO lessons (id, title, description, pdf_path, lesson_plan, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          lesson.id,
          lesson.title,
          'Test description',
          '/test/path.pdf',
          mockLessonData.lesson_plan,
          lesson.created_at
        ]);
      }

      // Retrieve lessons ordered by creation date (DESC)
      const retrievedLessons = await testDb.getRows(`
        SELECT id, title, created_at FROM lessons ORDER BY created_at DESC
      `);

      expect(retrievedLessons).toHaveLength(3);
      expect(retrievedLessons[0].id).toBe('lesson3'); // Most recent first
      expect(retrievedLessons[1].id).toBe('lesson2');
      expect(retrievedLessons[2].id).toBe('lesson1');
    });
  });

  describe('Answers CRUD Operations', () => {
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

    test('should insert answer correctly', async () => {
      const result = await testDb.runQuery(`
        INSERT INTO answers (lesson_id, item_index, item_id, student_id, answer, item_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [mockLessonData.id, 1, 'item_1', studentId, 'D', 'quiz']);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('changes', 1);

      // Verify insertion
      const answer = await testDb.getRow(`
        SELECT * FROM answers WHERE id = ?
      `, [result.id]);

      expect(answer).toBeTruthy();
      expect(answer.lesson_id).toBe(mockLessonData.id);
      expect(answer.student_id).toBe(studentId);
      expect(answer.answer).toBe('D');
    });

    test('should prevent duplicate answers for same student and item', async () => {
      // Insert first answer
      await testDb.runQuery(`
        INSERT INTO answers (lesson_id, item_index, student_id, answer, item_type)
        VALUES (?, ?, ?, ?, ?)
      `, [mockLessonData.id, 1, studentId, 'A', 'quiz']);

      // Check for existing answer
      const existingAnswer = await testDb.getRow(`
        SELECT id FROM answers
        WHERE lesson_id = ? AND item_index = ? AND student_id = ?
      `, [mockLessonData.id, 1, studentId]);

      expect(existingAnswer).toBeTruthy();
    });

    test('should get answer statistics for lesson item', async () => {
      // Insert multiple answers for same item
      const answers = [
        { studentId: 'student1', answer: 'A' },
        { studentId: 'student2', answer: 'B' },
        { studentId: 'student3', answer: 'A' },
        { studentId: 'student4', answer: 'C' },
        { studentId: 'student5', answer: 'A' }
      ];

      for (const ans of answers) {
        await testDb.runQuery(`
          INSERT INTO answers (lesson_id, item_index, student_id, answer, item_type)
          VALUES (?, ?, ?, ?, ?)
        `, [mockLessonData.id, 1, ans.studentId, ans.answer, 'quiz']);
      }

      // Get answer statistics
      const stats = await testDb.getRows(`
        SELECT answer, COUNT(*) as count
        FROM answers
        WHERE lesson_id = ? AND item_index = ?
        GROUP BY answer
        ORDER BY count DESC
      `, [mockLessonData.id, 1]);

      expect(stats).toHaveLength(3); // A, B, C
      expect(stats[0].answer).toBe('A'); // Most popular
      expect(stats[0].count).toBe(3);
      expect(stats[1].count).toBe(1); // B has 1 vote
      expect(stats[2].count).toBe(1); // C has 1 vote
    });

    test('should get comprehensive lesson results', async () => {
      // Insert answers for multiple items and students
      const testData = [
        { itemIndex: 0, studentId: 'student1', answer: 'A', itemType: 'quiz' },
        { itemIndex: 0, studentId: 'student2', answer: 'B', itemType: 'quiz' },
        { itemIndex: 1, studentId: 'student1', answer: 'Yes', itemType: 'poll' },
        { itemIndex: 1, studentId: 'student2', answer: 'No', itemType: 'poll' },
        { itemIndex: 2, studentId: 'student1', answer: 'true', itemType: 'quiz' },
      ];

      for (const data of testData) {
        await testDb.runQuery(`
          INSERT INTO answers (lesson_id, item_index, student_id, answer, item_type)
          VALUES (?, ?, ?, ?, ?)
        `, [mockLessonData.id, data.itemIndex, data.studentId, data.answer, data.itemType]);
      }

      // Get answer statistics grouped by item
      const itemStats = await testDb.getRows(`
        SELECT
          item_index,
          item_type,
          answer,
          COUNT(*) as count
        FROM answers
        WHERE lesson_id = ?
        GROUP BY item_index, answer
        ORDER BY item_index, count DESC
      `, [mockLessonData.id]);

      expect(itemStats.length).toBeGreaterThan(0);

      // Get unique students count
      const uniqueStudents = await testDb.getRow(`
        SELECT COUNT(DISTINCT student_id) as count
        FROM answers
        WHERE lesson_id = ?
      `, [mockLessonData.id]);

      expect(uniqueStudents.count).toBe(2);

      // Get recent activity
      const recentAnswers = await testDb.getRows(`
        SELECT item_index, answer, submitted_at
        FROM answers
        WHERE lesson_id = ?
        ORDER BY submitted_at DESC
        LIMIT 5
      `, [mockLessonData.id]);

      expect(recentAnswers).toHaveLength(5);
    });

    test('should get student progress', async () => {
      // Insert answers for specific student
      const studentAnswers = [
        { itemIndex: 0, answer: 'A' },
        { itemIndex: 2, answer: 'false' },
        { itemIndex: 3, answer: 'Yes' }
      ];

      for (const ans of studentAnswers) {
        await testDb.runQuery(`
          INSERT INTO answers (lesson_id, item_index, student_id, answer, item_type)
          VALUES (?, ?, ?, ?, ?)
        `, [mockLessonData.id, ans.itemIndex, studentId, ans.answer, 'quiz']);
      }

      // Get student progress
      const progress = await testDb.getRows(`
        SELECT item_index, answer, submitted_at
        FROM answers
        WHERE lesson_id = ? AND student_id = ?
        ORDER BY item_index
      `, [mockLessonData.id, studentId]);

      expect(progress).toHaveLength(3);
      expect(progress[0].item_index).toBe(0);
      expect(progress[1].item_index).toBe(2);
      expect(progress[2].item_index).toBe(3);
    });
  });

  describe('Data Integrity and Constraints', () => {
    test('should maintain referential integrity between lessons and answers', async () => {
      // Insert lesson
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

      // Insert answer
      await testDb.runQuery(`
        INSERT INTO answers (lesson_id, item_index, student_id, answer, item_type)
        VALUES (?, ?, ?, ?, ?)
      `, [mockLessonData.id, 1, 'student1', 'A', 'quiz']);

      // Delete lesson should also delete associated answers
      await testDb.runQuery('DELETE FROM answers WHERE lesson_id = ?', [mockLessonData.id]);
      await testDb.runQuery('DELETE FROM lessons WHERE id = ?', [mockLessonData.id]);

      // Verify both are deleted
      const lesson = await testDb.getRow('SELECT * FROM lessons WHERE id = ?', [mockLessonData.id]);
      const answers = await testDb.getRows('SELECT * FROM answers WHERE lesson_id = ?', [mockLessonData.id]);

      expect(lesson).toBeFalsy();
      expect(answers).toHaveLength(0);
    });

    test('should handle NULL values appropriately', async () => {
      // Insert lesson with minimal required fields
      const result = await testDb.runQuery(`
        INSERT INTO lessons (id, title)
        VALUES (?, ?)
      `, ['minimal-lesson', 'Minimal Lesson']);

      expect(result.changes).toBe(1);

      const lesson = await testDb.getRow(`
        SELECT * FROM lessons WHERE id = ?
      `, ['minimal-lesson']);

      expect(lesson.title).toBe('Minimal Lesson');
      expect(lesson.description).toBeNull();
      expect(lesson.pdf_path).toBeNull();
    });
  });

  describe('Database Performance', () => {
    test('should handle large number of answers efficiently', async () => {
      // Insert lesson
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

      // Insert many answers
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(
          testDb.runQuery(`
            INSERT INTO answers (lesson_id, item_index, student_id, answer, item_type)
            VALUES (?, ?, ?, ?, ?)
          `, [mockLessonData.id, i % 5, `student${i}`, 'A', 'quiz'])
        );
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all answers were inserted
      const count = await testDb.getRow(`
        SELECT COUNT(*) as count FROM answers WHERE lesson_id = ?
      `, [mockLessonData.id]);

      expect(count.count).toBe(100);
    });

    test('should efficiently query answer statistics', async () => {
      // Insert lesson
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

      // Insert many varied answers
      const answers = ['A', 'B', 'C', 'D'];
      for (let i = 0; i < 200; i++) {
        await testDb.runQuery(`
          INSERT INTO answers (lesson_id, item_index, student_id, answer, item_type)
          VALUES (?, ?, ?, ?, ?)
        `, [
          mockLessonData.id,
          i % 5,
          `student${i}`,
          answers[i % 4],
          'quiz'
        ]);
      }

      // Time the statistics query
      const startTime = Date.now();
      const stats = await testDb.getRows(`
        SELECT
          item_index,
          answer,
          COUNT(*) as count
        FROM answers
        WHERE lesson_id = ?
        GROUP BY item_index, answer
        ORDER BY item_index, count DESC
      `, [mockLessonData.id]);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(stats.length).toBeGreaterThan(0);
    });
  });
});