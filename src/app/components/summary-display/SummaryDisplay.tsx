"use client";

interface SummaryDisplayProps {
  summary: string;
  onClose?: () => void;
}

export default function SummaryDisplay({ summary, onClose }: SummaryDisplayProps) {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-0">Summary</h1>
            <p className="text-purple-100">Key insights from your content</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-purple-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Summary Content */}
      <div className="p-6 md:p-8 max-h-[600px] overflow-y-auto">
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <div className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
            {summary}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {summary.split(' ').length} words • {Math.ceil(summary.split(' ').length / 200)} min read
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(summary);
            alert('Summary copied to clipboard!');
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          Copy Summary
        </button>
      </div>
    </div>
  );
}
