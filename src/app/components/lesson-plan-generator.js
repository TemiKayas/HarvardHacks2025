import { GoogleGenAI, Type } from "@google/genai";
import fs from 'fs';

async function generateLessonPlan(numItems = 10) {
  try {
    // Initialize Gemini
    const apiKey = fs.readFileSync('./key.api', 'utf8').trim();
    const ai = new GoogleGenAI({ apiKey });

    // Read PDF file
    const pdfBuffer = fs.readFileSync('./input.pdf');
    const pdfBase64 = pdfBuffer.toString('base64');

    // Define schema for text items
    const textItemSchema = {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ["text"],
          description: "Item type - always text"
        },
        content: {
          type: Type.STRING,
          description: "A paragraph of information about what the lecture is currently discussing"
        },
        title: {
          type: Type.STRING,
          description: "Brief title or heading for this text section"
        }
      },
      required: ["type", "content", "title"],
      propertyOrdering: ["type", "title", "content"]
    };

    // Define schema for quiz items (MCQ questions)
    const quizMCQItemSchema = {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ["quiz"],
          description: "Item type - always quiz"
        },
        questionType: {
          type: Type.STRING,
          enum: ["MCQ"],
          description: "Quiz question type - MCQ"
        },
        question: {
          type: Type.STRING,
          description: "The multiple choice question text"
        },
        answerA: {
          type: Type.STRING,
          description: "First answer option"
        },
        answerB: {
          type: Type.STRING,
          description: "Second answer option"
        },
        answerC: {
          type: Type.STRING,
          description: "Third answer option"
        },
        answerD: {
          type: Type.STRING,
          description: "Fourth answer option"
        },
        correctAnswer: {
          type: Type.STRING,
          enum: ["A", "B", "C", "D"],
          description: "The correct answer letter"
        },
        explanation: {
          type: Type.STRING,
          description: "Brief explanation of why the answer is correct"
        }
      },
      required: ["type", "questionType", "question", "answerA", "answerB", "answerC", "answerD", "correctAnswer", "explanation"],
      propertyOrdering: ["type", "questionType", "question", "answerA", "answerB", "answerC", "answerD", "correctAnswer", "explanation"]
    };

    // Define schema for quiz items (True/False questions)
    const quizTFItemSchema = {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ["quiz"],
          description: "Item type - always quiz"
        },
        questionType: {
          type: Type.STRING,
          enum: ["TF"],
          description: "Quiz question type - TF"
        },
        question: {
          type: Type.STRING,
          description: "The true/false question text"
        },
        correctAnswer: {
          type: Type.STRING,
          enum: ["true", "false"],
          description: "The correct answer - true or false"
        },
        explanation: {
          type: Type.STRING,
          description: "Brief explanation of why the answer is correct"
        }
      },
      required: ["type", "questionType", "question", "correctAnswer", "explanation"],
      propertyOrdering: ["type", "questionType", "question", "correctAnswer", "explanation"]
    };

    // Define schema for poll items (2 options)
    const poll2ItemSchema = {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ["poll"],
          description: "Item type - always poll"
        },
        pollType: {
          type: Type.STRING,
          enum: ["POLL_2"],
          description: "Poll type with 2 options"
        },
        question: {
          type: Type.STRING,
          description: "The poll question for audience to respond to"
        },
        optionA: {
          type: Type.STRING,
          description: "First poll option"
        },
        optionB: {
          type: Type.STRING,
          description: "Second poll option"
        }
      },
      required: ["type", "pollType", "question", "optionA", "optionB"],
      propertyOrdering: ["type", "pollType", "question", "optionA", "optionB"]
    };

    // Define schema for poll items (4 options)
    const poll4ItemSchema = {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ["poll"],
          description: "Item type - always poll"
        },
        pollType: {
          type: Type.STRING,
          enum: ["POLL_4"],
          description: "Poll type with 4 options"
        },
        question: {
          type: Type.STRING,
          description: "The poll question for audience to respond to"
        },
        optionA: {
          type: Type.STRING,
          description: "First poll option"
        },
        optionB: {
          type: Type.STRING,
          description: "Second poll option"
        },
        optionC: {
          type: Type.STRING,
          description: "Third poll option"
        },
        optionD: {
          type: Type.STRING,
          description: "Fourth poll option"
        }
      },
      required: ["type", "pollType", "question", "optionA", "optionB", "optionC", "optionD"],
      propertyOrdering: ["type", "pollType", "question", "optionA", "optionB", "optionC", "optionD"]
    };

    // Main lesson plan schema
    const lessonPlanSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "Title of the lesson plan based on PDF content"
        },
        description: {
          type: Type.STRING,
          description: "Brief description of what this lesson plan covers"
        },
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
      required: ["title", "description", "items"],
      propertyOrdering: ["title", "description", "items"]
    };

    const prompt = `
Create a comprehensive lesson plan with EXACTLY ${numItems} items based on the PDF document provided.

The lesson plan should include a mix of:
1. TEXT items: Informational paragraphs explaining key concepts
2. QUIZ items: Both MCQ and TF questions to test understanding
3. POLL items: Engagement questions for vibe checks (POLL_2 or POLL_4)

ITEM TYPES:

1. TEXT items:
   - type: "text"
   - title: Brief heading for the section
   - content: A paragraph explaining key concepts from the PDF

2. QUIZ items (MCQ):
   - type: "quiz"
   - questionType: "MCQ"
   - question, answerA-D, correctAnswer, explanation

3. QUIZ items (TF):
   - type: "quiz"
   - questionType: "TF"
   - question, correctAnswer, explanation

4. POLL items (2 options):
   - type: "poll"
   - pollType: "POLL_2"
   - question, optionA, optionB

5. POLL items (4 options):
   - type: "poll"
   - pollType: "POLL_4"
   - question, optionA-D

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

    console.log(`📚 Generating lesson plan with ${numItems} items using PDF input...`);
    const response = await ai.models.generateContent({
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

export { generateLessonPlan };