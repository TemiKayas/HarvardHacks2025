import { generateQuiz } from './simple-quiz-generator.js';

async function main() {
  try {
    console.log('🚀 Starting Direct Gemini Quiz Generator\n');

    // Generate 6 questions (mix of multiple choice and true/false)
    const result = await generateQuiz(6);

    console.log('\n📋 Quiz Generation Complete!\n');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Application error:', error);
  }
}

// Run the application
main();

export { main };