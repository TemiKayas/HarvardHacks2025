import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize Gemini with API key from environment
const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    if (!ai) {
      return NextResponse.json({ 
        error: 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.' 
      }, { status: 500 });
    }

    const { action, content, files, details } = await request.json();

    switch (action) {
      case 'generateTitle':
        return await generateTitle(content);
      case 'generateQuiz':
        return await generateQuiz(content, details);
      case 'generateSummary':
        return await generateSummary(content, details);
      case 'extractKeyPoints':
        return await extractKeyPoints(content, details);
      case 'generateSlides':
        return await generateSlides(content, details);
      case 'chat':
        return await chatWithGemini(content, details);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

async function generateTitle(content: string) {
  try {
    const prompt = `Based on the following content, generate a concise and informative lesson title (maximum 50 characters). The title should capture the main subject or topic:

${content}

Return only the title text, no quotes or additional formatting.`;

    const response = await ai!.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    return NextResponse.json({ title: response.text.trim() });
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
  }
}

async function generateQuiz(content: string, details: string) {
  const mcqQuestionSchema = {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING, description: "The multiple choice question text" },
      type: { type: Type.STRING, enum: ["MCQ"], description: "Question type - always MCQ" },
      answerA: { type: Type.STRING, description: "First answer option" },
      answerB: { type: Type.STRING, description: "Second answer option" },
      answerC: { type: Type.STRING, description: "Third answer option" },
      answerD: { type: Type.STRING, description: "Fourth answer option" },
      correctAnswer: { type: Type.STRING, enum: ["A", "B", "C", "D"], description: "The correct answer letter" },
      explanation: { type: Type.STRING, description: "Brief explanation of why the answer is correct" }
    },
    required: ["question", "type", "answerA", "answerB", "answerC", "answerD", "correctAnswer", "explanation"]
  };

  const tfQuestionSchema = {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING, description: "The true/false question text" },
      type: { type: Type.STRING, enum: ["TF"], description: "Question type - always TF" },
      correctAnswer: { type: Type.STRING, enum: ["true", "false"], description: "The correct answer - true or false" },
      explanation: { type: Type.STRING, description: "Brief explanation of why the answer is correct" }
    },
    required: ["question", "type", "correctAnswer", "explanation"]
  };

  const quizSchema = {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        items: { oneOf: [mcqQuestionSchema, tfQuestionSchema] }
      }
    },
    required: ["questions"]
  };

  const prompt = `Generate quiz questions based on the following content. ${details ? `Additional requirements: ${details}` : ''}

Content:
${content}

Include both multiple choice and true/false questions. Mix them evenly. Generate questions ONLY about the content provided.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: quizSchema
    }
  });

  try {
    const quiz = JSON.parse(response.text);
    return NextResponse.json({ quiz: quiz.questions });
  } catch (parseError) {
    console.error('Error parsing quiz response:', parseError);
    console.error('Response text:', response.text);
    return NextResponse.json({ error: 'Failed to parse quiz response' }, { status: 500 });
  }
}

async function generateSummary(content: string, details: string) {
  const prompt = `Generate a comprehensive summary of the following content. ${details ? `Additional requirements: ${details}` : ''}

Content:
${content}

Provide a well-structured summary that captures the key points and main ideas.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
  });

  return NextResponse.json({ summary: response.text });
}

async function extractKeyPoints(content: string, details: string) {
  const prompt = `Extract the key points from the following content. ${details ? `Additional requirements: ${details}` : ''}

Content:
${content}

Provide a bulleted list of the most important points, concepts, and takeaways.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
  });

  return NextResponse.json({ keyPoints: response.text });
}

async function generateSlides(content: string, details: string) {
  const slideSchema = {
    type: Type.OBJECT,
    properties: {
      slides: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Slide title" },
            content: { type: Type.STRING, description: "Slide content/bullet points" }
          },
          required: ["title", "content"]
        }
      }
    },
    required: ["slides"]
  };

  const prompt = `Create lecture slides based on the following content. ${details ? `Additional requirements: ${details}` : ''}

Content:
${content}

Generate slides that would be suitable for a presentation, with clear titles and organized content.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: slideSchema
    }
  });

  const slides = JSON.parse(response.text);
  return NextResponse.json({ slides: slides.slides });
}

async function chatWithGemini(content: string, details: string) {
  const prompt = `You are an AI assistant helping with educational content. ${details ? `Context: ${details}` : ''}

User message: ${content}

Provide a helpful response that assists with educational content creation and modification.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
  });

  return NextResponse.json({ response: response.text });
}
