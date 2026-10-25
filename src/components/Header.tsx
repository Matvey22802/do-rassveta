import React, { useState } from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, Clock, History, AlertTriangle, RotateCcw, Undo2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface HeaderProps {
  currentHour: number;
  maxHours: number;
  timeString: string;
  canUndo?: boolean;
  onUndo?: () => void;
  lastActionDescription?: string;
  onToggleLogs: () => void;
  onResetGame: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentHour,
  maxHours,
  timeString,
  canUndo = false,
  onUndo,
  lastActionDescription,
  onToggleLogs,
  onResetGame
}) => {
  const [muted, setMuted] = useState(sound.getMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const toggleSound = () => {
    const nextMuted = !muted;
    sound.setMuted(nextMuted);
    setMuted(nextMuted);
    if (!nextMuted) {
      sound.playClick();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const hoursRemaining = maxHours - currentHour;

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0e141a]/95 backdrop-blur border-b border-[#24303b] px-4 lg:px-8 py-3 flex items-center justify-between shadow-xl">
        {/* Title and Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl lg:text-2xl font-black tracking-widest text-[#f0f6fc] uppercase font-mono">
              ДО РАССВЕТА
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-red-950/80 border border-red-700/60 text-red-300 rounded">
              14 ЭТАЖ
            </span>
          </div>
        </div>

        {/* Central Clock Display */}
        <div className="flex items-center space-x-3 bg-[#161f29] border border-[#2b3a47] rounded-xl px-4 py-1.5 shadow-inner">
          <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
          <div className="flex flex-col items-center">
            <span className="font-mono text-xl lg:text-2xl font-black tracking-wider text-amber-300 leading-none">
              {timeString}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#8b949e]">
              {hoursRemaining > 0 ? `До рассвета: ${hoursRemaining} ч` : 'РАССВЕТ'}
            </span>
          </div>
        </div>

        {/* Control Tools */}
        <div className="flex items-center space-x-2">
          {/* Undo Button (Section 17) */}
          {canUndo && onUndo && (
            <button
              data-testid="undo-action-btn"
              onClick={() => {
                sound.playClick();
                onUndo();
              }}
              title={lastActionDescription ? `Отменить: ${lastActionDescription}` : 'Отменить последнее действие'}
              className="px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-300 font-mono text-xs font-bold transition flex items-center space-x-1.5 shadow-lg animate-pulse cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Отменить действие</span>
            </button>
          )}

          {/* Log History */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleLogs();
            }}
            title="Журнал событий"
            className="p-2 lg:px-3 lg:py-2 rounded-lg bg-[#161f29] hover:bg-[#1f2c3a] border border-[#2b3a47] text-[#c9d1d9] hover:text-white transition flex items-center space-x-1.5 text-sm font-medium"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">События</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={muted ? 'Включить звук' : 'Выключить звук'}
            className="p-2 rounded-lg bg-[#161f29] hover:bg-[#1f2c3a] border border-[#2b3a47] text-[#c9d1d9] hover:text-white transition"
          >
            {muted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title="Полный экран (ТВ/Проектор)"
            className="p-2 rounded-lg bg-[#161f29] hover:bg-[#1f2c3a] border border-[#2b3a47] text-[#c9d1d9] hover:text-white transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-300" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Reset Game */}
          <button
            onClick={() => setShowConfirmReset(true)}
            title="Сброс / Новая партия"
            className="p-2 rounded-lg bg-[#161f29] hover:bg-red-950/40 border border-[#2b3a47] hover:border-red-800 text-[#8b949e] hover:text-red-400 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Confirm Reset Dialog */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#161f29] border border-red-900/60 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-white mb-2 font-mono uppercase tracking-wide">
              Начать партию заново?
            </h3>
            <p className="text-sm text-[#8b949e] mb-6">
              Текущий прогресс выживания, открытые комнаты и выполненные задачи будут сброшены. Физический стол нужно будет расставить заново.
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-5 py-2.5 rounded-xl bg-[#212c37] hover:bg-[#2b3947] text-white font-medium transition"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  setShowConfirmReset(false);
                  onResetGame();
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition shadow-lg shadow-red-900/40"
              >
                Сбросить партию
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
