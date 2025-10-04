import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export async function POST(request: NextRequest) {
  try {
    console.log('PDF processing request received');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('File received:', { name: file.name, type: file.type, size: file.size });

    if (file.type !== 'application/pdf') {
      console.error('File is not a PDF:', file.type);
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('Processing PDF with buffer size:', buffer.length);
    const data = await pdf(buffer);
    
    console.log('PDF processed successfully:', { 
      textLength: data.text.length, 
      pages: data.numpages,
      hasText: data.text.trim().length > 0 
    });
    
    return NextResponse.json({ 
      content: data.text,
      pages: data.numpages,
      info: data.info 
    });
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ 
      error: 'Failed to process PDF' 
    }, { status: 500 });
  }
}
