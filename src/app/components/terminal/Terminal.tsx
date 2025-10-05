'use client';

import { useClassStore } from '@/src/app/lib/store';
import { useEffect, useRef } from 'react';

export default function Terminal() {
  const terminalLogs = useClassStore((state) => state.terminalLogs);
  const clearTerminalLogs = useClassStore((state) => state.clearTerminalLogs);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  const formatTimestamp = (date: Date) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const getTypeSymbol = (type?: string) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      case 'info':
      default: return '›';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Terminal Display */}
      <div
        ref={terminalRef}
        className="flex-1 bg-zinc-900 border border-white rounded-lg p-4 font-mono text-sm text-white overflow-y-auto min-h-[200px]"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#52525b #18181b' }}
      >
        {terminalLogs.length === 0 ? (
          <div className="text-zinc-500">Terminal ready. Waiting for operations...</div>
        ) : (
          terminalLogs.map((log, index) => (
            <div key={index} className="mb-1 flex gap-2">
              <span className="text-zinc-500 shrink-0">
                [{formatTimestamp(log.timestamp)}]
              </span>
              <span className="shrink-0">{getTypeSymbol(log.type)}</span>
              <span className="break-all">{log.message}</span>
            </div>
          ))
        )}
      </div>

      {/* Clear Button */}
      <button
        onClick={clearTerminalLogs}
        className="mt-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-white rounded-lg transition-colors text-sm font-medium"
      >
        Clear Terminal
      </button>
    </div>
  );
}
