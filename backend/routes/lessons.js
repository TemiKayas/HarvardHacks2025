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

// Get all lessons
router.get('/', async (req, res) => {
  try {
    const { getRows } = getDbFunctions(req);
    const lessons = await getRows(`
      SELECT id, title, description, created_at, is_active
      FROM lessons
      ORDER BY created_at DESC
    `);
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Get specific lesson with full data
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { getRow } = getDbFunctions(req);
    const lesson = await getRow(`
      SELECT * FROM lessons WHERE id = ?
    `, [id]);

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Parse lesson plan JSON
    const lessonData = {
      ...lesson,
      lesson_plan: lesson.lesson_plan ? JSON.parse(lesson.lesson_plan) : null
    };

    res.json(lessonData);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// Create new lesson
router.post('/', async (req, res) => {
  try {
    const { id, title, description, pdfPath, lessonPlan } = req.body;
    const { runQuery } = getDbFunctions(req);

    await runQuery(`
      INSERT INTO lessons (id, title, description, pdf_path, lesson_plan)
      VALUES (?, ?, ?, ?, ?)
    `, [id, title, description, pdfPath, JSON.stringify(lessonPlan)]);

    res.status(201).json({
      message: 'Lesson created successfully',
      id: id
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

// Update lesson active status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const { runQuery } = getDbFunctions(req);

    // First, deactivate all other lessons if activating this one
    if (isActive) {
      await runQuery('UPDATE lessons SET is_active = 0');
    }

    await runQuery(`
      UPDATE lessons SET is_active = ? WHERE id = ?
    `, [isActive ? 1 : 0, id]);

    res.json({
      message: `Lesson ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error updating lesson status:', error);
    res.status(500).json({ error: 'Failed to update lesson status' });
  }
});

// Delete lesson
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { runQuery } = getDbFunctions(req);

    // Delete associated answers first
    await runQuery('DELETE FROM answers WHERE lesson_id = ?', [id]);

    // Delete the lesson
    const result = await runQuery('DELETE FROM lessons WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

export default router;