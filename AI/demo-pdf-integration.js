import { getContentFromSource } from './pdf-processor.js';
import { quizToHTML } from './quiz-to-html.js';
import fs from 'fs';

// Sample lecture content
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

function demoPDFIntegration() {
  try {
    console.log('🧪 PDF Content Integration Demo\n');

    // Test 1: Process content from string
    console.log('📝 Test 1: Processing content from string...');
    const processedContent = getContentFromSource(sampleLectureContent);
    console.log(`✅ Content processed: ${processedContent.length} characters`);
    console.log(`📄 First 200 chars: ${processedContent.substring(0, 200)}...`);

    // Test 2: Create a sample text file and read it
    console.log('\n📝 Test 2: Processing content from file...');
    const tempFile = 'sample-lecture.txt';
    fs.writeFileSync(tempFile, sampleLectureContent);

    const fileContent = getContentFromSource(tempFile);
    console.log(`✅ File content processed: ${fileContent.length} characters`);

    // Clean up temp file
    fs.unlinkSync(tempFile);
    console.log('🗑️ Temporary file cleaned up');

    // Test 3: Show how the quiz generator would use this content
    console.log('\n📝 Test 3: Quiz generation workflow...');
    console.log('🔧 The quiz generator now accepts PDF content as a parameter:');
    console.log('   generateQuiz(numQuestions, pdfContent)');
    console.log('   generateHTMLQuiz(numQuestions, contentSource)');

    console.log('\n📋 Usage Examples:');
    console.log('   # Generate HTML quiz from PDF file:');
    console.log('   node index.js --html 5 --content lecture.pdf');
    console.log('   # Generate HTML quiz from text file:');
    console.log('   node index.js --html 5 --content notes.txt');
    console.log('   # Generate HTML quiz from direct content:');
    console.log('   node index.js --html 5 --content "Your lecture content here..."');

    console.log('\n🎯 Key Features:');
    console.log('✅ Accepts PDF files, text files, or direct content strings');
    console.log('✅ Processes and cleans content automatically');
    console.log('✅ Maintains exact JSON format from simple-quiz-generator.ts');
    console.log('✅ Generates interactive HTML quizzes from any content source');
    console.log('✅ Fallback to default AI content if no source provided');

    console.log('\n🎉 PDF Content Integration Demo Complete!');
    console.log('💡 Add your API key to felix.api to test with real quiz generation');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
demoPDFIntegration();
