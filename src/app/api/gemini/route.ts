import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import pdf from 'pdf-parse';

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
      case 'submitQuiz':
        return await submitQuizResponse(request);
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
    console.log('Generating title with content length:', content.length);
    console.log('Content preview:', content.substring(0, 200) + '...');
    
    const prompt = `Based on the following content, generate a concise and informative lesson title (maximum 50 characters). The title should capture the main subject or topic:

${content}

Return only the title text, no quotes or additional formatting.`;

    const response = await ai!.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    const title = response.text.trim();
    console.log('Generated title:', title);
    
    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
  }
}

async function generateQuiz(content: string, details: string) {
  try {
    console.log('Generating quiz with content length:', content.length);
    console.log('Content preview:', content.substring(0, 200) + '...');
    console.log('Details:', details);
    
    const prompt = `Generate a mobile-friendly quiz in HTML format based on the following content. ${details ? `Additional requirements: ${details}` : ''}

Content:
${content}

Requirements:
1. Generate EXACTLY 5-8 quiz questions based ONLY on the provided content
2. Include both multiple choice and true/false questions (mix them evenly)
3. Return ONLY HTML code that will be displayed in a mobile viewport
4. The HTML should include:
   - A title at the top
   - Each question with proper form elements (radio buttons for MCQ, radio buttons for T/F, text inputs for fill-in)
   - A student name input field
   - A submit button at the bottom
   - Proper mobile styling with responsive design
5. Use semantic HTML with proper form structure
6. Include data attributes for question IDs and correct answers for grading
7. Style it to look clean and professional on mobile devices

Return ONLY the HTML code, no explanations or additional text.`;

    const response = await ai!.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    const htmlContent = response.text.trim();
    console.log('Generated HTML content length:', htmlContent.length);
    console.log('HTML preview:', htmlContent.substring(0, 200) + '...');

    return NextResponse.json({ 
      htmlContent,
      quiz: [] // Keep for backward compatibility
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
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

async function submitQuizResponse(request: NextRequest) {
  try {
    const { classId, studentName, answers } = await request.json();
    
    // Calculate score based on correct answers
    // This would need to be implemented based on the quiz structure
    const score = Math.floor(Math.random() * 40) + 60; // Placeholder scoring
    
    const response = {
      studentName,
      answers,
      timestamp: new Date().toISOString(),
      score
    };
    
    return NextResponse.json({ 
      success: true, 
      response,
      message: 'Quiz submitted successfully!' 
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}
