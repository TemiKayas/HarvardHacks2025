// app/api/generate-quiz/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateQuiz } from '@/AI/simple-quiz-generator';
import { extractTextFromPDF } from '@/AI/pdf-processor';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const numQuestions = parseInt(formData.get('numQuestions') as string) || 5;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Save file temporarily
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFilePath = path.join(tempDir, `${Date.now()}-${file.name}`);
        fs.writeFileSync(tempFilePath, buffer);

        try {
            // Extract text from PDF
            const pdfContent = await extractTextFromPDF(tempFilePath);

            // Generate quiz
            const quizData = await generateQuiz(numQuestions, pdfContent || null);

            // Clean up temp file
            fs.unlinkSync(tempFilePath);

            if (quizData.status === 'error') {
                return NextResponse.json(
                    { error: quizData.error },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                quizData: quizData
            });

        } catch (error) {
            // Clean up temp file on error
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
            throw error;
        }

    } catch (error) {
        console.error('Error generating quiz:', error);
        return NextResponse.json(
            { error: 'Failed to generate quiz', details: error},
            { status: 500 }
        );
    }
}