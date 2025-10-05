/**
 * Converts flashcards array into interactive HTML format with flip animations
 */
export function flashcardsToHTML(flashcardsData) {
  if (!flashcardsData || !Array.isArray(flashcardsData) || flashcardsData.length === 0) {
    throw new Error('Invalid flashcards data provided');
  }

  const flashcardsJSON = JSON.stringify(flashcardsData);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Flashcards</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .flashcards-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .flashcards-header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .flashcards-header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .progress-info {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .flashcards-content {
            padding: 40px;
        }

        .progress-bar-container {
            margin-bottom: 30px;
        }

        .progress-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 0.9em;
            color: #666;
        }

        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #059669);
            transition: width 0.3s ease;
        }

        .card-wrapper {
            perspective: 1000px;
            max-width: 600px;
            margin: 0 auto 40px;
        }

        .flashcard {
            position: relative;
            width: 100%;
            height: 350px;
            transition: transform 0.6s;
            transform-style: preserve-3d;
            cursor: pointer;
        }

        .flashcard.flipped {
            transform: rotateY(180deg);
        }

        .card-face {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            border-radius: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .card-front {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border: 3px solid #10b981;
        }

        .card-back {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border: 3px solid #059669;
            transform: rotateY(180deg);
        }

        .card-label {
            font-size: 0.9em;
            font-weight: 600;
            color: #059669;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .card-text {
            font-size: 1.5em;
            text-align: center;
            color: #1f2937;
            line-height: 1.6;
        }

        .card-hint {
            margin-top: 30px;
            font-size: 0.9em;
            color: #6b7280;
        }

        .navigation {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
        }

        .nav-btn {
            width: 50px;
            height: 50px;
            border: none;
            border-radius: 50%;
            background: #f3f4f6;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }

        .nav-btn:hover:not(:disabled) {
            background: #e5e7eb;
            transform: scale(1.1);
        }

        .nav-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .flip-btn {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 1em;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .flip-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
        }

        .keyboard-hint {
            text-align: center;
            margin-top: 20px;
            font-size: 0.9em;
            color: #6b7280;
        }

        .flashcards-footer {
            padding: 20px 40px;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .stats {
            color: #666;
            font-size: 0.9em;
        }

        .restart-btn {
            background: white;
            color: #10b981;
            border: 1px solid #10b981;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.3s ease;
        }

        .restart-btn:hover {
            background: #10b981;
            color: white;
        }

        @media (max-width: 768px) {
            .flashcard {
                height: 300px;
            }
            .card-text {
                font-size: 1.2em;
            }
        }
    </style>
</head>
<body>
    <div class="flashcards-container">
        <div class="flashcards-header">
            <h1>🎴 Interactive Flashcards</h1>
            <p class="progress-info" id="progressInfo">Card 1 of ${flashcardsData.length}</p>
        </div>

        <div class="flashcards-content">
            <div class="progress-bar-container">
                <div class="progress-label">
                    <span>Progress</span>
                    <span id="progressPercent">0%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
            </div>

            <div class="card-wrapper">
                <div class="flashcard" id="flashcard" onclick="flipCard()">
                    <div class="card-face card-front">
                        <div class="card-label">QUESTION</div>
                        <div class="card-text" id="frontText"></div>
                        <div class="card-hint">Click to flip</div>
                    </div>
                    <div class="card-face card-back">
                        <div class="card-label">ANSWER</div>
                        <div class="card-text" id="backText"></div>
                        <div class="card-hint">Click to flip back</div>
                    </div>
                </div>
            </div>

            <div class="navigation">
                <button class="nav-btn" id="prevBtn" onclick="prevCard()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m15 18-6-6 6-6"/>
                    </svg>
                </button>
                <button class="flip-btn" onclick="flipCard()" id="flipBtnText">
                    Show Answer
                </button>
                <button class="nav-btn" id="nextBtn" onclick="nextCard()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m9 18 6-6-6-6"/>
                    </svg>
                </button>
            </div>

            <div class="keyboard-hint">
                Use ← → arrow keys or click buttons to navigate
            </div>
        </div>

        <div class="flashcards-footer">
            <div class="stats">
                ${flashcardsData.length} flashcard${flashcardsData.length !== 1 ? 's' : ''} total
            </div>
            <button class="restart-btn" onclick="restart()">
                Restart
            </button>
        </div>
    </div>

    <script>
        const flashcards = ${flashcardsJSON};
        let currentIndex = 0;
        let isFlipped = false;

        function updateCard() {
            const card = flashcards[currentIndex];
            document.getElementById('frontText').textContent = card.front;
            document.getElementById('backText').textContent = card.back;
            document.getElementById('progressInfo').textContent = \`Card \${currentIndex + 1} of \${flashcards.length}\`;

            const progress = ((currentIndex + 1) / flashcards.length) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressPercent').textContent = Math.round(progress) + '%';

            document.getElementById('prevBtn').disabled = flashcards.length === 1;
            document.getElementById('nextBtn').disabled = flashcards.length === 1;

            updateFlipButton();
        }

        function flipCard() {
            const card = document.getElementById('flashcard');
            card.classList.toggle('flipped');
            isFlipped = !isFlipped;
            updateFlipButton();
        }

        function updateFlipButton() {
            document.getElementById('flipBtnText').textContent = isFlipped ? 'Show Question' : 'Show Answer';
        }

        function nextCard() {
            if (isFlipped) {
                flipCard();
            }
            currentIndex = (currentIndex + 1) % flashcards.length;
            updateCard();
        }

        function prevCard() {
            if (isFlipped) {
                flipCard();
            }
            currentIndex = (currentIndex - 1 + flashcards.length) % flashcards.length;
            updateCard();
        }

        function restart() {
            if (isFlipped) {
                flipCard();
            }
            currentIndex = 0;
            updateCard();
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                nextCard();
            } else if (e.key === 'ArrowLeft') {
                prevCard();
            } else if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                flipCard();
            }
        });

        // Initialize
        updateCard();
    </script>
</body>
</html>`;

  return html;
}
