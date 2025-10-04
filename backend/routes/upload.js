import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import LessonGenerator from '../services/lessonGenerator.js';
import QRGenerator from '../services/qrGenerator.js';
import { runQuery } from '../database/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Upload PDF and generate lesson
router.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const { numItems = 8 } = req.body;
    const lessonId = uuidv4();
    const pdfPath = req.file.path;

    console.log(`📁 Processing PDF: ${req.file.originalname}`);
    console.log(`🔄 Generating lesson with ${numItems} items...`);

    // Generate lesson plan using AI
    const lessonGenerator = new LessonGenerator();
    const result = await lessonGenerator.generateLessonPlan(pdfPath, parseInt(numItems));

    if (result.status !== 'success') {
      return res.status(500).json({
        error: 'Failed to generate lesson plan',
        details: result.error
      });
    }

    const { lessonPlan, metadata } = result;

    // Generate QR code
    const baseURL = `${req.protocol}://${req.get('host')}`;
    const lessonURL = QRGenerator.generateLessonURL(baseURL, lessonId);
    const qrResult = await QRGenerator.generateQRCode(lessonURL);

    if (!qrResult.success) {
      console.warn('Failed to generate QR code:', qrResult.error);
    }

    // Store lesson in database
    await runQuery(`
      INSERT INTO lessons (id, title, description, pdf_path, lesson_plan)
      VALUES (?, ?, ?, ?, ?)
    `, [
      lessonId,
      lessonPlan.title,
      lessonPlan.description,
      pdfPath,
      JSON.stringify(lessonPlan)
    ]);

    console.log(`✅ Lesson created successfully: ${lessonId}`);

    // Return complete lesson data
    res.status(201).json({
      success: true,
      lesson: {
        id: lessonId,
        title: lessonPlan.title,
        description: lessonPlan.description,
        url: lessonURL,
        qrCode: qrResult.success ? qrResult.dataURL : null,
        itemCount: lessonPlan.items.length,
        metadata: metadata
      },
      message: 'Lesson generated successfully'
    });

  } catch (error) {
    console.error('Error processing PDF upload:', error);

    // Clean up uploaded file if lesson creation failed
    if (req.file) {
      try {
        const fs = await import('fs');
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to clean up uploaded file:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'Failed to process PDF upload',
      message: error.message
    });
  }
});

// Generate QR code for existing lesson
router.get('/qr/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const baseURL = `${req.protocol}://${req.get('host')}`;
    const lessonURL = QRGenerator.generateLessonURL(baseURL, lessonId);

    const qrResult = await QRGenerator.generateQRCode(lessonURL, {
      width: 512 // Larger QR code for standalone requests
    });

    if (!qrResult.success) {
      return res.status(500).json({ error: 'Failed to generate QR code' });
    }

    res.json({
      lessonId,
      url: lessonURL,
      qrCode: qrResult.dataURL
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ error: 'File upload error: ' + error.message });
  }
  next(error);
});

export default router;