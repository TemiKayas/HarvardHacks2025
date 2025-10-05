import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { summaryToHTML } from '@/src/app/components/summary-to-html';
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { extractedText, details = '' } = await request.json();

    if (!extractedText) {
      return NextResponse.json({ error: 'No text content provided' }, { status: 400 });
    }

    console.log(`Generating summary from ${extractedText.length} characters of text`);

    // Initialize Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Please create a concise summary of the following educational content.

${details ? `Additional requirements: ${details}` : ''}

Content to summarize:
${extractedText}

Provide a clear, well-structured summary that captures the main points and key takeaways.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const summary = response.text;

    // Generate HTML and save to disk
    const htmlContent = summaryToHTML(summary);
    const outputDir = path.join(process.cwd(), 'src', 'app', 'temp', 'summary-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `summary-${Date.now()}.html`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, htmlContent);

    console.log(`✅ Summary HTML saved to ${filepath}`);

    return NextResponse.json({
      success: true,
      summary: summary,
      htmlPath: `/temp/summary-output/${filename}`
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({
      error: 'Failed to generate summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
