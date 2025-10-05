import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { keyPointsToHTML } from '@/src/app/components/keypoints-to-html';
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { extractedText, details = '', numKeyPoints = 10 } = await request.json();

    if (!extractedText) {
      return NextResponse.json({ error: 'No text content provided' }, { status: 400 });
    }

    console.log(`Generating ${numKeyPoints} key points from ${extractedText.length} characters of text`);

    // Initialize Gemini
    const apiKeyPath = path.join(process.cwd(), 'src', 'key.api');
    const apiKey = fs.readFileSync(apiKeyPath, "utf8").trim();
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
CRITICAL REQUIREMENT: You MUST generate EXACTLY ${numKeyPoints} key points. No more, no less. The count MUST be ${numKeyPoints}.

Please extract the key points from the following educational content.

${details ? `Additional requirements: ${details}` : ''}

COUNT VERIFICATION: Before responding, count your key points and ensure you have EXACTLY ${numKeyPoints} key points total.

Content to analyze:
${extractedText}

Format the key points as a bulleted list with clear, concise statements.
DO NOT BOLD ANYTHING, DO NOT HIGHLIGHT ANYTHING, DO NOT ITALICIZE ANYTHING, AS SPECIAL FORMATTING WILL NOT WORK
Focus on the most important concepts, definitions, and takeaways.

REMINDER: Generate EXACTLY ${numKeyPoints} key points - count them before submitting.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const keyPoints = response.text;

    // Generate HTML and save to disk
    const htmlContent = keyPointsToHTML(keyPoints);
    const outputDir = path.join(process.cwd(), 'src', 'app', 'temp', 'keypoints-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `keypoints-${Date.now()}.html`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, htmlContent);

    console.log(`✅ Key points HTML saved to ${filepath}`);

    return NextResponse.json({
      success: true,
      keyPoints: keyPoints,
      htmlPath: `/temp/keypoints-output/${filename}`
    });

  } catch (error) {
    console.error('Error generating key points:', error);
    return NextResponse.json({
      error: 'Failed to generate key points',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
