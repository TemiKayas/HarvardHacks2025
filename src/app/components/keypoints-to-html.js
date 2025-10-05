/**
 * Converts key points text into interactive HTML format with collapsible sections
 */
export function keyPointsToHTML(keyPointsText) {
  if (!keyPointsText || typeof keyPointsText !== 'string') {
    throw new Error('Invalid key points text provided');
  }

  // Parse key points into sections
  const parseKeyPoints = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const sections = [];
    let currentSection = null;

    lines.forEach(line => {
      const trimmed = line.trim();

      if ((!trimmed.match(/^[-•*\d.]/) && (trimmed.endsWith(':') || trimmed === trimmed.toUpperCase())) ||
          trimmed.match(/^#{1,6}\s/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmed.replace(/^#{1,6}\s/, '').replace(/:$/, ''),
          points: []
        };
      } else if (currentSection && trimmed.match(/^[-•*\d.]/)) {
        currentSection.points.push(trimmed.replace(/^[-•*\d.]\s*/, ''));
      } else if (trimmed) {
        if (!currentSection) {
          currentSection = { title: 'Key Points', points: [] };
        }
        currentSection.points.push(trimmed);
      }
    });

    if (currentSection && currentSection.points.length > 0) {
      sections.push(currentSection);
    }

    if (sections.length === 0) {
      sections.push({ title: 'Key Points', points: lines });
    }

    return sections;
  };

  const sections = parseKeyPoints(keyPointsText);
  const totalPoints = sections.reduce((acc, s) => acc + s.points.length, 0);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Key Points</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .keypoints-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .keypoints-header {
            background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .keypoints-header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .keypoints-header p {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .keypoints-content {
            padding: 40px;
        }

        .section {
            margin-bottom: 20px;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: #f9fafb;
            cursor: pointer;
            transition: background 0.3s ease;
        }

        .section-header:hover {
            background: #f3f4f6;
        }

        .section-title {
            font-size: 1.2em;
            font-weight: 600;
            color: #1f2937;
        }

        .chevron {
            transition: transform 0.3s ease;
        }

        .section.expanded .chevron {
            transform: rotate(180deg);
        }

        .section-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            padding: 0 20px;
        }

        .section.expanded .section-content {
            max-height: 2000px;
            padding: 20px;
        }

        .points-list {
            list-style: none;
        }

        .point-item {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
            align-items: start;
        }

        .point-number {
            flex-shrink: 0;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9em;
            font-weight: 600;
        }

        .point-text {
            flex: 1;
            line-height: 1.6;
            color: #374151;
        }

        .keypoints-footer {
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

        .controls {
            display: flex;
            gap: 10px;
        }

        .control-btn {
            background: white;
            color: #3b82f6;
            border: 1px solid #3b82f6;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.3s ease;
        }

        .control-btn:hover {
            background: #3b82f6;
            color: white;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            .keypoints-footer {
                display: none;
            }
            .section {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="keypoints-container">
        <div class="keypoints-header">
            <h1>🎯 Key Points</h1>
            <p>Essential takeaways from your content</p>
        </div>

        <div class="keypoints-content">
            ${sections.map((section, index) => `
                <div class="section expanded" id="section-${index}">
                    <div class="section-header" onclick="toggleSection(${index})">
                        <div class="section-title">${section.title}</div>
                        <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m6 9 6 6 6-6"/>
                        </svg>
                    </div>
                    <div class="section-content">
                        <ul class="points-list">
                            ${section.points.map((point, pointIndex) => `
                                <li class="point-item">
                                    <div class="point-number">${pointIndex + 1}</div>
                                    <div class="point-text">${point}</div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="keypoints-footer">
            <div class="stats">
                ${totalPoints} key points across ${sections.length} section${sections.length !== 1 ? 's' : ''}
            </div>
            <div class="controls">
                <button class="control-btn" onclick="expandAll()">Expand All</button>
                <button class="control-btn" onclick="collapseAll()">Collapse All</button>
            </div>
        </div>
    </div>

    <script>
        function toggleSection(index) {
            const section = document.getElementById('section-' + index);
            section.classList.toggle('expanded');
        }

        function expandAll() {
            document.querySelectorAll('.section').forEach(section => {
                section.classList.add('expanded');
            });
        }

        function collapseAll() {
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('expanded');
            });
        }

        // Print functionality
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                expandAll();
                setTimeout(() => window.print(), 100);
            }
        });
    </script>
</body>
</html>`;

  return html;
}
