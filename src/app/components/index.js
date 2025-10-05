import { generateQuiz } from './simple-quiz-generator.ts';
import { generateHTMLQuiz } from './quiz-to-html.js';
import { getContentFromSource } from './pdf-processor.js';
import { analyzeContent, displayAnalysis } from './content-analyzer.js';
import fs from 'fs';

async function main() {
  try {
    console.log('🚀 Starting Direct Gemini Quiz Generator\n');

    // Check command line arguments
    const args = process.argv.slice(2);
    const generateHTML = args.includes('--html') || args.includes('-h');
    const numQuestions = parseInt(args.find(arg => !isNaN(parseInt(arg)))) || 6;

    // Look for content source (file path or --content flag)
    const contentIndex = args.findIndex(arg => arg === '--content' || arg === '-c');
    const contentSource = contentIndex !== -1 && args[contentIndex + 1] ? args[contentIndex + 1] : null;

    if (generateHTML) {
      console.log('📝 Generating interactive HTML quiz...');
      if (contentSource) {
        console.log(`📄 Using content from: ${contentSource}`);

        // Analyze content for learning activities
        const analysis = await analyzeContent(contentSource);
        displayAnalysis(analysis);
      } else {
        console.log('📝 Using default AI content');
      }

      const htmlQuiz = await generateHTMLQuiz(numQuestions, contentSource);

      // Create quiz-output directory if it doesn't exist
      const outputDir = './src/app/temp/quiz-output';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save HTML file in quiz-output folder
      const filename = `quiz-${Date.now()}.html`;
      const filepath = `${outputDir}/${filename}`;
      fs.writeFileSync(filepath, htmlQuiz);
      console.log(`✅ HTML quiz saved to ${filepath}`);
      console.log('🌐 Open the file in your browser to take the interactive quiz!');
    } else {
      // Generate JSON quiz (original behavior)
      const pdfContent = contentSource ? await getContentFromSource(contentSource) : null;
      const result = await generateQuiz(numQuestions, pdfContent);
      console.log('\n📋 Quiz Generation Complete!\n');
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Application error:', error);
  }
}

// Run the application
main();

export { main };