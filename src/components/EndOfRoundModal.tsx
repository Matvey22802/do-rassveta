import React, { useState } from 'react';
import {
  Skull,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  HelpCircle,
  X,
  ZapOff,
  Flame,
  Radio,
  Clock
} from 'lucide-react';
import { sound } from '../utils/audio';

interface EndOfRoundModalProps {
  currentRound: number;
  maxRounds: number;
  currentStep: number;
  onStepChange: (step: number) => void;
  leakStatus: string;
  doorReinforced: boolean;
  irinaStatus: string;
  rescueSignal: string;
  roofHatchOpen: boolean;
  onProceedToNextRound: (hadThreeNoise: boolean) => void;
  onClose: () => void;
}

export const EndOfRoundModal: React.FC<EndOfRoundModalProps> = ({
  currentRound,
  maxRounds,
  currentStep,
  onStepChange,
  leakStatus,
  doorReinforced,
  irinaStatus,
  rescueSignal,
  roofHatchOpen,
  onProceedToNextRound,
  onClose
}) => {
  const [hadThreeNoise, setHadThreeNoise] = useState<boolean>(false);
  const [showNoiseCalculator, setShowNoiseCalculator] = useState<boolean>(false);

  // Noise test simulator helper
  const [simCurrentFloor, setSimCurrentFloor] = useState<number>(13);
  const [noiseBelow, setNoiseBelow] = useState<number>(0);
  const [noiseCurrent, setNoiseCurrent] = useState<number>(1);
  const [noiseAbove, setNoiseAbove] = useState<number>(2);

  // Compute movement direction based on Section 7 rules
  const computeMovement = () => {
    const isTop = simCurrentFloor === 15;
    const isBottom = simCurrentFloor === 10;

    const effBelow = isBottom ? -1 : noiseBelow;
    const effAbove = isTop ? -1 : noiseAbove;

    // Silence on all accessible floors
    const allSilent = (isBottom || effBelow === 0) && noiseCurrent === 0 && (isTop || effAbove === 0);
    if (allSilent) {
      if (isTop) return 'Остаётся на верхнем этаже 15 (полная тишина).';
      return '⬆️ Поднимается на 1 этаж ВВЕРХ (при полной тишине).';
    }

    // Compare adjacent to current
    const maxAdjacent = Math.max(effBelow, effAbove);
    if (maxAdjacent > noiseCurrent) {
      if (effAbove === effBelow) {
        return '⬆️ Оба соседних этажа одинаково громче текущего ➔ переходит ВВЕРХ!';
      }
      if (effAbove > effBelow) {
        return '⬆️ Верхний этаж громче ➔ переходит ВВЕРХ!';
      }
      return '⬇️ Нижний этаж громче ➔ переходит ВНИЗ!';
    }

    return '⏹️ Собственный этаж не тише соседних ➔ группа ОСТАЁТСЯ на месте.';
  };

  const handleNextStep = () => {
    sound.playClick();
    if (currentStep < 5) {
      onStepChange(currentStep + 1);
    } else {
      onProceedToNextRound(hadThreeNoise);
    }
  };

  const handlePrevStep = () => {
    sound.playClick();
    if (currentStep > 1) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#111822] border-2 border-red-700/70 rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl text-left relative overflow-hidden my-auto">
        
        {/* Header with Step Tracker */}
        <div className="flex items-center justify-between border-b border-[#213245] pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-600 flex items-center justify-center text-red-400">
              <Skull className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold tracking-widest text-red-400 uppercase">
                ПОМОЩНИК КОНЦА РАУНДА • ШАГ {currentStep} ИЗ 5
              </div>
              <h2 className="text-lg sm:text-xl font-mono font-black text-white">
                РАУНД {currentRound} ИЗ {maxRounds}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            title="Закрыть (прогресс сохранится)"
            className="p-2 rounded-xl bg-[#172332] hover:bg-[#203144] text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-5 gap-1.5 mb-5 text-[11px] font-mono font-bold">
          {[
            { num: 1, label: '1. Движение' },
            { num: 2, label: '2. Схватки' },
            { num: 3, label: '3. Спавн' },
            { num: 4, label: '4. События' },
            { num: 5, label: '5. Откат' }
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => {
                sound.playClick();
                onStepChange(s.num);
              }}
              className={`p-1.5 rounded-lg border text-center transition cursor-pointer truncate ${
                currentStep === s.num
                  ? 'bg-red-950 border-red-500 text-red-300 shadow'
                  : currentStep > s.num
                  ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-400'
                  : 'bg-[#151f2b] border-[#223040] text-gray-500'
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* STEP 1: MOVEMENT */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#16212e] border border-[#273a4e]">
              <div className="font-mono font-bold text-sm text-cyan-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span>Шаг 1: Движение групп заражённых на столе</span>
              </div>
              <p className="text-xs font-mono text-gray-300 leading-relaxed mb-3">
                Каждая группа заражённых привлекается звуком. Сравните уровень шума на текущем этаже каждой группы с соседними этажами:
              </p>
              <ul className="pl-4 space-y-1.5 list-disc text-xs font-mono text-gray-300">
                <li>Если на соседнем этаже шум строго выше — группа переходит туда.</li>
                <li>Если оба соседних одинаково громче текущего — группа выбирает <b>верхний</b> этаж.</li>
                <li>Если собственный этаж не тише соседних — группа остаётся на месте.</li>
                <li><b>При полной тишине на всех 3 этажах</b> — группа поднимается на 1 этаж ВВЕРХ.</li>
              </ul>
            </div>

            {/* Optional Collapsible Noise Calculator Helper */}
            <div className="border border-slate-700/60 rounded-xl bg-[#0f1722] p-3 text-xs font-mono">
              <button
                type="button"
                onClick={() => setShowNoiseCalculator(!showNoiseCalculator)}
                className="w-full flex items-center justify-between text-slate-300 hover:text-white cursor-pointer"
              >
                <span className="flex items-center space-x-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>Калькулятор движения для сомнительных ситуаций</span>
                </span>
                <span className="text-[10px] text-cyan-400">{showNoiseCalculator ? '▲ Скрыть' : '▼ Проверить шум'}</span>
              </button>

              {showNoiseCalculator && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Этаж группы:</span>
                    <select
                      value={simCurrentFloor}
                      onChange={(e) => setSimCurrentFloor(Number(e.target.value))}
                      className="bg-black border border-slate-700 px-2 py-1 rounded text-white"
                    >
                      {[15, 14, 13, 12, 11, 10].map((f) => (
                        <option key={f} value={f}>Этаж {f}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div>
                      <div className="text-slate-400 mb-1">Ниже</div>
                      <div className="flex items-center justify-center space-x-1">
                        <button type="button" onClick={() => setNoiseBelow(Math.max(0, noiseBelow - 1))} className="px-2 py-0.5 rounded bg-gray-800 text-white">-</button>
                        <span className="font-bold text-amber-300">{noiseBelow} 🔊</span>
                        <button type="button" onClick={() => setNoiseBelow(Math.min(3, noiseBelow + 1))} className="px-2 py-0.5 rounded bg-gray-800 text-white">+</button>
                      </div>
                    </div>
                    <div>
                      <div className="text-cyan-300 mb-1 font-bold">Текущий этаж</div>
                      <div className="flex items-center justify-center space-x-1">
                        <button type="button" onClick={() => setNoiseCurrent(Math.max(0, noiseCurrent - 1))} className="px-2 py-0.5 rounded bg-gray-800 text-white">-</button>
                        <span className="font-bold text-amber-300">{noiseCurrent} 🔊</span>
                        <button type="button" onClick={() => setNoiseCurrent(Math.min(3, noiseCurrent + 1))} className="px-2 py-0.5 rounded bg-gray-800 text-white">+</button>
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Выше</div>
                      <div className="flex items-center justify-center space-x-1">
                        <button type="button" onClick={() => setNoiseAbove(Math.max(0, noiseAbove - 1))} className="px-2 py-0.5 rounded bg-gray-800 text-white">-</button>
                        <span className="font-bold text-amber-300">{noiseAbove} 🔊</span>
                        <button type="button" onClick={() => setNoiseAbove(Math.min(3, noiseAbove + 1))} className="px-2 py-0.5 rounded bg-gray-800 text-white">+</button>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-black/60 border border-cyan-800/80 text-cyan-200 text-center font-bold">
                    {computeMovement()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: COMBAT & RETREAT */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#16212e] border border-[#273a4e]">
              <div className="font-mono font-bold text-sm text-red-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Шаг 2: Столкновения на занятых этажах</span>
              </div>
              <p className="text-xs font-mono text-gray-300 leading-relaxed mb-3">
                Если группа заражённых оказалась на одном этаже с персонажами, команда на этом этаже выбирает:
              </p>
              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-600/60 text-emerald-200">
                  <span className="font-bold block mb-1">🛡️ Вариант А: Защитить этаж</span>
                  <span>Команда сбрасывает по <b>1 любой карте действия в Откат за каждую группу</b>. Защита прикрывает сразу всех персонажей на этом этаже!</span>
                </div>

                <div className="p-3 rounded-xl bg-red-950/60 border border-red-600/60 text-red-200">
                  <span className="font-bold block mb-1">💔 Вариант Б: Отступить (или нет карт)</span>
                  <span>Каждый персонаж на этом этаже получает <b>Травму</b> (в следующем раунде выполнит 1 действие вместо 2) и отходит на соседний доступный этаж.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SPAWN & NOISE RESET */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#16212e] border border-[#273a4e]">
              <div className="font-mono font-bold text-sm text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                <Skull className="w-4 h-4 text-amber-400" />
                <span>Шаг 3: Подкрепление орды и сброс шума</span>
              </div>
              <p className="text-xs font-mono text-gray-300 leading-relaxed mb-3">
                1. Поставьте <b>+1 новую группу заражённых на 10-м этаже (Генераторная)</b> на столе.
              </p>

              {/* 3 Noise Checkbox */}
              <label className="flex items-start space-x-3 p-3.5 rounded-xl bg-black/60 border border-amber-500/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hadThreeNoise}
                  onChange={(e) => setHadThreeNoise(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-gray-600 text-red-600 focus:ring-red-500 bg-gray-900"
                />
                <div className="text-xs font-mono">
                  <span className="font-bold text-amber-300 block">
                    Достигал ли шум уровня 3 (максимум) хотя бы на одном этаже?
                  </span>
                  <span className="text-gray-400">
                    Если отмечено: поставьте <b>ещё +1 дополнительную группу</b> на 10-й этаж (всего 2 группы).
                  </span>
                </div>
              </label>

              <div className="mt-3 p-3 rounded-xl bg-[#131c27] border border-cyan-800 text-xs font-mono text-cyan-300 flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span><b>Сброс шума:</b> Уберите со стола все жетоны шума со всех этажей!</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: BUILDING CRISIS EVENTS */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#16212e] border border-[#273a4e]">
              <div className="font-mono font-bold text-sm text-purple-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                <Flame className="w-4 h-4 text-purple-400" />
                <span>Шаг 4: События здания и сюжетные сроки</span>
              </div>
              
              <div className="space-y-2.5 text-xs font-mono">
                {/* Round 3 Crisis: Pipe leak */}
                {currentRound === 3 && (
                  <div className={`p-3 rounded-xl border ${
                    leakStatus === 'repaired'
                      ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                      : 'bg-red-950/60 border-red-600 text-red-300'
                  }`}>
                    <span className="font-bold block mb-1">
                      {leakStatus === 'repaired' ? '✓ ОХЛАЖДЕНИЕ ИСПРАВНО:' : '⚠️ АВАРИЯ ОХЛАЖДЕНИЯ (КОНЕЦ РАУНДА 3):'}
                    </span>
                    <span>
                      {leakStatus === 'repaired'
                        ? 'Магистраль была вовремя починена! Генератор продолжает питать лифт и системы здания.'
                        : 'Свищ трубы на 11-м этаже не был устранен! Генератор аварийно отключился. Питание здания 220V выключено (БЛЭКАУТ). Лифт заблокирован!'}
                    </span>
                  </div>
                )}

                {/* Round 3 to 4 Boundary: Door breach */}
                {currentRound === 3 && (
                  <div className={`p-3 rounded-xl border ${
                    doorReinforced
                      ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                      : 'bg-red-950/60 border-red-600 text-red-300'
                  }`}>
                    <span className="font-bold block mb-1">
                      {doorReinforced ? '✓ ДВЕРЬ ЗАКРЫТОГО КРЫЛА ВЫДЕРЖАЛА:' : '🚨 ПРОРЫВ ЗАКРЫТОГО КРЫЛА (РАУНД 4):'}
                    </span>
                    <span>
                      {doorReinforced
                        ? 'Ригель/стяжки удержали дверь! Прорыв орды остановлен.'
                        : 'Дверь закрытого крыла на 14-м этаже сорвана с петель! Поставьте +2 группы заражённых на 14-й этаж (Медпункт) на столе!'}
                    </span>
                  </div>
                )}

                {/* Round 5: Irina deadline */}
                {currentRound === 5 && (
                  <div className={`p-3 rounded-xl border ${
                    irinaStatus === 'prepared'
                      ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                      : 'bg-red-950/60 border-red-600 text-red-300'
                  }`}>
                    <span className="font-bold block mb-1">
                      {irinaStatus === 'prepared' ? '✓ ДИСПЕТЧЕР ИРИНА СПАСЕНА:' : '✝ ИРИНА ПОГИБЛА (КОНЕЦ РАУНДА 5):'}
                    </span>
                    <span>
                      {irinaStatus === 'prepared'
                        ? 'Ирина получила первую помощь вовремя и готова к эвакуации на крыше.'
                        : 'Срок оказания помощи истек. Ирина скончалась от ран. Уберите ее фишку со стола.'}
                    </span>
                  </div>
                )}

                {/* Round 5 into 6: Radio rescue window */}
                {currentRound === 5 && (
                  <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-600 text-cyan-300">
                    <span className="font-bold block mb-1">📻 ОКНО ЭВАКУАЦИИ ПО РАДИО (С РАУНДА 6):</span>
                    <span>Спасательный борт входит в зону комплекса. Если радиовызов был подтвержден и люк открыт, команда может эвакуироваться!</span>
                  </div>
                )}

                {/* Round 6 into 7: Light rescue window */}
                {currentRound === 6 && (
                  <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-600 text-amber-300">
                    <span className="font-bold block mb-1">🚨 ОКНО СВЕТОВОЙ ЭВАКУАЦИИ (С РАУНДА 7):</span>
                    <span>Патрульный борт приближается на визуальную дистанцию. Доступна подача светового сигнала фальшфейером (#110) или фонарем (#115).</span>
                  </div>
                )}

                {/* General default narrative if no specific boundary */}
                {currentRound !== 3 && currentRound !== 5 && currentRound !== 6 && (
                  <div className="p-3 rounded-xl bg-[#111822] border border-gray-700 text-gray-300">
                    <span className="font-bold block mb-1">НОЧЬ В НЕБОСКРЕБЕ:</span>
                    <span>До рассвета осталось {maxRounds - currentRound} раундов. Согласуйте план перемещения и осмотра комнат перед началом следующего раунда.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: CARD RECOVERY */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#16212e] border border-[#273a4e]">
              <div className="font-mono font-bold text-sm text-emerald-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <span>Шаг 5: Восстановление карт действий игроков</span>
              </div>
              <div className="space-y-2 text-xs font-mono text-gray-300">
                <div className="p-2.5 rounded-lg bg-[#14202d] border border-gray-700 flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                  <span>Каждый игрок возвращает <b>1 карту из обычного Отката в руку</b>.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#14202d] border border-gray-700 flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-black font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                  <span>Все карты из <b>Глубокого отката</b> переходят в <b>обычный Откат</b>.</span>
                </div>
              </div>

              <div className="mt-3 p-3 rounded-lg bg-amber-950/40 border border-amber-600/60 text-xs font-mono text-amber-300">
                💡 Если персонаж получил Травму: в своем следующем ходу он выполняет <b>1 действие вместо 2</b>, после чего жетон Травмы сбрасывается.
              </div>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="mt-5 pt-3 border-t border-[#213245] flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2.5 rounded-xl bg-[#182330] hover:bg-[#203144] text-gray-300 text-xs font-mono font-bold transition cursor-pointer"
            >
              ← Назад
            </button>
          ) : (
            <div></div>
          )}

          <button
            type="button"
            onClick={handleNextStep}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 hover:from-red-500 to-amber-600 hover:to-amber-500 text-white font-mono font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 flex items-center space-x-1.5 cursor-pointer"
          >
            <span>
              {currentStep === 1
                ? 'Группы передвинуты ➔'
                : currentStep === 2
                ? 'Столкновения разрешены ➔'
                : currentStep === 3
                ? 'Подкрепление выставлено ➔'
                : currentStep === 4
                ? 'События приняты ➔'
                : currentRound < maxRounds
                ? `Начать раунд ${currentRound + 1} ➔`
                : 'Завершить партию ➔'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
