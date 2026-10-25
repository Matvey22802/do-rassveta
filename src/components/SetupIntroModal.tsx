import React, { useState, useEffect } from 'react';
import { Scenario } from '../types/game';
import { Skull, CheckSquare, Square, ShieldCheck, ArrowRight, Play, Volume2, Square as StopSquare } from 'lucide-react';
import { sound } from '../utils/audio';
import { narrator } from '../utils/narrator';

interface SetupIntroModalProps {
  scenario: Scenario;
  onStartGame: () => void;
}

export const SetupIntroModal: React.FC<SetupIntroModalProps> = ({
  scenario,
  onStartGame
}) => {
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [isNarrating, setIsNarrating] = useState(false);

  useEffect(() => {
    const unsub = narrator.subscribe((speaking) => setIsNarrating(speaking));
    return () => {
      unsub();
      narrator.stop();
    };
  }, []);

  const toggleNarration = () => {
    sound.playClick();
    if (isNarrating) {
      narrator.stop();
    } else {
      const fullText = `${scenario.title}. ${scenario.introStory.join(' ')}. Общая задача команды: ${scenario.teamObjective}`;
      narrator.speak(fullText);
    }
  };

  const toggleCheck = (idx: number) => {
    sound.playClick();
    if (checkedItems.includes(idx)) {
      setCheckedItems(checkedItems.filter((i) => i !== idx));
    } else {
      setCheckedItems([...checkedItems, idx]);
    }
  };

  const handleStart = () => {
    narrator.stop();
    sound.playAlarm();
    onStartGame();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#121922] border-2 border-red-900/60 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl my-auto text-left relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#223040] pb-5 mb-6">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-red-950 border border-red-700/60 rounded-2xl text-red-400">
              <Skull className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
                {scenario.chapter} • НАЧАЛО ПАРТИИ
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wide">
                {scenario.title}
              </h1>
            </div>
          </div>

          {/* Voiceover Button */}
          <button
            onClick={toggleNarration}
            className={`px-4 py-2 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 transition shadow-lg ${
              isNarrating
                ? 'bg-amber-500 text-black border-amber-300 animate-pulse'
                : 'bg-[#1a2533] hover:bg-[#243346] border-[#314459] text-cyan-300'
            }`}
          >
            {isNarrating ? <StopSquare className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isNarrating ? 'Остановить голос' : '🔊 Озвучить брифинг'}</span>
          </button>
        </div>

        {/* Intro Story */}
        <div className="space-y-3 mb-6 bg-[#16202c] border border-[#27384a] rounded-2xl p-5 text-sm sm:text-base text-[#c9d1d9] leading-relaxed">
          {scenario.introStory.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Team Objective Box */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-950/70 to-amber-950/70 border border-red-700/50 shadow-inner">
          <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold mb-1">
            Общая цель команды:
          </div>
          <div className="text-base sm:text-lg font-bold text-white">
            {scenario.teamObjective}
          </div>
        </div>

        {/* Tabletop Setup Checklist */}
        <div className="mb-8">
          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold mb-3 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Инструкция по подготовке стола (Отметьте готовность):</span>
          </div>

          <div className="space-y-2.5">
            {scenario.setupInstructions.map((instruction, idx) => {
              const isChecked = checkedItems.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                    isChecked
                      ? 'bg-emerald-950/30 border-emerald-700/60 text-white'
                      : 'bg-[#151e29] border-[#223142] text-[#8b949e] hover:border-gray-500'
                  }`}
                >
                  <div className="mt-0.5 text-cyan-400">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <span className={`text-xs sm:text-sm ${isChecked ? 'line-through text-gray-400' : ''}`}>
                    {instruction}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Game Action */}
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 hover:from-red-500 to-amber-600 hover:to-amber-500 text-white font-black tracking-wider uppercase text-base sm:text-lg shadow-xl shadow-red-950/60 active:scale-98 transition flex items-center justify-center space-x-2 border border-red-400/30"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Начать выживание (00:00)</span>
        </button>
      </div>
    </div>
  );
};
