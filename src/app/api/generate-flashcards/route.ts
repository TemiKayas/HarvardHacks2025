import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { extractedText, details = '' } = await request.json();

    if (!extractedText) {
      return NextResponse.json({ error: 'No text content provided' }, { status: 400 });
    }

    console.log(`Generating flashcards from ${extractedText.length} characters of text`);

    // Initialize Gemini
    const apiKeyPath = path.join(process.cwd(), 'src', 'key.api');
    const apiKey = fs.readFileSync(apiKeyPath, "utf8").trim();
    const ai = new GoogleGenAI({ apiKey });

    // Define flashcard schema
    const flashcardSchema = {
      type: Type.OBJECT,
      properties: {
        flashcards: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: {
                type: Type.STRING,
                description: "Question or term on the front of the flashcard"
              },
              back: {
                type: Type.STRING,
                description: "Answer or definition on the back of the flashcard"
              }
            },
            required: ["front", "back"]
          }
        }
      },
      required: ["flashcards"]
    };

    const prompt = `
Generate educational flashcards from the following content.

${details ? `Additional requirements: ${details}` : 'Create 10-15 flashcards covering the key concepts.'}

Content:
${extractedText}

Create flashcards that help students learn and memorize important concepts, definitions, and facts.
Each flashcard should have a clear question/term on the front and a concise answer/definition on the back.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: flashcardSchema,
      },
    });

    const flashcards = JSON.parse(response.text);

    return NextResponse.json({
      success: true,
      flashcards: flashcards.flashcards
    });

  } catch (error) {
    console.error('Error generating flashcards:', error);
    return NextResponse.json({
      error: 'Failed to generate flashcards',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
