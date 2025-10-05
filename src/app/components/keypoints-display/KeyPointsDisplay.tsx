"use client";

import { useState } from 'react';

interface KeyPointsDisplayProps {
  keyPoints: string;
  onClose?: () => void;
}

export default function KeyPointsDisplay({ keyPoints, onClose }: KeyPointsDisplayProps) {
  // Parse key points into sections (assuming bullet points or numbered lists)
  const parseKeyPoints = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const sections: { title: string; points: string[] }[] = [];
    let currentSection: { title: string; points: string[] } | null = null;

    lines.forEach(line => {
      const trimmed = line.trim();

      // Check if it's a header (no bullet/number at start, ends with : or is all caps)
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
        // It's a bullet point
        currentSection.points.push(trimmed.replace(/^[-•*\d.]\s*/, ''));
      } else if (trimmed) {
        // It's a regular point without bullet
        if (!currentSection) {
          currentSection = { title: 'Key Points', points: [] };
        }
        currentSection.points.push(trimmed);
      }
    });

    if (currentSection && currentSection.points.length > 0) {
      sections.push(currentSection);
    }

    // If no sections were created, treat entire text as one section
    if (sections.length === 0) {
      sections.push({
        title: 'Key Points',
        points: lines
      });
    }

    return sections;
  };

  const sections = parseKeyPoints(keyPoints);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(sections.map((_, i) => i)) // All expanded by default
  );

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Key Points</h1>
            <p className="text-blue-100">Essential takeaways from your content</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Key Points Content */}
      <div className="p-6 md:p-8 max-h-[600px] overflow-y-auto">
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={index}
              className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
            >
              {/* Section Header - Collapsible */}
              <button
                onClick={() => toggleSection(index)}
                className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {section.title}
                </h3>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${
                    expandedSections.has(index) ? 'rotate-180' : ''
                  }`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Section Content */}
              {expandedSections.has(index) && (
                <div className="p-4 bg-white dark:bg-zinc-900">
                  <ul className="space-y-3">
                    {section.points.map((point, pointIndex) => (
                      <li
                        key={pointIndex}
                        className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium mt-0.5">
                          {pointIndex + 1}
                        </span>
                        <span className="flex-1 leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {sections.reduce((acc, s) => acc + s.points.length, 0)} key points across {sections.length} section{sections.length !== 1 ? 's' : ''}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExpandedSections(new Set(sections.map((_, i) => i)))}
            className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={() => setExpandedSections(new Set())}
            className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>
    </div>
  );
}
