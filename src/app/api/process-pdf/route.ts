import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDFData } from '../../components/pdf-processor.js';

export async function POST(request: NextRequest) {
  try {
    const { pdfBase64, fileName } = await request.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: 'No PDF data provided' }, { status: 400 });
    }

    console.log(`Processing PDF: ${fileName || 'unknown'}`);

    // Extract text from base64 PDF
    const extractedText = await extractTextFromPDFData(pdfBase64);

    if (!extractedText || extractedText.length === 0) {
      return NextResponse.json({
        error: 'No text could be extracted from PDF'
      }, { status: 400 });
    }

    console.log(`✅ Successfully extracted ${extractedText.length} characters from ${fileName}`);

    return NextResponse.json({
      success: true,
      extractedText,
      metadata: {
        fileName: fileName || 'unknown',
        textLength: extractedText.length,
      }
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({
      error: 'Failed to process PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
