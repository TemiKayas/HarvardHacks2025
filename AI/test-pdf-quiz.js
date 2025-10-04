import { generateHTMLQuiz } from './quiz-to-html.js';
import { generateQuiz } from './simple-quiz-generator.ts';
import fs from 'fs';

// Sample lecture content (you can replace this with actual PDF content)
const sampleLectureContent = `
# Introduction to Machine Learning

## What is Machine Learning?
Machine learning is a subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. Machine learning focuses on the development of computer programs that can access data and use it to learn for themselves.

## Types of Machine Learning

### 1. Supervised Learning
Supervised learning is the machine learning task of learning a function that maps an input to an output based on example input-output pairs. It infers a function from labeled training data consisting of a set of training examples.

Examples:
- Linear Regression
- Decision Trees
- Random Forest
- Support Vector Machines (SVM)
- Neural Networks

### 2. Unsupervised Learning
Unsupervised learning is a type of machine learning that looks for previously undetected patterns in a data set with no pre-existing labels and with a minimum of human supervision.

Examples:
- K-Means Clustering
- Hierarchical Clustering
- Principal Component Analysis (PCA)
- Association Rules

### 3. Reinforcement Learning
Reinforcement learning is an area of machine learning concerned with how software agents ought to take actions in an environment in order to maximize the notion of cumulative reward.

## Key Concepts

### Overfitting and Underfitting
- **Overfitting**: When a model learns the training data too well, including noise and outliers
- **Underfitting**: When a model is too simple to capture the underlying patterns in the data

### Cross-Validation
Cross-validation is a technique for assessing how the results of a statistical analysis will generalize to an independent data set.

### Feature Engineering
Feature engineering is the process of using domain knowledge to extract features from raw data via data mining techniques.

## Applications
- Image Recognition
- Natural Language Processing
- Recommendation Systems
- Fraud Detection
- Medical Diagnosis
- Autonomous Vehicles
`;

async function testPDFQuiz() {
  try {
    console.log('🧪 Testing PDF Content Quiz Generation\n');

    // Test 1: Generate HTML quiz with sample lecture content
    console.log('📝 Test 1: Generating HTML quiz from lecture content...');
    const htmlQuiz = await generateHTMLQuiz(5, sampleLectureContent);

    // Create quiz-output directory if it doesn't exist
    const outputDir = './quiz-output';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename1 = `${outputDir}/lecture-quiz.html`;
    fs.writeFileSync(filename1, htmlQuiz);
    console.log(`✅ HTML quiz saved to ${filename1}`);

    // Test 2: Generate JSON quiz with the same content
    console.log('\n📝 Test 2: Generating JSON quiz from lecture content...');
    const jsonQuiz = await generateQuiz(4, sampleLectureContent);

    if (jsonQuiz.status === 'success') {
      console.log('✅ JSON quiz generated successfully!');
      console.log(`📊 Content source: ${jsonQuiz.metadata.contentSource}`);
      console.log(`📏 Content length: ${jsonQuiz.metadata.pdfTextLength} characters`);
      console.log(`❓ Questions generated: ${jsonQuiz.metadata.actualQuestionsGenerated}`);

      // Save JSON quiz
      const jsonFilename = 'lecture-quiz.json';
      fs.writeFileSync(jsonFilename, JSON.stringify(jsonQuiz, null, 2));
      console.log(`💾 JSON saved to ${jsonFilename}`);
    } else {
      console.error('❌ JSON quiz generation failed:', jsonQuiz.error);
    }

    console.log('\n🎉 PDF Content Integration Test Complete!');
    console.log('🌐 Open lecture-quiz.html in your browser to see the interactive quiz!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPDFQuiz();
