import { generateHTMLQuiz, quizToHTML } from './quiz-to-html.js';
import { generateQuiz } from './simple-quiz-generator.ts';
import fs from 'fs';

async function testHTMLQuiz() {
  try {
    console.log('🚀 Testing HTML Quiz Generator\n');

    // Method 1: Generate quiz and convert to HTML in one step
    console.log('📝 Method 1: Generate and convert in one step...');
    const htmlQuiz = await generateHTMLQuiz(4);

    // Create quiz-output directory if it doesn't exist
    const outputDir = './quiz-output';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save to file
    const filepath = `${outputDir}/generated-quiz.html`;
    fs.writeFileSync(filepath, htmlQuiz);
    console.log(`✅ HTML quiz saved to ${filepath}`);

    // Method 2: Generate quiz first, then convert separately
    console.log('\n📝 Method 2: Generate quiz first, then convert...');
    const quizData = await generateQuiz(3);

    if (quizData.status === 'success') {
      const htmlFromData = quizToHTML(quizData);
      const filepath2 = `${outputDir}/generated-quiz-2.html`;
      fs.writeFileSync(filepath2, htmlFromData);
      console.log(`✅ HTML quiz saved to ${filepath2}`);
    } else {
      console.error('❌ Quiz generation failed:', quizData.error);
    }

    console.log('\n🎉 Test complete! Open the HTML files in your browser to see the interactive quizzes.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testHTMLQuiz();
