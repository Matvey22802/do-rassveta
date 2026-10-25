import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Lock,
  Skull,
  Zap,
  ZapOff,
  Flame,
  ArrowRight,
  SlidersHorizontal,
  X,
  Play,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { sound } from '../utils/audio';

interface CollapsibleElevatorDockProps {
  currentFloor: number;
  activeCharacterName: string;
  hasMovedThisTurn: boolean;
  powerState: 'online' | 'warning' | 'blackout';
  roomStatuses: Record<string, string>;
  onTravel: (destinationFloor: number, method: 'elevator' | 'stairs') => void;
  onStay: () => void;
  onTogglePower: () => void;
  isOpenControlled?: boolean;
  onOpenControlledChange?: (open: boolean) => void;
}

interface FloorItem {
  floorNumber: number;
  roomId: string;
  name: string;
  tag: string;
}

const FLOORS: FloorItem[] = [
  { floorNumber: 6, roomId: 'tech_sector_roof', name: 'Крыша и техсектор', tag: 'ПУТЬ Б • ВЕРТОЛЕТ' },
  { floorNumber: 5, roomId: 'archive_office', name: 'Архив и кабинет', tag: 'СЕЙФ #203' },
  { floorNumber: 4, roomId: 'cctv_room', name: 'Комната отдыха (Камеры)', tag: 'КООРДИНАТОР' },
  { floorNumber: 3, roomId: 'generator_room', name: 'Техническое помещение', tag: 'ОХЛАЖДЕНИЕ • ПИТАНИЕ' },
  { floorNumber: 2, roomId: 'lobby', name: 'Лифтовой холл (Бункер)', tag: 'ПУТЬ А • ЛИФТ' },
  { floorNumber: 1, roomId: 'apt14a_medbay', name: 'Медпункт (Палата 14А)', tag: 'МЕДИКАМЕНТЫ' }
];

export const CollapsibleElevatorDock: React.FC<CollapsibleElevatorDockProps> = ({
  currentFloor,
  activeCharacterName,
  hasMovedThisTurn,
  powerState,
  roomStatuses,
  onTravel,
  onStay,
  onTogglePower,
  isOpenControlled,
  onOpenControlledChange
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalOpen;
  const setIsOpen = (open: boolean) => {
    setInternalOpen(open);
    if (onOpenControlledChange) onOpenControlledChange(open);
  };

  const isBlackout = powerState === 'blackout';

  const handleSelectFloor = (destFloor: number, method: 'elevator' | 'stairs') => {
    if (hasMovedThisTurn || destFloor === currentFloor) return;
    setIsOpen(false);
    onTravel(destFloor, method);
  };

  const handleStay = () => {
    setIsOpen(false);
    onStay();
  };

  return (
    <div className="relative z-30">
      {/* 1. COLLAPSED FLOATING CONTROL BAR (MINIMAL FOOTPRINT, DOES NOT CLUTTER THE SCREEN) */}
      {!isOpen && (
        <div className="flex items-center justify-between bg-[#0a0f16]/95 border-2 border-[#1e2e42] rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-md">
          {/* Left: Active Floor & Character Status */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                sound.playClick();
                setIsOpen(true);
              }}
              className={`px-3.5 py-2 rounded-xl border font-mono font-black text-xs sm:text-sm tracking-wider uppercase transition shadow-lg flex items-center space-x-2 active:scale-95 ${
                isBlackout
                  ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-600 text-amber-300'
                  : 'bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border-cyan-500/70 text-cyan-300'
              }`}
            >
              <span>{isBlackout ? '🪜 ЛЕСТНИЦА' : '🛗 ЛИФТ'}</span>
              <span className="text-white font-mono font-bold bg-black/60 px-2 py-0.5 rounded border border-white/20">
                ЭТАЖ 0{currentFloor}
              </span>
              <span className="hidden sm:inline text-xs text-gray-400">
                ({hasMovedThisTurn ? 'Ход сделан' : 'Переместиться ▲'})
              </span>
            </button>

            {/* Power Status Badge */}
            <div className="flex items-center space-x-2">
              {isBlackout ? (
                <span className="px-2.5 py-1 rounded-lg bg-red-950/90 border border-red-600/70 text-red-300 font-mono text-[11px] font-bold flex items-center space-x-1 animate-pulse">
                  <ZapOff className="w-3.5 h-3.5 text-red-400" />
                  <span>БЛЭКАУТ (ЛЕСТНИЦА ±1)</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-mono text-[11px] font-bold flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ПИТАНИЕ ОНЛАЙН</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: Quick GM Power Toggle and Turn Indicator */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                sound.playClick();
                onTogglePower();
              }}
              title="Переключить питание комплекса (Блэкаут / Сеть)"
              className="p-2 rounded-xl bg-[#141c26] hover:bg-[#1d2735] border border-[#273748] text-gray-400 hover:text-white transition text-xs font-mono font-bold flex items-center space-x-1"
            >
              <Zap className={`w-3.5 h-3.5 ${isBlackout ? 'text-gray-500' : 'text-amber-400'}`} />
              <span className="hidden md:inline">{isBlackout ? 'Восстановить сеть' : 'Тест блэкаута'}</span>
            </button>

            {!hasMovedThisTurn && (
              <button
                onClick={() => {
                  sound.playClick();
                  setIsOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition flex items-center space-x-1.5 animate-bounce"
              >
                <span>Сделать ход</span>
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. EXPANDED SLIDE-OVER ELEVATOR CONSOLE (OPENS WHEN USER WANTS TO MOVE) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="relative max-w-2xl w-full bg-[#0d141e] border-2 border-cyan-500/80 rounded-3xl p-5 sm:p-7 shadow-2xl text-left overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#172230] hover:bg-[#202f42] text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header: Mode & Character */}
            <div className="flex items-center space-x-2.5 mb-3 border-b border-[#1f2f42] pb-3">
              <div className={`p-2 rounded-xl border ${isBlackout ? 'bg-amber-950 border-amber-600 text-amber-400' : 'bg-cyan-950 border-cyan-600 text-cyan-400'}`}>
                {isBlackout ? <ZapOff className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
              </div>
              <div>
                <div className="text-xs font-mono font-bold tracking-widest uppercase text-cyan-400">
                  {isBlackout ? 'ПЕРЕМЕЩЕНИЕ: АВАРИЙНАЯ ЛЕСТНИЦА' : 'ПЕРЕМЕЩЕНИЕ: СКОРОСТНОЙ ЛИФТ'}
                </div>
                <h3 className="text-xl sm:text-2xl font-mono font-black text-white uppercase tracking-wide">
                  ХОД ГЕРОЯ: {activeCharacterName} (ЭТАЖ 0{currentFloor})
                </h3>
              </div>
            </div>

            {/* Turn Limit Notice */}
            {hasMovedThisTurn ? (
              <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-600/70 text-amber-300 font-mono text-xs sm:text-sm mb-4 flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 flex-shrink-0 text-amber-400" />
                <div>
                  <b>Перемещение уже использовано в этом раунде!</b>
                  <p className="text-xs text-gray-300 mt-0.5">
                    За один ход допускается ровно 1 поездка. Вы можете действовать в текущей локации или завершить ход.
                  </p>
                </div>
              </div>
            ) : isBlackout ? (
              /* A. BLACKOUT MODE: STAIRCASE ONLY (±1 FLOOR) */
              <div className="space-y-3 mb-6">
                <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-700/60 text-red-300 font-mono text-xs leading-relaxed">
                  ⚠️ <b>Электричество отключено!</b> Лифт заблокирован. Вы можете переместиться <b>ровно на 1 соседний этаж</b> вверх или вниз по пожарной лестнице.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Up 1 Floor */}
                  <button
                    disabled={currentFloor >= 6}
                    onClick={() => handleSelectFloor(currentFloor + 1, 'stairs')}
                    className={`p-4 rounded-2xl border font-mono font-bold text-sm tracking-wider uppercase flex items-center justify-between transition shadow-lg ${
                      currentFloor >= 6
                        ? 'bg-[#121820] border-[#1e2732] text-gray-600 cursor-not-allowed'
                        : 'bg-amber-950/80 hover:bg-amber-900 border-amber-600 text-white active:scale-95'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <ChevronUp className="w-5 h-5 text-amber-400" />
                      <span>ВВЕРХ: ЭТАЖ 0{currentFloor + 1}</span>
                    </div>
                    <span className="text-xs text-amber-300 font-normal">Лестница</span>
                  </button>

                  {/* Down 1 Floor */}
                  <button
                    disabled={currentFloor <= 1}
                    onClick={() => handleSelectFloor(currentFloor - 1, 'stairs')}
                    className={`p-4 rounded-2xl border font-mono font-bold text-sm tracking-wider uppercase flex items-center justify-between transition shadow-lg ${
                      currentFloor <= 1
                        ? 'bg-[#121820] border-[#1e2732] text-gray-600 cursor-not-allowed'
                        : 'bg-amber-950/80 hover:bg-amber-900 border-amber-600 text-white active:scale-95'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <ChevronDown className="w-5 h-5 text-amber-400" />
                      <span>ВНИЗ: ЭТАЖ 0{currentFloor - 1}</span>
                    </div>
                    <span className="text-xs text-amber-300 font-normal">Лестница</span>
                  </button>
                </div>
              </div>
            ) : (
              /* B. POWER ONLINE MODE: ELEVATOR TO ANY ACCESSIBLE FLOOR */
              <div className="space-y-2 mb-6">
                <div className="text-xs font-mono text-[#8b949e] mb-2 flex items-center justify-between">
                  <span>ВЫБЕРИТЕ ЭТАЖ НАЗНАЧЕНИЯ ДЛЯ ПОЕЗДКИ:</span>
                  <span className="text-cyan-400 font-bold">Лифт активен ✓</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[46vh] overflow-y-auto pr-1">
                  {FLOORS.map((f) => {
                    const isCurrent = f.floorNumber === currentFloor;
                    // Floors are accessible; locked compartments are handled inside the rooms
                    const isLocked = false;

                    return (
                      <button
                        key={f.floorNumber}
                        disabled={isCurrent || isLocked}
                        onClick={() => handleSelectFloor(f.floorNumber, 'elevator')}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-left group ${
                          isCurrent
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                            : isLocked
                            ? 'bg-[#12161f] border-[#1d2633] text-gray-500 cursor-not-allowed opacity-75'
                            : 'bg-[#141f2d] hover:bg-[#1c2c40] border-[#25394f] text-white hover:border-cyan-400 cursor-pointer active:scale-98'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-sm border ${
                            isCurrent
                              ? 'bg-cyan-400 text-black border-white'
                              : 'bg-black/60 border-[#2f4358] text-gray-400 group-hover:text-white'
                          }`}>
                            {f.floorNumber}
                          </span>
                          <div>
                            <div className="text-xs sm:text-sm font-mono font-bold group-hover:text-cyan-300 transition line-clamp-1">
                              {f.name}
                            </div>
                            <div className="text-[10px] font-mono text-[#8b949e]">
                              {f.tag}
                            </div>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-600">
                            ВЫ ЗДЕСЬ
                          </span>
                        ) : isLocked ? (
                          <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center space-x-1">
                            <Lock className="w-3 h-3" />
                            <span>#102</span>
                          </span>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-transform" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions: Stay on Current Floor or Close */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1e2f42] gap-3">
              <button
                onClick={handleStay}
                className="py-2.5 px-5 rounded-xl bg-[#192433] hover:bg-[#223144] border border-[#2b3e54] text-white font-mono font-bold text-xs uppercase tracking-wider transition active:scale-95"
              >
                Остаться на этаже 0{currentFloor}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition shadow-lg active:scale-95"
              >
                Свернуть пульт
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
