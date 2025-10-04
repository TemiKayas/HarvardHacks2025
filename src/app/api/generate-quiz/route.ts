import { NextRequest, NextResponse } from 'next/server';
import { analyzeText } from '@/src/app/components/content-analyzer';
import { generateQuiz } from '@/src/app/components/simple-quiz-generator';

export async function POST(request: NextRequest) {
  try {
    const { extractedText, numQuestions = 5 } = await request.json();

    if (!extractedText) {
      return NextResponse.json({ error: 'No text content provided' }, { status: 400 });
    }

    console.log(`Generating quiz from ${extractedText.length} characters of text`);

    // Analyze the content
    const analysis = analyzeText(extractedText);
    console.log('Content analysis:', analysis);

    // Generate quiz using the extracted text
    const quizResult = await generateQuiz(numQuestions, extractedText);

    if (quizResult.status === 'error') {
      return NextResponse.json({
        error: 'Failed to generate quiz',
        details: quizResult.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      quiz: quizResult.quiz,
      analysis: analysis,
      metadata: quizResult.metadata
    });

  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json({
      error: 'Failed to generate quiz',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
