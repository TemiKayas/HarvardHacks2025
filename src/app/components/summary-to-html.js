/**
 * Converts summary text into interactive HTML format
 */
export function summaryToHTML(summaryText) {
  if (!summaryText || typeof summaryText !== 'string') {
    throw new Error('Invalid summary text provided');
  }

  const wordCount = summaryText.split(' ').length;
  const readTime = Math.ceil(wordCount / 200);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content Summary</title>
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

        .summary-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .summary-header {
            background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .summary-header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .summary-header p {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .summary-content {
            padding: 40px;
            line-height: 1.8;
            font-size: 1.1em;
            color: #333;
        }

        .summary-content p {
            margin-bottom: 1em;
            white-space: pre-wrap;
        }

        .summary-footer {
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

        .copy-btn {
            background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            transition: all 0.3s ease;
        }

        .copy-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(168, 85, 247, 0.3);
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            .summary-footer {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="summary-container">
        <div class="summary-header">
            <h1>📝 Summary</h1>
            <p>Key insights from your content</p>
        </div>

        <div class="summary-content">
            <p>${summaryText}</p>
        </div>

        <div class="summary-footer">
            <div class="stats">
                ${wordCount} words • ${readTime} min read
            </div>
            <button class="copy-btn" onclick="copySummary()">
                Copy Summary
            </button>
        </div>
    </div>

    <script>
        function copySummary() {
            const summaryText = \`${summaryText.replace(/`/g, '\\`')}\`;
            navigator.clipboard.writeText(summaryText).then(() => {
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            });
        }

        // Print functionality
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                window.print();
            }
        });
    </script>
</body>
</html>`;

  return html;
}
