import React, { useState } from 'react';
import {
  Trophy,
  Skull,
  RotateCcw,
  Award,
  CheckCircle2,
  ShieldCheck,
  Square,
  CheckSquare,
  Download,
  FileText,
  UserCheck,
  HeartHandshake
} from 'lucide-react';
import { sound } from '../utils/audio';
import { GameState } from '../types/game';

interface EndGameModalProps {
  gameState: GameState;
  onRestart: () => void;
}

export const EndGameModal: React.FC<EndGameModalProps> = ({
  gameState,
  onRestart
}) => {
  const isVictory = gameState.outcome === 'victory';
  const [tabletopConfirmed, setTabletopConfirmed] = useState<boolean>(!isVictory);

  // Playtest notes state (Страница 27)
  const [longestDiscussion, setLongestDiscussion] = useState('');
  const [boringEpisode, setBoringEpisode] = useState('');
  const [uselessItems, setUselessItems] = useState('');
  const [whatToChange, setWhatToChange] = useState('');
  const [clarifiedRule, setClarifiedRule] = useState('');

  const exportProtocol = () => {
    sound.playClick();
    const protocolData = {
      game: 'До рассвета: Последний рейс',
      version: '0.1.0',
      date: new Date().toLocaleDateString('ru-RU'),
      variant: gameState.variant,
      outcome: isVictory ? 'Победа' : 'Поражение',
      finalRound: gameState.currentRound,
      irinaSaved: gameState.irinaStatus === 'prepared',
      journalTransmitted: gameState.journalTransmitted,
      powerAtEnd: gameState.power,
      roofHatchOpen: gameState.roofHatchOpen,
      rescueSignal: gameState.rescueSignal,
      itemsConsumedCount: gameState.consumedItems.length,
      personalGoals: gameState.personalGoals,
      notes: {
        longestDiscussion,
        boringEpisode,
        uselessItems,
        whatToChange,
        clarifiedRule
      }
    };

    const blob = new Blob([JSON.stringify(protocolData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playtest_protocol_round${gameState.currentRound}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div
        className={`bg-[#101722] border-2 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl my-auto text-left relative overflow-hidden ${
          isVictory && tabletopConfirmed ? 'border-emerald-500/80' : 'border-red-900/80'
        }`}
      >
        {/* Glow */}
        <div
          className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
            isVictory ? 'bg-emerald-600/15' : 'bg-red-600/15'
          }`}
        ></div>

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-4 border-b border-gray-800 pb-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                isVictory && tabletopConfirmed
                  ? 'bg-emerald-950 border-2 border-emerald-500 text-emerald-400'
                  : 'bg-red-950 border-2 border-red-500 text-red-400'
              }`}
            >
              {isVictory && tabletopConfirmed ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
            </div>
            <div>
              <div
                className={`text-xs font-mono font-bold tracking-widest uppercase ${
                  isVictory && tabletopConfirmed ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                РАУНД {gameState.currentRound} ИЗ {gameState.maxRounds} • {isVictory ? 'ЭВАКУАЦИЯ УСПЕШНА' : 'ПОРАЖЕНИЕ'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-mono uppercase tracking-wide">
                {isVictory && tabletopConfirmed ? 'КОМАНДА ПЕРЕЖИЛА ЭТУ НОЧЬ!' : isVictory ? 'ПОДТВЕРЖДЕНИЕ ЭВАКУАЦИИ' : 'БОРТ УШЕЛ • РАССВЕТ В ЗДАНИИ'}
              </h1>
            </div>
          </div>

          {/* Tabletop Condition Confirmation */}
          {isVictory && !tabletopConfirmed && (
            <div className="p-4 rounded-2xl bg-[#16202c] border border-amber-600/70 text-left space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs font-bold uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>Проверка физических условий на столе (Страница 2):</span>
              </div>
              <p className="text-xs text-gray-300 font-mono">
                Цифровые условия выполнены. Подтвердите расположение фишек на физическом поле:
              </p>

              <div
                onClick={() => {
                  sound.playClick();
                  setTabletopConfirmed(true);
                }}
                className="p-3.5 rounded-xl bg-[#192738] hover:bg-[#20334a] border border-cyan-500/60 transition cursor-pointer flex items-center space-x-3"
              >
                <div className="text-cyan-400">
                  <Square className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-white font-mono">
                  Все три персонажа находятся на этаже 15, и на этом этаже нет групп заражённых
                </span>
              </div>
            </div>
          )}

          {/* Narrative Outcomes Summary (4 Key Results) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#141d28] border border-gray-800">
              <span className="text-gray-400 block text-[10px]">СПАСЕНИЕ:</span>
              <span className={isVictory ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {isVictory ? 'Команда на борту ✓' : 'Не успели ✗'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#141d28] border border-gray-800">
              <span className="text-gray-400 block text-[10px]">ИРИНА:</span>
              <span className={gameState.irinaStatus === 'prepared' ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {gameState.irinaStatus === 'prepared' ? 'Спасена на борту ✓' : 'Осталась в здании'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#141d28] border border-gray-800">
              <span className="text-gray-400 block text-[10px]">СВИДЕТЕЛЬСТВА:</span>
              <span className={gameState.journalTransmitted ? 'text-emerald-400 font-bold' : 'text-gray-400'}>
                {gameState.journalTransmitted ? 'Журнал передан ✓' : 'Не переданы'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#141d28] border border-gray-800">
              <span className="text-gray-400 block text-[10px]">ЭНЕРГОСЕТЬ:</span>
              <span className={gameState.power ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                {gameState.power ? 'Питание активно ✓' : 'Обесточено ⚡'}
              </span>
            </div>
          </div>

          {/* Playtest Protocol Form (Страница 27) */}
          <div className="p-4 rounded-2xl bg-[#131c26] border border-[#213346] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase">
                <FileText className="w-4 h-4" />
                <span>Протокол плейтеста (Заметки разработчика):</span>
              </div>
              <button
                type="button"
                onClick={exportProtocol}
                className="px-3 py-1 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать протокол JSON</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-gray-400 block text-[11px] mb-1">
                  Решение, которое обсуждали дольше всего:
                </label>
                <input
                  type="text"
                  value={longestDiscussion}
                  onChange={(e) => setLongestDiscussion(e.target.value)}
                  placeholder="e.g. Держать ли питание или отдать хомут..."
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-gray-400 block text-[11px] mb-1">
                  Эпизод без интересного выбора:
                </label>
                <input
                  type="text"
                  value={boringEpisode}
                  onChange={(e) => setBoringEpisode(e.target.value)}
                  placeholder="e.g. Раунд 6 в ожидании окна спасения..."
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-gray-400 block text-[11px] mb-1">
                  Предметы, которым не нашли применения:
                </label>
                <input
                  type="text"
                  value={uselessItems}
                  onChange={(e) => setUselessItems(e.target.value)}
                  placeholder="e.g. Стропа #118, стяжки #106..."
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-gray-400 block text-[11px] mb-1">
                  Что изменить в плане повторной партии:
                </label>
                <input
                  type="text"
                  value={whatToChange}
                  onChange={(e) => setWhatToChange(e.target.value)}
                  placeholder="e.g. Сразу нести лом на крышу..."
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={() => {
                sound.playClick();
                onRestart();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 hover:from-red-500 to-amber-600 hover:to-amber-500 text-white font-mono font-black uppercase tracking-wider text-sm transition shadow-lg shadow-red-950/60 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Начать новую партию</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
