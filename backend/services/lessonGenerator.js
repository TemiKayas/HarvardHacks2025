import { GoogleGenAI, Type } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read API key from AI directory
const apiKeyPath = path.join(__dirname, '../../AI/felix.api');

class LessonGenerator {
  constructor() {
    try {
      const apiKey = fs.readFileSync(apiKeyPath, 'utf8').trim();
      this.ai = new GoogleGenAI({ apiKey });
    } catch (error) {
      console.error('Failed to initialize Gemini API:', error);
      throw new Error('Gemini API key not found. Make sure felix.api exists in the AI directory.');
    }
  }

  async generateLessonPlan(pdfPath, numItems = 8) {
    try {
      // Read PDF file
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');

      // Define schemas for different item types
      const textItemSchema = {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["text"] },
          content: { type: Type.STRING },
          title: { type: Type.STRING }
        },
        required: ["type", "content", "title"]
      };

      const quizMCQItemSchema = {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["quiz"] },
          questionType: { type: Type.STRING, enum: ["MCQ"] },
          question: { type: Type.STRING },
          answerA: { type: Type.STRING },
          answerB: { type: Type.STRING },
          answerC: { type: Type.STRING },
          answerD: { type: Type.STRING },
          correctAnswer: { type: Type.STRING, enum: ["A", "B", "C", "D"] },
          explanation: { type: Type.STRING }
        },
        required: ["type", "questionType", "question", "answerA", "answerB", "answerC", "answerD", "correctAnswer", "explanation"]
      };

      const quizTFItemSchema = {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["quiz"] },
          questionType: { type: Type.STRING, enum: ["TF"] },
          question: { type: Type.STRING },
          correctAnswer: { type: Type.STRING, enum: ["true", "false"] },
          explanation: { type: Type.STRING }
        },
        required: ["type", "questionType", "question", "correctAnswer", "explanation"]
      };

      const poll2ItemSchema = {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["poll"] },
          pollType: { type: Type.STRING, enum: ["POLL_2"] },
          question: { type: Type.STRING },
          optionA: { type: Type.STRING },
          optionB: { type: Type.STRING }
        },
        required: ["type", "pollType", "question", "optionA", "optionB"]
      };

      const poll4ItemSchema = {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["poll"] },
          pollType: { type: Type.STRING, enum: ["POLL_4"] },
          question: { type: Type.STRING },
          optionA: { type: Type.STRING },
          optionB: { type: Type.STRING },
          optionC: { type: Type.STRING },
          optionD: { type: Type.STRING }
        },
        required: ["type", "pollType", "question", "optionA", "optionB", "optionC", "optionD"]
      };

      const lessonPlanSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            minItems: numItems,
            maxItems: numItems,
            items: {
              oneOf: [
                textItemSchema,
                quizMCQItemSchema,
                quizTFItemSchema,
                poll2ItemSchema,
                poll4ItemSchema
              ]
            }
          }
        },
        required: ["title", "description", "items"]
      };

      const prompt = `
Create a comprehensive lesson plan with EXACTLY ${numItems} items based on the PDF document provided.

The lesson plan should include a mix of:
1. TEXT items: Informational paragraphs explaining key concepts
2. QUIZ items: Both MCQ and TF questions to test understanding
3. POLL items: Engagement questions for vibe checks (POLL_2 or POLL_4)

STRUCTURE GUIDELINES:
- Start with text to introduce concepts
- Follow with polls to gauge understanding
- Use quizzes to test specific knowledge
- Text items should provide context for following questions
- Mix item types thoughtfully for good lesson flow
- Ensure all content is based ONLY on the PDF document

Create a well-structured lesson plan that flows logically through the material.
`;

      const contents = [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBase64
          }
        }
      ];

      console.log(`🤖 Generating lesson plan with ${numItems} items...`);
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: lessonPlanSchema
        }
      });

      const lessonPlan = JSON.parse(response.text);

      return {
        status: 'success',
        timestamp: new Date().toISOString(),
        lessonPlan: lessonPlan,
        metadata: {
          pdfSize: pdfBuffer.length,
          numItemsRequested: numItems,
          actualItemsGenerated: lessonPlan.items.length,
          itemTypes: lessonPlan.items.reduce((acc, item) => {
            const key = item.type === 'quiz' ? `${item.type}_${item.questionType}` :
                       item.type === 'poll' ? `${item.type}_${item.pollType}` : item.type;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {})
        }
      };

    } catch (error) {
      console.error('❌ Error generating lesson plan:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async generateQuiz(pdfPath, numQuestions = 5) {
    // Implementation similar to lesson plan but focused only on quiz items
    // This is a simplified version for standalone quiz generation
    try {
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');

      // Simplified schema for quiz-only generation
      const quizSchema = {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            minItems: numQuestions,
            maxItems: numQuestions,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["MCQ", "TF"] },
                answerA: { type: Type.STRING },
                answerB: { type: Type.STRING },
                answerC: { type: Type.STRING },
                answerD: { type: Type.STRING },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["question", "type", "correctAnswer", "explanation"]
            }
          }
        },
        required: ["questions"]
      };

      const prompt = `Generate ${numQuestions} quiz questions from the PDF. Mix MCQ and TF questions.`;

      const contents = [
        { text: prompt },
        { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } }
      ];

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: quizSchema
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw error;
    }
  }
}

export default LessonGenerator;