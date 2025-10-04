import express from 'express';
import { runQuery, getRow, getRows } from '../database/init.js';

const router = express.Router();

// Helper to get database functions (allow test database injection)
function getDbFunctions(req) {
  if (req.testDb) {
    return {
      runQuery: req.testDb.runQuery.bind(req.testDb),
      getRow: req.testDb.getRow.bind(req.testDb),
      getRows: req.testDb.getRows.bind(req.testDb)
    };
  }
  return { runQuery, getRow, getRows };
}

// Submit an answer
router.post('/', async (req, res) => {
  try {
    const {
      lessonId,
      itemIndex,
      itemId,
      studentId,
      answer,
      itemType
    } = req.body;

    // Validate required fields
    if (!lessonId || itemIndex === undefined || !studentId || !answer) {
      return res.status(400).json({
        error: 'Missing required fields: lessonId, itemIndex, studentId, answer'
      });
    }

    const { runQuery, getRow } = getDbFunctions(req);

    // Check if student already answered this item
    const existingAnswer = await getRow(`
      SELECT id FROM answers
      WHERE lesson_id = ? AND item_index = ? AND student_id = ?
    `, [lessonId, itemIndex, studentId]);

    if (existingAnswer) {
      return res.status(409).json({
        error: 'Answer already submitted for this item'
      });
    }

    // Insert the answer
    await runQuery(`
      INSERT INTO answers (lesson_id, item_index, item_id, student_id, answer, item_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [lessonId, itemIndex, itemId || `item_${itemIndex}`, studentId, answer, itemType]);

    res.status(201).json({
      message: 'Answer submitted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Get answers for a specific lesson item (for results)
router.get('/lesson/:lessonId/item/:itemIndex', async (req, res) => {
  try {
    const { lessonId, itemIndex } = req.params;
    const { getRows, getRow } = getDbFunctions(req);

    const answers = await getRows(`
      SELECT answer, COUNT(*) as count
      FROM answers
      WHERE lesson_id = ? AND item_index = ?
      GROUP BY answer
      ORDER BY count DESC
    `, [lessonId, parseInt(itemIndex)]);

    // Also get total responses
    const totalResponses = await getRow(`
      SELECT COUNT(*) as total
      FROM answers
      WHERE lesson_id = ? AND item_index = ?
    `, [lessonId, parseInt(itemIndex)]);

    res.json({
      answers: answers,
      totalResponses: totalResponses?.total || 0,
      itemIndex: parseInt(itemIndex)
    });

  } catch (error) {
    console.error('Error fetching answers:', error);
    res.status(500).json({ error: 'Failed to fetch answers' });
  }
});

// Get all results for a lesson (for professor dashboard)
router.get('/lesson/:lessonId/results', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { getRow, getRows } = getDbFunctions(req);

    // Get lesson info
    const lesson = await getRow(`
      SELECT id, title, lesson_plan FROM lessons WHERE id = ?
    `, [lessonId]);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Get answer statistics for each item
    const answerStats = await getRows(`
      SELECT
        item_index,
        item_type,
        answer,
        COUNT(*) as count
      FROM answers
      WHERE lesson_id = ?
      GROUP BY item_index, answer
      ORDER BY item_index, count DESC
    `, [lessonId]);

    // Get total unique students
    const uniqueStudents = await getRow(`
      SELECT COUNT(DISTINCT student_id) as count
      FROM answers
      WHERE lesson_id = ?
    `, [lessonId]);

    // Get recent activity
    const recentAnswers = await getRows(`
      SELECT item_index, item_type, answer, submitted_at
      FROM answers
      WHERE lesson_id = ?
      ORDER BY submitted_at DESC
      LIMIT 10
    `, [lessonId]);

    // Group answers by item index
    const resultsByItem = {};
    answerStats.forEach(stat => {
      if (!resultsByItem[stat.item_index]) {
        resultsByItem[stat.item_index] = {
          itemIndex: stat.item_index,
          itemType: stat.item_type,
          answers: [],
          totalResponses: 0
        };
      }
      resultsByItem[stat.item_index].answers.push({
        answer: stat.answer,
        count: stat.count
      });
      resultsByItem[stat.item_index].totalResponses += stat.count;
    });

    res.json({
      lesson: {
        id: lesson.id,
        title: lesson.title
      },
      uniqueStudents: uniqueStudents?.count || 0,
      resultsByItem: Object.values(resultsByItem),
      recentActivity: recentAnswers
    });

  } catch (error) {
    console.error('Error fetching lesson results:', error);
    res.status(500).json({ error: 'Failed to fetch lesson results' });
  }
});

// Get student's progress in a lesson
router.get('/lesson/:lessonId/student/:studentId', async (req, res) => {
  try {
    const { lessonId, studentId } = req.params;
    const { getRows } = getDbFunctions(req);

    const answers = await getRows(`
      SELECT item_index, answer, submitted_at
      FROM answers
      WHERE lesson_id = ? AND student_id = ?
      ORDER BY item_index
    `, [lessonId, studentId]);

    res.json({
      studentId,
      lessonId,
      answeredItems: answers.map(a => a.item_index),
      answers: answers
    });

  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({ error: 'Failed to fetch student progress' });
  }
});

export default router;