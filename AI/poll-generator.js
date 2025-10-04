import { GoogleGenAI, Type } from "@google/genai";
import fs from 'fs';

// Hardcoded PDF content for testing
const HARDCODED_PDF_TEXT = `
Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines that can think and learn like humans. AI systems can be categorized into two main types: narrow AI and general AI.

Narrow AI, also known as weak AI, is designed to perform specific tasks such as image recognition, language translation, or playing chess. Examples include virtual assistants like Siri and Alexa, recommendation systems used by Netflix and Amazon, and autonomous vehicles.

General AI, also known as strong AI or artificial general intelligence (AGI), refers to machines that possess human-level intelligence across all domains. This type of AI does not yet exist and remains a goal for future research.

Machine learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed. The three main types of machine learning are supervised learning, unsupervised learning, and reinforcement learning.

Deep learning is a subset of machine learning that uses artificial neural networks with multiple layers to analyze and learn from large amounts of data. Deep learning has been particularly successful in areas such as computer vision, natural language processing, and speech recognition.

The development of AI has raised important ethical considerations, including concerns about job displacement, privacy, bias in algorithms, and the potential for autonomous weapons systems.
`;

async function generatePoll(numOptions = 4) {
  try {
    // Initialize Gemini
    const apiKey = fs.readFileSync('./felix.api', 'utf8').trim();
    const ai = new GoogleGenAI({ apiKey });

    // Define poll schema for 2 options
    const poll2OptionsSchema = {
      type: Type.OBJECT,
      properties: {
        question: {
          type: Type.STRING,
          description: "The poll question for audience to respond to"
        },
        type: {
          type: Type.STRING,
          enum: ["POLL_2"],
          description: "Poll type with 2 options"
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
      required: ["question", "type", "optionA", "optionB"],
      propertyOrdering: ["question", "type", "optionA", "optionB"]
    };

    // Define poll schema for 4 options
    const poll4OptionsSchema = {
      type: Type.OBJECT,
      properties: {
        question: {
          type: Type.STRING,
          description: "The poll question for audience to respond to"
        },
        type: {
          type: Type.STRING,
          enum: ["POLL_4"],
          description: "Poll type with 4 options"
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
      required: ["question", "type", "optionA", "optionB", "optionC", "optionD"],
      propertyOrdering: ["question", "type", "optionA", "optionB", "optionC", "optionD"]
    };

    // Choose schema based on number of options
    const pollSchema = numOptions === 2 ? poll2OptionsSchema : poll4OptionsSchema;
    const pollType = numOptions === 2 ? "POLL_2" : "POLL_4";

    const prompt = `
Create a single poll question based on the following text content.
This is for a lecture hall "vibe check" - NOT a graded quiz.
The poll should gauge student understanding, opinions, or engagement with the material.

Poll requirements:
- Generate a ${pollType} question (${numOptions} options)
- type: "${pollType}"
- question: An engaging poll question for students
- ${numOptions === 2 ? 'optionA, optionB: Two different response options' : 'optionA, optionB, optionC, optionD: Four different response options'}
- Options should be reasonable choices students might select
- This is NOT graded, so options don't need to have a "correct" answer
- Focus on gauging student sentiment, understanding level, or preferences

Examples of good poll questions:
- "How familiar are you with AI before this lecture?"
- "Which AI application interests you most?"
- "How confident do you feel about the difference between narrow and general AI?"
- "Which ethical concern about AI worries you most?"

Based on this content, create an engaging poll:
${HARDCODED_PDF_TEXT}
`;

    console.log(`🗳️ Generating ${numOptions}-option poll with Gemini...`);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: pollSchema
      }
    });

    const poll = JSON.parse(response.text);
    return {
      status: 'success',
      timestamp: new Date().toISOString(),
      poll: poll,
      metadata: {
        pdfTextLength: HARDCODED_PDF_TEXT.length,
        pollType: pollType,
        numOptions: numOptions
      }
    };

  } catch (error) {
    console.error('❌ Error generating poll:', error);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

export { generatePoll };