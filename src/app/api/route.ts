import { NextRequest, NextResponse } from 'next/server';
import { generateHTMLQuiz } from '@/src/app/components/quiz-to-html';
import { analyzeContent } from '@/src/app/components/content-analyzer';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { content, numQuestions = 5 } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    // Analyze content
    const analysis = await analyzeContent(content);
    
    // Generate HTML quiz
    const htmlQuiz = await generateHTMLQuiz(numQuestions, content);

    // Create quiz-output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'src', 'app', 'temp', 'quiz-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save HTML file
    const filename = `quiz-${Date.now()}.html`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, htmlQuiz);

    return NextResponse.json({
      success: true,
      quizPath: `/temp/quiz-output/${filename}`,
      analysis: analysis
    });

  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
