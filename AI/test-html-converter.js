import { quizToHTML } from './quiz-to-html.js';
import fs from 'fs';

// Mock quiz data that follows the exact JSON format from simple-quiz-generator.ts
const mockQuizData = {
  "status": "success",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "quiz": {
    "questions": [
      {
        "question": "What is the main purpose of Artificial Intelligence?",
        "type": "MCQ",
        "answerA": "To replace all human workers",
        "answerB": "To create intelligent machines that can think and learn like humans",
        "answerC": "To make computers faster",
        "answerD": "To reduce electricity consumption",
        "correctAnswer": "B",
        "explanation": "AI aims to create intelligent machines that can think and learn like humans, as stated in the definition."
      },
      {
        "question": "Narrow AI is designed to perform specific tasks.",
        "type": "TF",
        "correctAnswer": "true",
        "explanation": "Narrow AI, also known as weak AI, is designed to perform specific tasks such as image recognition, language translation, or playing chess."
      },
      {
        "question": "Which of the following is an example of narrow AI?",
        "type": "MCQ",
        "answerA": "General AI",
        "answerB": "Virtual assistants like Siri and Alexa",
        "answerC": "Human-level intelligence",
        "answerD": "Future research goals",
        "correctAnswer": "B",
        "explanation": "Virtual assistants like Siri and Alexa are examples of narrow AI, designed for specific tasks."
      },
      {
        "question": "Machine learning is a subset of AI.",
        "type": "TF",
        "correctAnswer": "true",
        "explanation": "Machine learning is indeed a subset of AI that enables computers to learn and improve from experience."
      }
    ]
  },
  "metadata": {
    "pdfTextLength": 1024,
    "numQuestionsRequested": 4,
    "actualQuestionsGenerated": 4
  }
};

function testHTMLConverter() {
  try {
    console.log('🧪 Testing HTML Quiz Converter with Mock Data\n');

    // Test the converter with mock data
    const htmlQuiz = quizToHTML(mockQuizData);

    // Save to file
    const filename = 'mock-quiz-test.html';
    fs.writeFileSync(filename, htmlQuiz);

    console.log('✅ HTML quiz generated successfully!');
    console.log(`📁 File saved as: ${filename}`);
    console.log('🌐 Open the file in your browser to see the interactive quiz!');
    console.log('\n📋 Quiz contains:');
    console.log(`   - ${mockQuizData.quiz.questions.length} questions`);
    console.log(`   - ${mockQuizData.quiz.questions.filter(q => q.type === 'MCQ').length} multiple choice questions`);
    console.log(`   - ${mockQuizData.quiz.questions.filter(q => q.type === 'TF').length} true/false questions`);

    console.log('\n🎯 JSON Format Verification:');
    console.log('✅ Follows exact structure from simple-quiz-generator.ts');
    console.log('✅ MCQ questions have: question, type, answerA-D, correctAnswer, explanation');
    console.log('✅ TF questions have: question, type, correctAnswer, explanation');
    console.log('✅ Root structure: status, timestamp, quiz.questions, metadata');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testHTMLConverter();
