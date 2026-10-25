import React, { useState, useEffect } from 'react';
import { MoralDilemma } from '../types/game';
import { Scale, AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert, Volume2, Pause } from 'lucide-react';
import { sound } from '../utils/audio';
import { narrator } from '../utils/narrator';

interface DilemmaModalProps {
  dilemma: MoralDilemma;
  onResolve: (optionId: string, consequenceText: string) => void;
}

export const DilemmaModal: React.FC<DilemmaModalProps> = ({
  dilemma,
  onResolve
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);

  useEffect(() => {
    const unsub = narrator.subscribe((speaking) => setIsNarrating(speaking));
    if (narrator.isAutoNarrateEnabled()) {
      const textToSpeak = `Сюжетная развилка. ${dilemma.title}. ${dilemma.situation}. Обсудите решение за столом.`;
      narrator.speak(textToSpeak);
    }
    return () => {
      unsub();
      narrator.stop();
    };
  }, [dilemma]);

  const toggleNarration = () => {
    sound.playClick();
    if (isNarrating) {
      narrator.stop();
    } else {
      const textToSpeak = `Сюжетная развилка. ${dilemma.title}. ${dilemma.situation}`;
      narrator.speak(textToSpeak);
    }
  };

  const selectedOption = dilemma.options.find((o) => o.id === selectedOptionId);

  const handleConfirmDecision = () => {
    if (!selectedOption) return;
    narrator.stop();
    sound.playSuccess();
    setIsResolved(true);
  };

  const handleFinish = () => {
    if (!selectedOption) return;
    narrator.stop();
    onResolve(selectedOption.id, selectedOption.consequence);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#121922] border-2 border-amber-800/80 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl shadow-amber-950/50 my-auto text-left relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#253648] pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-950/80 border border-amber-600/70 rounded-2xl text-amber-400">
              <Scale className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                СЮЖЕТНАЯ РАЗВИЛКА • МОРАЛЬНЫЙ ВЫБОР
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-mono uppercase">
                {dilemma.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleNarration}
            className={`p-2.5 rounded-xl border font-mono text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              isNarrating
                ? 'bg-amber-500 text-black border-amber-400 animate-pulse'
                : 'bg-[#182535] hover:bg-amber-600 text-amber-300 hover:text-white border-[#293d52]'
            }`}
          >
            {isNarrating ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isNarrating ? 'Пауза' : 'Озвучить'}</span>
          </button>
        </div>

        {/* Narrative Situation */}
        <div className="mb-6 bg-[#16212d] border border-[#27384a] rounded-2xl p-5 shadow-inner">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 mb-2">
            Ситуация за дверью:
          </div>
          <p className="text-base text-[#f0f6fc] leading-relaxed">
            {dilemma.situation}
          </p>
        </div>

        {/* Options List */}
        {!isResolved ? (
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#8b949e] mb-3">
              Решение команды (Обсудите за столом и выберите один вариант):
            </div>

            <div className="space-y-3 mb-6">
              {dilemma.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                return (
                  <div
                    key={option.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedOptionId(option.id);
                    }}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/50'
                        : 'bg-[#151f2b] border-[#253545] hover:border-amber-600/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-3">
                        <div className="text-base font-bold text-white mb-1">
                          {option.label}
                        </div>
                        <div className="text-xs text-[#8b949e]">
                          {option.isRisky ? (
                            <span className="text-red-400 font-semibold flex items-center space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                              Высокий риск, но ценная награда
                            </span>
                          ) : (
                            <span className="text-cyan-400 font-semibold">
                              Осторожный путь, без сюрпризов
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400 text-black'
                            : 'border-gray-600 bg-transparent'
                        }`}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              disabled={!selectedOptionId}
              onClick={handleConfirmDecision}
              className={`w-full py-4 rounded-2xl font-black tracking-wider uppercase text-base transition shadow-xl ${
                selectedOptionId
                  ? 'bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white shadow-amber-950/60 active:scale-98 cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              Подтвердить решение команды
            </button>
          </div>
        ) : (
          /* Consequences Payoff Screen */
          <div className="space-y-6">
            <div className="bg-[#17231c] border-2 border-emerald-700/70 rounded-2xl p-5 shadow-inner">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Последствия выбора:</span>
              </div>
              <p className="text-base text-white leading-relaxed mb-4">
                {selectedOption?.consequence}
              </p>
              <div className="p-3 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 font-medium">
                🎁 <b>Результат для стола:</b> {selectedOption?.rewardDescription}
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                handleFinish();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black tracking-wider uppercase text-base shadow-xl active:scale-98 transition flex items-center justify-center space-x-2"
            >
              <span>Принять изменения и продолжить</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
