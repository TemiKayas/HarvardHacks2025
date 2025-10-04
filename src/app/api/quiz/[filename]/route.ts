import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    const filepath = path.join(process.cwd(), 'src', 'app', 'components', 'quiz-output', filename);
    
    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const htmlContent = fs.readFileSync(filepath, 'utf-8');
    
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Error serving quiz:', error);
    return NextResponse.json({ error: 'Failed to serve quiz' }, { status: 500 });
  }
}
