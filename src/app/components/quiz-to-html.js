import { generateQuiz } from './simple-quiz-generator.ts';
import { getContentFromSource } from './pdf-processor.js';

/**
 * Converts quiz JSON data into interactive HTML format
 * @param {Object} quizData - The quiz data from generateQuiz()
 * @returns {string} - Complete HTML document with embedded CSS and JavaScript
 */
export function quizToHTML(quizData) {
  if (!quizData || !quizData.quiz || !quizData.quiz.questions) {
    throw new Error('Invalid quiz data provided');
  }

  const questions = quizData.quiz.questions;

  // Generate HTML structure
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Quiz</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .quiz-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .quiz-header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .quiz-header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .quiz-header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .quiz-content {
            padding: 40px;
        }
        
        .question {
            margin-bottom: 40px;
            padding: 25px;
            border: 2px solid #f0f0f0;
            border-radius: 10px;
            background: #fafafa;
            transition: all 0.3s ease;
        }
        
        .question:hover {
            border-color: #4facfe;
            box-shadow: 0 5px 15px rgba(79, 172, 254, 0.1);
        }
        
        .question-number {
            font-weight: bold;
            color: #4facfe;
            font-size: 1.1em;
            margin-bottom: 15px;
        }
        
        .question-text {
            font-size: 1.2em;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        
        .options {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .option {
            display: flex;
            align-items: center;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: white;
        }
        
        .option:hover {
            border-color: #4facfe;
            background: #f8fcff;
        }
        
        .option.selected {
            border-color: #4facfe;
            background: #e3f2fd;
        }
        
        .option.correct {
            border-color: #4caf50;
            background: #e8f5e8;
        }
        
        .option.incorrect {
            border-color: #f44336;
            background: #ffebee;
        }
        
        .option input[type="radio"] {
            margin-right: 12px;
            transform: scale(1.2);
        }
        
        .option input[type="radio"]:checked + label {
            font-weight: bold;
        }
        
        .tf-options {
            display: flex;
            gap: 20px;
            justify-content: center;
        }
        
        .tf-option {
            flex: 1;
            text-align: center;
        }
        
        .explanation {
            margin-top: 15px;
            padding: 15px;
            background: #e8f5e8;
            border-left: 4px solid #4caf50;
            border-radius: 5px;
            display: none;
        }
        
        .explanation.show {
            display: block;
        }
        
        .submit-btn {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 1.2em;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 20px auto;
            display: block;
        }
        
        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(79, 172, 254, 0.3);
        }
        
        .submit-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .results {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 10px;
            margin-top: 20px;
            display: none;
        }
        
        .results.show {
            display: block;
        }
        
        .score {
            font-size: 2em;
            font-weight: bold;
            color: #4facfe;
            margin-bottom: 10px;
        }
        
        .score-text {
            font-size: 1.2em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="quiz-container">
        <div class="quiz-header">
            <h1>🧠 Interactive Quiz</h1>
            <p>Test your knowledge with ${questions.length} questions</p>
        </div>
        
        <div class="quiz-content">
            <form id="quizForm">
                ${questions.map((question, index) => generateQuestionHTML(question, index + 1)).join('')}
                
                <button type="submit" class="submit-btn" id="submitBtn">
                    Submit Quiz
                </button>
            </form>
            
            <div class="results" id="results">
                <div class="score" id="score">0/${questions.length}</div>
                <div class="score-text" id="scoreText">Great job!</div>
            </div>
        </div>
    </div>

    <script>
        // Quiz data embedded in the HTML
        const quizData = ${JSON.stringify(quizData)};
        const questions = quizData.quiz.questions;
        
        // Initialize quiz
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('quizForm');
            const submitBtn = document.getElementById('submitBtn');
            const results = document.getElementById('results');
            const scoreElement = document.getElementById('score');
            const scoreTextElement = document.getElementById('scoreText');
            
            // Handle form submission
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                gradeQuiz();
            });
            
            // Handle option selection
            document.querySelectorAll('input[type="radio"]').forEach(input => {
                input.addEventListener('change', function() {
                    const option = this.closest('.option');
                    const questionContainer = option.closest('.question');
                    
                    // Remove previous selections
                    questionContainer.querySelectorAll('.option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    // Add selection to current option
                    option.classList.add('selected');
                });
            });
        });
        
        function gradeQuiz() {
            let correctAnswers = 0;
            const totalQuestions = questions.length;
            
            questions.forEach((question, index) => {
                const questionElement = document.querySelector(\`[data-question-index="\${index}"]\`);
                const selectedAnswer = questionElement.querySelector('input[type="radio"]:checked');
                const explanation = questionElement.querySelector('.explanation');
                
                if (selectedAnswer) {
                    const userAnswer = selectedAnswer.value;
                    const isCorrect = checkAnswer(question, userAnswer);
                    
                    if (isCorrect) {
                        correctAnswers++;
                        selectedAnswer.closest('.option').classList.add('correct');
                    } else {
                        selectedAnswer.closest('.option').classList.add('incorrect');
                        // Highlight correct answer
                        highlightCorrectAnswer(questionElement, question);
                    }
                    
                    // Show explanation
                    explanation.classList.add('show');
                }
            });
            
            // Show results
            showResults(correctAnswers, totalQuestions);
        }
        
        function checkAnswer(question, userAnswer) {
            if (question.type === 'MCQ') {
                return userAnswer === question.correctAnswer;
            } else if (question.type === 'TF') {
                return userAnswer === question.correctAnswer;
            }
            return false;
        }
        
        function highlightCorrectAnswer(questionElement, question) {
            const options = questionElement.querySelectorAll('.option');
            options.forEach(option => {
                const input = option.querySelector('input[type="radio"]');
                if (input && input.value === question.correctAnswer) {
                    option.classList.add('correct');
                }
            });
        }
        
        function showResults(correct, total) {
            const percentage = Math.round((correct / total) * 100);
            const scoreElement = document.getElementById('score');
            const scoreTextElement = document.getElementById('scoreText');
            const results = document.getElementById('results');
            const submitBtn = document.getElementById('submitBtn');
            
            scoreElement.textContent = \`\${correct}/\${total}\`;
            
            let message = '';
            if (percentage >= 90) {
                message = 'Excellent work! 🌟';
            } else if (percentage >= 70) {
                message = 'Good job! 👍';
            } else if (percentage >= 50) {
                message = 'Not bad! Keep studying 📚';
            } else {
                message = 'Keep practicing! 💪';
            }
            
            scoreTextElement.textContent = message;
            results.classList.add('show');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Quiz Complete!';
        }
    </script>
</body>
</html>`;

  return html;
}

/**
 * Generates HTML for a single question
 */
function generateQuestionHTML(question, questionNumber) {
  const questionId = `question-${questionNumber}`;

  if (question.type === 'MCQ') {
    return `
      <div class="question" data-question-index="${questionNumber - 1}">
        <div class="question-number">Question ${questionNumber}</div>
        <div class="question-text">${question.question}</div>
        <div class="options">
          ${['A', 'B', 'C', 'D'].map(letter => `
            <div class="option">
              <input type="radio" name="${questionId}" value="${letter}" id="${questionId}-${letter}">
              <label for="${questionId}-${letter}">
                <strong>${letter}.</strong> ${question[`answer${letter}`]}
              </label>
            </div>
          `).join('')}
        </div>
        <div class="explanation">
          <strong>Explanation:</strong> ${question.explanation}
        </div>
      </div>
    `;
  } else if (question.type === 'TF') {
    return `
      <div class="question" data-question-index="${questionNumber - 1}">
        <div class="question-number">Question ${questionNumber}</div>
        <div class="question-text">${question.question}</div>
        <div class="options">
          <div class="tf-options">
            <div class="tf-option">
              <div class="option">
                <input type="radio" name="${questionId}" value="true" id="${questionId}-true">
                <label for="${questionId}-true">True</label>
              </div>
            </div>
            <div class="tf-option">
              <div class="option">
                <input type="radio" name="${questionId}" value="false" id="${questionId}-false">
                <label for="${questionId}-false">False</label>
              </div>
            </div>
          </div>
        </div>
        <div class="explanation">
          <strong>Explanation:</strong> ${question.explanation}
        </div>
      </div>
    `;
  }

  return '';
}

/**
 * Generates a complete HTML quiz from scratch using the quiz generator
 * @param {number} numQuestions - Number of questions to generate
 * @param {string} contentSource - PDF file path, text file path, or direct content string
 * @returns {Promise<string>} - Complete HTML document
 */
export async function generateHTMLQuiz(numQuestions = 5, contentSource = null) {
  try {
    console.log('🤖 Generating quiz...');

    // Process content source if provided
    const pdfContent = await getContentFromSource(contentSource);

    const quizData = await generateQuiz(numQuestions, pdfContent);

    if (quizData.status === 'error') {
      throw new Error(quizData.error);
    }

    console.log('📝 Converting to HTML...');
    const html = quizToHTML(quizData);

    return html;
  } catch (error) {
    console.error('❌ Error generating HTML quiz:', error);
    throw error;
  }
}
