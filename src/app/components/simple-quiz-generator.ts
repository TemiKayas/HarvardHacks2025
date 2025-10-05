import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import path from "path";

export async function generateQuiz(
    numQuestions: number = 5,
    pdfContent: string | null = null
) {
    try {
        // Initialize Gemini - use absolute path from project root
        const apiKeyPath = path.join(process.cwd(), 'src', 'key.api');
        const apiKey = fs.readFileSync(apiKeyPath, "utf8").trim();
        const ai = new GoogleGenAI({ apiKey });

        // Define distinct schemas for each question type
        const mcqQuestionSchema = {
            type: Type.OBJECT,
            properties: {
                question: {
                    type: Type.STRING,
                    description: "The multiple choice question text",
                },
                type: {
                    type: Type.STRING,
                    enum: ["MCQ"],
                    description: "Question type - always MCQ",
                },
                answerA: {
                    type: Type.STRING,
                    description: "First answer option",
                },
                answerB: {
                    type: Type.STRING,
                    description: "Second answer option",
                },
                answerC: {
                    type: Type.STRING,
                    description: "Third answer option",
                },
                answerD: {
                    type: Type.STRING,
                    description: "Fourth answer option",
                },
                correctAnswer: {
                    type: Type.STRING,
                    enum: ["A", "B", "C", "D"],
                    description: "The correct answer letter",
                },
                explanation: {
                    type: Type.STRING,
                    description: "Brief explanation of why the answer is correct",
                },
            },
            required: [
                "question",
                "type",
                "answerA",
                "answerB",
                "answerC",
                "answerD",
                "correctAnswer",
                "explanation",
            ],
            propertyOrdering: [
                "question",
                "type",
                "answerA",
                "answerB",
                "answerC",
                "answerD",
                "correctAnswer",
                "explanation",
            ],
        };

        const tfQuestionSchema = {
            type: Type.OBJECT,
            properties: {
                question: {
                    type: Type.STRING,
                    description: "The true/false question text",
                },
                type: {
                    type: Type.STRING,
                    enum: ["TF"],
                    description: "Question type - always TF",
                },
                correctAnswer: {
                    type: Type.STRING,
                    enum: ["true", "false"],
                    description: "The correct answer - true or false",
                },
                explanation: {
                    type: Type.STRING,
                    description: "Brief explanation of why the answer is correct",
                },
            },
            required: ["question", "type", "correctAnswer", "explanation"],
            propertyOrdering: ["question", "type", "correctAnswer", "explanation"],
        };

        const quizSchema = {
            type: Type.OBJECT,
            properties: {
                questions: {
                    type: Type.ARRAY,
                    minItems: numQuestions,
                    maxItems: numQuestions,
                    items: {
                        oneOf: [mcqQuestionSchema, tfQuestionSchema],
                    },
                },
            },
            required: ["questions"],
            propertyOrdering: ["questions"],
        };

        // Use provided PDF content or fallback to default content
        const contentToUse =
            pdfContent ||
            `
Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines that can think and learn like humans. AI systems can be categorized into two main types: narrow AI and general AI.

Narrow AI, also known as weak AI, is designed to perform specific tasks such as image recognition, language translation, or playing chess. Examples include virtual assistants like Siri and Alexa, recommendation systems used by Netflix and Amazon, and autonomous vehicles.

General AI, also known as strong AI or artificial general intelligence (AGI), refers to machines that possess human-level intelligence across all domains. This type of AI does not yet exist and remains a goal for future research.

Machine learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed. The three main types of machine learning are supervised learning, unsupervised learning, and reinforcement learning.

Deep learning is a subset of machine learning that uses artificial neural networks with multiple layers to analyze and learn from large amounts of data. Deep learning has been particularly successful in areas such as computer vision, natural language processing, and speech recognition.

The development of AI has raised important ethical considerations, including concerns about job displacement, privacy, bias in algorithms, and the potential for autonomous weapons systems.
`;

        const prompt = `
CRITICAL REQUIREMENT: You MUST generate EXACTLY ${numQuestions} quiz questions. No more, no less. The count MUST be ${numQuestions}.

Generate quiz questions based ONLY on the following text content.
Do not include any content not found in the provided text.
Include both multiple choice and true/false questions (mix them evenly).

COUNT VERIFICATION: Before responding, count your questions and ensure you have EXACTLY ${numQuestions} questions total.

PRIORITY FOCUS: Look for and prioritize the following content types in this order:
1. **In-class activities** - Any exercises, problems, or hands-on activities mentioned
2. **Practice questions** - Any questions, problems, or exercises explicitly stated
3. **Key concepts** - Important definitions, theorems, or principles
4. **Examples** - Specific examples or case studies discussed
5. **General content** - Other important information from the slides

There are TWO DISTINCT question types:

1. MCQ (Multiple Choice Questions):
   - type: "MCQ"
   - question: The question text
   - answerA, answerB, answerC, answerD: Four different answer options (no A), B), C), D) prefixes)
   - correctAnswer: The letter only (A, B, C, or D)
   - explanation: Why the answer is correct
   - ALL 4 answer options must be meaningful and different

2. TF (True/False Questions):
   - type: "TF"
   - question: The question text
   - correctAnswer: either "true" or "false" (as string)
   - explanation: Why the answer is correct
   - NO answer options needed for true/false questions

IMPORTANT: If you find in-class activities, practice questions, or exercises in the content, prioritize creating quiz questions based on those. These are the most valuable for student learning and assessment.

REMINDER: Generate EXACTLY ${numQuestions} questions - count them before submitting.

Generate questions ONLY about the content below:
${contentToUse}
`;

        console.log("🤖 Generating quiz with Gemini using structured output...");
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema,
            },
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const quiz = JSON.parse(response.text);

        return {
            status: "success",
            timestamp: new Date().toISOString(),
            quiz: quiz,
            metadata: {
                pdfTextLength: contentToUse.length,
                numQuestionsRequested: numQuestions,
                actualQuestionsGenerated: quiz.questions.length,
                contentSource: pdfContent ? "provided" : "default",
            },
        };
    } catch (error) {
        console.error("❌ Error generating quiz:", error);
        return {
            status: "error",
            error: error,
            timestamp: new Date().toISOString(),
        };
    }
}
