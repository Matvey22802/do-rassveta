import React, { useState, useEffect } from 'react';
import { Scenario } from '../types/game';
import {
  Skull,
  Play,
  RotateCcw,
  Camera,
  BookOpen,
  Volume2,
  Square as StopSquare,
  ShieldCheck,
  CheckSquare,
  Square,
  Layers,
  Clock,
  Users,
  ChevronRight,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { sound } from '../utils/audio';
import { narrator } from '../utils/narrator';
import { DiagnosticsModal } from './DiagnosticsModal';
import { CompanionGuideModal } from './CompanionGuideModal';

interface StartMenuModalProps {
  scenario: Scenario;
  hasSavedGame: boolean;
  savedGameHour?: number;
  onStartNewGame: () => void;
  onResumeGame: () => void;
  onOpenGuide?: () => void;
}

export const StartMenuModal: React.FC<StartMenuModalProps> = ({
  scenario,
  hasSavedGame,
  savedGameHour,
  onStartNewGame,
  onResumeGame
}) => {
  const [viewState, setViewState] = useState<'menu' | 'story' | 'setup' | 'boundary'>('menu');
  const [checkedBlocks, setCheckedBlocks] = useState<number[]>([]);
  const [isNarrating, setIsNarrating] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    const unsub = narrator.subscribe((speaking) => setIsNarrating(speaking));
    return () => {
      unsub();
      narrator.stop();
    };
  }, []);

  const toggleNarration = (text: string) => {
    sound.playClick();
    if (isNarrating) {
      narrator.stop();
    } else {
      narrator.speak(text);
    }
  };

  const toggleBlock = (idx: number) => {
    sound.playClick();
    if (checkedBlocks.includes(idx)) {
      setCheckedBlocks(checkedBlocks.filter((i) => i !== idx));
    } else {
      setCheckedBlocks([...checkedBlocks, idx]);
    }
  };

  const handleBeginSurvival = () => {
    narrator.stop();
    sound.playAlarm();
    onStartNewGame();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-y-auto">
      
      {/* 1. PRIMARY START SCREEN */}
      {viewState === 'menu' && (
        <div className="bg-[#121922] border-2 border-red-900/60 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative text-left overflow-hidden my-auto">
          <div className="text-center mb-6 border-b border-[#223040] pb-5">
            <div className="inline-flex p-3 bg-red-950 border border-red-700/60 rounded-2xl text-red-400 mb-2.5 shadow-lg">
              <Skull className="w-10 h-10 animate-pulse" />
            </div>
            <div className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase mb-1">
              ПРИЛОЖЕНИЕ-КОМПАНЬОН К НАСТОЛЬНОЙ ИГРЕ
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-wider">
              ДО РАССВЕТА
            </h1>
            <p className="text-xs font-mono text-gray-400 mt-1">
              Кооперативный сурвайвал-триллер в осажденном небоскребе
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#172230] border border-[#27384a] mb-5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                СЦЕНАРИЙ
              </div>
              <div className="text-base font-bold text-white font-mono">
                {scenario.chapter}: {scenario.title}
              </div>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-gray-300">
              <span className="bg-black/40 px-2 py-1 rounded border border-gray-700">👥 3 игрока</span>
              <span className="bg-black/40 px-2 py-1 rounded border border-gray-700">🏢 6 этажей</span>
              <span className="bg-black/40 px-2 py-1 rounded border border-gray-700">⏱️ 8 раундов</span>
            </div>
          </div>

          <div className="space-y-2.5 mb-5">
            <button
              data-testid="start-new-game-btn"
              onClick={() => {
                sound.playClick();
                setViewState('story');
              }}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-red-600 hover:from-red-500 to-amber-600 hover:to-amber-500 text-white font-black tracking-wider uppercase text-base shadow-xl active:scale-98 transition flex items-center justify-between border border-red-400/40 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <Play className="w-5 h-5 fill-current" />
                <span>Начать сценарий</span>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>

            {hasSavedGame && (
              <button
                data-testid="start-resume-game-btn"
                onClick={() => {
                  sound.playSuccess();
                  onResumeGame();
                }}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#192738] hover:bg-[#22354c] text-cyan-300 font-bold tracking-wider font-mono text-sm border border-cyan-500/50 transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                  <span>Продолжить партию (Раунд {savedGameHour || 1})</span>
                </div>
                <span className="text-[10px] bg-cyan-950 px-2 py-0.5 rounded text-cyan-300 border border-cyan-700/50">
                  Сохранено
                </span>
              </button>
            )}

            <button
              data-testid="start-diagnostics-btn"
              onClick={() => {
                sound.playClick();
                setIsDiagnosticsOpen(true);
              }}
              className="w-full py-3 px-5 rounded-2xl bg-[#151f2b] hover:bg-[#1d2b3c] text-gray-300 hover:text-white font-mono text-xs font-bold uppercase tracking-wider border border-[#273749] transition flex items-center space-x-3 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Проверка оборудования (камера и звук)</span>
            </button>

            <button
              data-testid="start-guide-btn"
              onClick={() => {
                sound.playClick();
                setIsGuideOpen(true);
              }}
              className="w-full py-3 px-5 rounded-2xl bg-[#151f2b] hover:bg-[#1d2b3c] text-gray-300 hover:text-white font-mono text-xs font-bold uppercase tracking-wider border border-[#273749] transition flex items-center space-x-3 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Краткая инструкция к приложению</span>
            </button>
          </div>

          <div className="text-center text-[10px] font-mono text-gray-500">
            Изображение можно развернуть на весь экран (клавиша F11)
          </div>
        </div>
      )}

      {/* 2. STORY INTRO & VICTORY OBJECTIVES */}
      {viewState === 'story' && (
        <div className="bg-[#121922] border-2 border-red-900/60 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl my-auto text-left relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#223040] pb-4 mb-5">
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
                ЭТАП 1 ИЗ 3 • ЗАВЯЗКА ИСТОРИИ
              </div>
              <h2 className="text-2xl font-black text-white font-mono">
                {scenario.chapter}: {scenario.title}
              </h2>
            </div>

            <button
              onClick={() => toggleNarration(`${scenario.title}. ${scenario.introStory.join(' ')}`)}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-[#16212e] text-cyan-300 text-xs font-mono font-bold flex items-center space-x-1.5 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isNarrating ? 'Стоп' : '🔊 Озвучить'}</span>
            </button>
          </div>

          <div className="space-y-3 mb-5 bg-[#16202c] border border-[#27384a] rounded-2xl p-4 text-sm text-[#c9d1d9] leading-relaxed">
            {scenario.introStory.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/70 to-amber-950/70 border border-red-700/50 mb-5">
            <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold mb-1">
              УСЛОВИЯ СПАСЕНИЯ КОМАНДЫ (ДО РАССВЕТА • 8 РАУНДОВ):
            </div>
            <ul className="text-xs sm:text-sm text-gray-200 space-y-1.5 list-disc pl-4 font-mono">
              <li><b>1. Доступ на крышу:</b> вскрыть гидравлический люк на 15-м этаже.</li>
              <li><b>2. Сигнал бортам:</b> установить радиосвязь (с раунда 6) или подать световой сигнал (с раунда 7).</li>
              <li><b>3. Эвакуация:</b> собраться всей командой на 15-м этаже при отсутствии там заражённых.</li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setViewState('menu')}
              className="py-3 px-5 rounded-xl bg-[#1a2533] hover:bg-[#253549] text-gray-300 font-mono text-xs font-bold uppercase cursor-pointer"
            >
              ← В меню
            </button>

            <button
              onClick={() => {
                narrator.stop();
                setViewState('setup');
              }}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono text-xs font-black uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
            >
              <span>Подготовка стола ➔</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. TABLETOP SETUP CHECKLIST (3 CLEAR BLOCKS) */}
      {viewState === 'setup' && (
        <div className="bg-[#121922] border-2 border-red-900/60 rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl my-auto text-left relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#223040] pb-4 mb-4">
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                ЭТАП 2 ИЗ 3 • ПОДГОТОВКА СТОЛА
              </div>
              <h2 className="text-xl font-black text-white font-mono">
                РАСКЛАДКА КОМПОНЕНТОВ
              </h2>
            </div>

            <button
              onClick={() => setCheckedBlocks([0, 1, 2])}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Отметить всё готовым
            </button>
          </div>

          <div className="space-y-3 mb-5 font-mono text-xs">
            {/* Block 1: Board & 6 Floor Decks */}
            <div
              onClick={() => toggleBlock(0)}
              className={`p-4 rounded-xl border transition cursor-pointer ${
                checkedBlocks.includes(0)
                  ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-200'
                  : 'bg-[#151f2b] border-[#253648] text-gray-300 hover:border-slate-500'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 text-cyan-400">
                  {checkedBlocks.includes(0) ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-gray-500" />}
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">
                    Блок 1: Поле здания и 6 стопок находок (Этажи 15 → 10)
                  </div>
                  <p className="text-gray-400 leading-relaxed text-[11px]">
                    Разложите поле небоскреба. Сформируйте 6 физических стопок находок этажей (10, 11, 12, 13, 14, 15). 
                    <b> Верхняя карта в каждой стопке открыта</b>, остальные лежат рубашкой вверх.
                  </p>
                  <div className="text-[10px] text-cyan-300 pt-1">
                    • 15 (Диспетчерская): #102, #311, #116, #110, #312, #111
                    <br />• 14 (Медпункт): #112, #309, #113, #114, #310, #118
                    <br />• 13 (Лаунж): #107, #307, #115, #117, #308, #206
                    <br />• 12 (Архив): #202, #305, #204, #203, #306, #106
                    <br />• 11 (Техсектор): #103, #303, #104, #105, #304, #205
                    <br />• 10 (Генератор): #101, #301, #201, #109, #302, #108
                  </div>
                </div>
              </div>
            </div>

            {/* Block 2: Characters, Action Cards, Discard, Secret Goals */}
            <div
              onClick={() => toggleBlock(1)}
              className={`p-4 rounded-xl border transition cursor-pointer ${
                checkedBlocks.includes(1)
                  ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-200'
                  : 'bg-[#151f2b] border-[#253648] text-gray-300 hover:border-slate-500'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 text-cyan-400">
                  {checkedBlocks.includes(1) ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-gray-500" />}
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">
                    Блок 2: Планшеты героев, 3 карты действий и закрытые личные цели
                  </div>
                  <p className="text-gray-400 leading-relaxed text-[11px]">
                    Каждый игрок берет планшет выбранного героя (Лера, Марк, Ника) и 3 стартовые карты действий в руку.
                    Определите зоны Отката и Глубокого отката. Раздайте каждому по <b>одной закрытой карте Личной цели</b> (держится в тайне!).
                  </p>
                </div>
              </div>
            </div>

            {/* Block 3: Starting Tokens */}
            <div
              onClick={() => toggleBlock(2)}
              className={`p-4 rounded-xl border transition cursor-pointer ${
                checkedBlocks.includes(2)
                  ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-200'
                  : 'bg-[#151f2b] border-[#253648] text-gray-300 hover:border-slate-500'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 text-cyan-400">
                  {checkedBlocks.includes(2) ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-gray-500" />}
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">
                    Блок 3: Стартовые фишки персонажей, лифта и угроз
                  </div>
                  <p className="text-gray-400 leading-relaxed text-[11px]">
                    • Поставьте фишки всех трёх героев и кабину лифта на <b>13-й этаж (Комната отдыха)</b>.
                    <br />• Поставьте фишку Ирины на <b>14-й этаж (Медпункт)</b>.
                    <br />• Поставьте 1 группу заражённых на <b>12-й этаж (Архив)</b>. Жетоны шума равны 0.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setViewState('story')}
              className="py-3 px-5 rounded-xl bg-[#1a2533] hover:bg-[#253549] text-gray-300 font-mono text-xs font-bold uppercase cursor-pointer"
            >
              ← Назад
            </button>

            <button
              onClick={() => setViewState('boundary')}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono text-xs font-black uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
            >
              <span>Далее: Правила взаимодействия ➔</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. CLEAR BOUNDARY DISCLAIMER & START BUTTON */}
      {viewState === 'boundary' && (
        <div className="bg-[#121922] border-2 border-red-900/60 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl my-auto text-left relative overflow-hidden">
          <div className="border-b border-[#223040] pb-4 mb-5">
            <div className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
              ЭТАП 3 ИЗ 3 • РАЗДЕЛЕНИЕ СТОЛА И ЭКРАНА
            </div>
            <h2 className="text-xl font-black text-white font-mono mt-1">
              КАК ИСПОЛЬЗОВАТЬ ЭТО ПРИЛОЖЕНИЕ
            </h2>
          </div>

          {/* Key Principle Box */}
          <div className="p-5 rounded-2xl bg-cyan-950/40 border-2 border-cyan-500/80 mb-5 text-gray-200 space-y-3 font-mono text-xs sm:text-sm">
            <div className="text-cyan-300 font-bold uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Главное правило гибридной игры:</span>
            </div>
            
            <p className="leading-relaxed bg-black/50 p-3 rounded-xl border border-cyan-800 text-cyan-100">
              «Обсудите план и очерёдность. <b>Перемещения, обыск стопок, бой и карты действий выполняются на физическом столе.</b> 
              Здесь вы осматриваете помещения здания, проверяете и применяете найденные карты к объектам и проводите завершение раунда.»
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 rounded-lg bg-[#111822] border border-gray-700">
                <span className="text-amber-300 font-bold block mb-1">🎲 НА СТОЛЕ:</span>
                <span className="text-gray-400">• Передвижение фишек<br />• Взятие карт из стопок<br />• Трата действий и Откат<br />• Жетоны шума и бой</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#111822] border border-gray-700">
                <span className="text-cyan-300 font-bold block mb-1">💻 В ТЕРМИНАЛЕ:</span>
                <span className="text-gray-400">• Осмотр комнат и узлов<br />• Сканирование карт с QR<br />• Статусы аварий и сроки<br />• Помощник конца раунда</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setViewState('setup')}
              className="py-3 px-5 rounded-xl bg-[#1a2533] hover:bg-[#253549] text-gray-300 font-mono text-xs font-bold uppercase cursor-pointer"
            >
              ← К подготовке
            </button>

            <button
              data-testid="briefing-start-btn"
              onClick={handleBeginSurvival}
              className="py-4 px-8 rounded-2xl bg-gradient-to-r from-red-600 hover:from-red-500 to-amber-600 hover:to-amber-500 text-white font-mono font-black text-sm uppercase tracking-wider shadow-2xl shadow-red-950/80 active:scale-95 transition flex items-center space-x-2 border border-red-400/40 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Начать выживание • Раунд 1</span>
            </button>
          </div>
        </div>
      )}

      {/* Diagnostics Modal */}
      {isDiagnosticsOpen && (
        <DiagnosticsModal onClose={() => setIsDiagnosticsOpen(false)} />
      )}

      {/* Quick Guide Modal */}
      {isGuideOpen && (
        <CompanionGuideModal onClose={() => setIsGuideOpen(false)} />
      )}
    </div>
  );
};
