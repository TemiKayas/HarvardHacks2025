import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
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
    const apiKeyPath = path.join(process.cwd(), 'src', 'key.api');
    const apiKey = fs.readFileSync(apiKeyPath, "utf8").trim();
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

    return NextResponse.json({
      success: true,
      summary: summary
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({
      error: 'Failed to generate summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
