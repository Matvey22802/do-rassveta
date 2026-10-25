import React, { useState, useEffect } from 'react';
import { HourCrisis } from '../types/game';
import { Skull, AlertTriangle, ArrowRight, ShieldAlert, Sparkles, Volume2, Square as StopSquare } from 'lucide-react';
import { sound } from '../utils/audio';
import { narrator } from '../utils/narrator';

interface ThreatModalProps {
  crisis: HourCrisis;
  currentHour: number;
  maxHours: number;
  onConfirm: () => void;
}

export const ThreatModal: React.FC<ThreatModalProps> = ({
  crisis,
  currentHour,
  maxHours,
  onConfirm
}) => {
  const [isNarrating, setIsNarrating] = useState(false);
  const isDawn = currentHour >= maxHours;

  useEffect(() => {
    const unsub = narrator.subscribe((speaking) => setIsNarrating(speaking));
    if (narrator.isAutoNarrateEnabled()) {
      const textToSpeak = `Внимание! Время ${crisis.timeString}. ${crisis.title}. ${crisis.eventDescription}. Добавьте ${crisis.zombieDirective.spawnCount} зараженных в локацию ${crisis.zombieDirective.spawnLocation}. ${crisis.zombieDirective.movementInstruction}`;
      narrator.speak(textToSpeak);
    }
    return () => {
      unsub();
      narrator.stop();
    };
  }, [crisis]);

  const toggleNarration = () => {
    sound.playClick();
    if (isNarrating) {
      narrator.stop();
    } else {
      const textToSpeak = `Время ${crisis.timeString}. ${crisis.title}. ${crisis.eventDescription}. Инструкция для стола: Появление. Добавьте ${crisis.zombieDirective.spawnCount} фишек зомби в локацию ${crisis.zombieDirective.spawnLocation}. Движение: ${crisis.zombieDirective.movementInstruction}`;
      narrator.speak(textToSpeak);
    }
  };

  const handleConfirm = () => {
    narrator.stop();
    sound.playClick();
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#121820] border-2 border-red-900/80 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl shadow-red-950/60 my-auto text-left relative overflow-hidden">
        {/* Subtle red emergency pulse overlay */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header with Hour Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#24313f] pb-5 mb-6 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-950 border border-red-700/60 rounded-2xl text-red-400">
              <Skull className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
                ФАЗА НОЧНЫХ УГРОЗ
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wide">
                ВРЕМЯ: {crisis.timeString}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto">
            {/* Voice Narration Button */}
            <button
              onClick={toggleNarration}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 transition ${
                isNarrating
                  ? 'bg-amber-500 text-black border-amber-300 animate-pulse'
                  : 'bg-[#1b2633] hover:bg-[#253547] border-[#314457] text-cyan-300'
              }`}
            >
              {isNarrating ? <StopSquare className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isNarrating ? 'Остановить' : '🔊 Зачитать'}</span>
            </button>

            <div className="text-right pl-2 border-l border-[#24313f]">
              <span className="text-[10px] font-mono tracking-widest text-[#8b949e] uppercase block">
                Раунд
              </span>
              <span className="text-lg font-bold font-mono text-amber-300">
                {currentHour} / {maxHours}
              </span>
            </div>
          </div>
        </div>

        {/* Event Narrative */}
        <div className="mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white font-mono mb-2 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>{crisis.title}</span>
          </h3>
          <p className="text-sm sm:text-base text-[#c9d1d9] leading-relaxed bg-[#17212c] border border-[#2b3a4a] rounded-xl p-4">
            {crisis.eventDescription}
          </p>
        </div>

        {/* Zombie Table Directive (Physical Tabletop Instructions) */}
        <div className="bg-gradient-to-br from-[#1a1317] to-[#1e171b] border-2 border-red-800/70 rounded-2xl p-5 mb-6 shadow-inner">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-widest text-red-400 mb-3">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Инструкция для физического стола (Переставьте фишки):</span>
          </div>

          <div className="space-y-3 text-sm">
            {/* Spawn Directive */}
            <div className="flex items-start space-x-3 bg-red-950/40 border border-red-900/50 rounded-xl p-3">
              <span className="px-2 py-0.5 rounded bg-red-900/80 text-white font-mono font-bold text-xs uppercase flex-shrink-0 mt-0.5">
                Появление
              </span>
              <div className="text-[#f0f6fc]">
                Добавьте <b className="text-red-300">{crisis.zombieDirective.spawnCount} фишек зомби</b> в локацию{' '}
                <span className="text-amber-300 font-bold underline underline-offset-2">
                  «{crisis.zombieDirective.spawnLocation}»
                </span>
                .
              </div>
            </div>

            {/* Movement Directive */}
            <div className="flex items-start space-x-3 bg-[#19222c] border border-[#273747] rounded-xl p-3">
              <span className="px-2 py-0.5 rounded bg-[#273747] text-cyan-300 font-mono font-bold text-xs uppercase flex-shrink-0 mt-0.5">
                Движение
              </span>
              <div className="text-[#c9d1d9] leading-relaxed">
                {crisis.zombieDirective.movementInstruction}
              </div>
            </div>

            {/* Special Reminder */}
            {crisis.zombieDirective.specialWarning && (
              <div className="text-xs text-amber-300/90 font-medium italic pl-1">
                ⚠️ {crisis.zombieDirective.specialWarning}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 hover:from-red-500 to-amber-600 hover:to-amber-500 text-white font-black tracking-wider uppercase text-base sm:text-lg shadow-xl shadow-red-950/70 transition transform active:scale-98 flex items-center justify-center space-x-2 border border-red-400/30"
        >
          <span>{isDawn ? 'Встретить рассвет' : 'Фишки расставлены — К фазе планёрки'}</span>
          <ArrowRight className="w-5 h-5 ml-1" />
        </button>

        <div className="mt-4 text-center text-xs text-[#8b949e]">
          После подтверждения команда планирует очередность хода в этом раунде
        </div>
      </div>
    </div>
  );
};
