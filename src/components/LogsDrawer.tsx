import React from 'react';
import { LogEntry } from '../types/game';
import { X, History, Clock, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { sound } from '../utils/audio';

interface LogsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
}

export const LogsDrawer: React.FC<LogsDrawerProps> = ({
  isOpen,
  onClose,
  logs
}) => {
  if (!isOpen) return null;

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'threat':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'action':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'story':
        return <Shield className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#111720] border-l border-[#243343] h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[#212f3e] flex items-center justify-between bg-[#151f2b]">
          <div className="flex items-center space-x-2.5">
            <History className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
              Журнал хроники партии
            </h3>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-[#202b37] hover:bg-[#2c3b4b] text-[#8b949e] hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8b949e]">
              Событий пока не зафиксировано. Начните исследование комнат.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-[#151f2a] border border-[#213141] text-xs flex items-start space-x-3"
              >
                <div className="mt-0.5 flex-shrink-0">{getLogIcon(log.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] font-mono mb-1">
                    <span>ЧАС {log.hour} • {log.time}</span>
                  </div>
                  <div className="text-[#e6edf3] leading-relaxed">{log.text}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
