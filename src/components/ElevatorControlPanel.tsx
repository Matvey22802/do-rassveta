import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Lock,
  Zap,
  ZapOff,
  Bell,
  X,
  Footprints,
  Users,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { sound } from '../utils/audio';
import { RoomStatus, Character } from '../types/game';

export interface ElevatorFloorInfo {
  floorNumber: number;
  roomId: string;
  name: string;
  shortLabel: string;
  badge: string;
  isPathPoint?: 'pathA' | 'pathB';
}

export const ELEVATOR_FLOORS: ElevatorFloorInfo[] = [
  { floorNumber: 15, roomId: 'floor_15', name: 'Диспетчерская и люк', shortLabel: '15 ЭТАЖ', badge: 'КРЫША • РАДИОСТАНЦИЯ', isPathPoint: 'pathB' },
  { floorNumber: 14, roomId: 'floor_14', name: 'Медпункт', shortLabel: '14 ЭТАЖ', badge: 'ИРИНА • ЗАКРЫТОЕ КРЫЛО' },
  { floorNumber: 13, roomId: 'floor_13', name: 'Комната отдыха', shortLabel: '13 ЭТАЖ', badge: 'СТАРТ • ЛАУНЖ' },
  { floorNumber: 12, roomId: 'floor_12', name: 'Архив документов', shortLabel: '12 ЭТАЖ', badge: 'СХЕМЫ • СЕЙФ #203' },
  { floorNumber: 11, roomId: 'floor_11', name: 'Техсектор', shortLabel: '11 ЭТАЖ', badge: 'МАГИСТРАЛЬ • ВОДА' },
  { floorNumber: 10, roomId: 'floor_10', name: 'Генераторная', shortLabel: '10 ЭТАЖ', badge: 'РЕЛЕ • ПИТАНИЕ 220V', isPathPoint: 'pathA' }
];

interface ElevatorControlPanelProps {
  currentFloor: number;
  activeCharacter: Character;
  allCharacters: Character[];
  characterFloors: Record<string, number>;
  hasMovedThisTurn: boolean;
  powerState: 'online' | 'warning' | 'blackout';
  roomStatuses: Record<string, RoomStatus>;
  onTravel: (destFloor: number, method: 'elevator' | 'stairs') => void;
  onStay: () => void;
  onTogglePower: () => void;
  isOpenControlled?: boolean;
  onOpenControlledChange?: (open: boolean) => void;
  onPassTurn?: () => void;
}

export const ElevatorControlPanel: React.FC<ElevatorControlPanelProps> = ({
  currentFloor,
  activeCharacter,
  allCharacters,
  characterFloors,
  hasMovedThisTurn,
  powerState,
  roomStatuses,
  onTravel,
  onStay,
  onTogglePower,
  isOpenControlled,
  onOpenControlledChange,
  onPassTurn
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedFloorPending, setSelectedFloorPending] = useState<number | null>(null);

  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalOpen;
  const setIsOpen = (open: boolean) => {
    setInternalOpen(open);
    if (onOpenControlledChange) onOpenControlledChange(open);
  };

  const isBlackout = powerState === 'blackout';
  const currentFloorInfo = ELEVATOR_FLOORS.find((f) => f.floorNumber === currentFloor) || ELEVATOR_FLOORS[3];

  const handlePressFloorButton = (destFloor: number) => {
    if (hasMovedThisTurn || destFloor === currentFloor || isBlackout) return;

    sound.playElevatorBeep();
    setSelectedFloorPending(destFloor);

    // Short tactile delay before elevator starts rolling
    setTimeout(() => {
      setSelectedFloorPending(null);
      setIsOpen(false);
      onTravel(destFloor, 'elevator');
    }, 280);
  };

  const handlePressStairsButton = (destFloor: number) => {
    if (hasMovedThisTurn || destFloor === currentFloor) return;
    sound.playFootsteps();
    setIsOpen(false);
    onTravel(destFloor, 'stairs');
  };

  return (
    <>
      {/* 1. COLLAPSED SLIM FLOATING STATUS PILL (NEVER BLOCKS ARTWORK) */}
      {!isOpen && (
        <div className="flex items-center justify-between bg-[#0b1017]/95 border-2 border-[#1c2a38] rounded-2xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-md transition-all">
          {/* Left: Interactive Elevator Summon Pill */}
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => {
                sound.playElevatorBeep();
                setIsOpen(true);
              }}
              title="Открыть пульт управления лифтом"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#172333] to-[#203144] hover:from-[#203144] hover:to-[#2b415a] border-2 border-cyan-500/60 hover:border-cyan-400 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-2.5 shadow-lg active:scale-95 transition cursor-pointer"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></div>
              <span className="text-cyan-300">🛗 ПУЛЬТ ЛИФТА</span>
              <span className="px-2 py-0.5 rounded bg-black/80 text-amber-300 border border-amber-500/50 text-[11px] font-black">
                FL {currentFloor}
              </span>
            </button>

            {/* Current Room title */}
            <div className="hidden md:flex flex-col text-left">
              <span className="text-[10px] font-mono text-[#8b949e] uppercase tracking-wider">
                Текущий отсек
              </span>
              <span className="text-xs font-mono font-bold text-gray-200">
                {currentFloorInfo.name}
              </span>
            </div>
          </div>

          {/* Center: Hero Turn Movement Indicator */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-gray-400 hidden sm:inline">
              Ход: <b className="text-amber-400">{activeCharacter.name}</b>
            </span>

            {hasMovedThisTurn ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-mono text-[11px] font-bold flex items-center space-x-1">
                <span>Перемещение исчерпано ✓</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-600 text-amber-300 font-mono text-[11px] font-bold animate-pulse">
                Доступна 1 поездка
              </span>
            )}
          </div>

          {/* Right: Power Grid State Toggle & End Turn */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onTogglePower();
              }}
              title={isBlackout ? 'Включить электросеть' : 'Имитировать аварию сети (Блекаут)'}
              className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
                isBlackout
                  ? 'bg-red-950/90 border-red-500 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
                  : 'bg-[#131d28] hover:bg-[#1a2736] border-[#25394d] text-cyan-300'
              }`}
            >
              {isBlackout ? <ZapOff className="w-3.5 h-3.5 text-red-400" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
              <span className="hidden lg:inline">{isBlackout ? 'ОБЕСТОЧЕНО' : 'СЕТЬ 220V'}</span>
            </button>

            {onPassTurn && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onPassTurn();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#1b2532] hover:bg-[#253447] border border-[#2d4054] text-gray-200 hover:text-white font-mono text-xs font-bold transition flex items-center space-x-1"
              >
                <span>Конец хода</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. REALISTIC ELEVATOR CAR OPERATING PANEL (COP) MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn">
          {/* Authentic Brushed Steel Elevator Panel Frame */}
          <div className="relative w-full max-w-xl bg-gradient-to-b from-[#1b232c] via-[#141b22] to-[#0c1117] border-4 border-[#2f4052] rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-left flex flex-col justify-between">
            {/* Top Corner Bolts & Hazard Caution Accent */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#2b3a4a]">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#465a70] shadow-inner"></div>
                <span className="font-mono text-[11px] font-black tracking-widest text-[#8b9ba8] uppercase">
                  SKYLINE CARRIER ELEVATOR // MOD-14
                </span>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-xl bg-[#1c2836] hover:bg-[#28394d] text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TOP DIGITAL DOT-MATRIX DISPLAY (AUTHENTIC LED MATRIX LOOK) */}
            <div className="my-4 p-3.5 rounded-2xl bg-black border-2 border-[#2a3848] shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] flex items-center justify-between">
              {/* Left Floor Numeric Indicator */}
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-xl bg-[#1a0f00] border border-amber-600/70 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <span className="font-mono font-black text-3xl sm:text-4xl text-amber-400 tracking-wider">
                    0{currentFloor}
                  </span>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="text-amber-500 font-mono font-black text-base animate-pulse">
                      ▲
                    </span>
                    <span className="font-mono text-sm sm:text-base font-black text-amber-300 uppercase tracking-wide">
                      {currentFloorInfo.shortLabel}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">
                    {currentFloorInfo.name}
                  </span>
                </div>
              </div>

              {/* Right Power & Status Ticker */}
              <div className="text-right flex flex-col items-end">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider flex items-center space-x-1 ${
                  isBlackout
                    ? 'bg-red-950 border border-red-500 text-red-300 animate-pulse'
                    : 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                }`}>
                  {isBlackout ? <ZapOff className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                  <span>{isBlackout ? 'ОБЕСТОЧЕНО' : 'СЕТЬ В НОРМЕ'}</span>
                </span>
                <span className="text-[10px] font-mono text-gray-500 mt-1">
                  ГЕРОЙ: {activeCharacter.name.toUpperCase()}
                </span>
              </div>
            </div>

            {/* MAIN FLOOR BUTTONS SECTION */}
            {hasMovedThisTurn ? (
              /* Already moved notice */
              <div className="my-4 p-4 rounded-2xl bg-amber-950/60 border border-amber-600 text-amber-300 font-mono text-xs text-center flex flex-col items-center justify-center space-y-2">
                <ShieldAlert className="w-6 h-6 text-amber-400" />
                <span className="font-bold">
                  {activeCharacter.name} уже переместился в этом раунде!
                </span>
                <p className="text-[11px] text-gray-300 max-w-sm">
                  За раунд каждый игрок совершает ровно 1 поездку на лифте. Вы можете исследовать текущую комнату или передать ход следующему герою.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setIsOpen(false);
                  }}
                  className="mt-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-mono font-black text-xs uppercase tracking-wider"
                >
                  Остаться на этаже 0{currentFloor}
                </button>
              </div>
            ) : isBlackout ? (
              /* BLACKOUT MODE: STAIRCASE EMERGENCY HANDLE (±1 FLOOR) */
              <div className="my-3 p-4 rounded-2xl bg-red-950/40 border-2 border-red-600/80 shadow-lg text-left">
                <div className="flex items-center space-x-2 text-red-400 font-mono text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>АВАРИЙНЫЙ РЕЖИМ // ЛИФТ ОБЕСТОЧЕН</span>
                </div>
                <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                  Электропривод лебедки обесточен! Доступен только ручной переход по пожарной лестнице на <b>ровно 1 соседний этаж</b>.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={currentFloor >= 6}
                    onClick={() => handlePressStairsButton(currentFloor + 1)}
                    className={`p-3.5 rounded-2xl border-2 font-mono font-black text-xs uppercase tracking-wider flex items-center justify-between transition ${
                      currentFloor >= 6
                        ? 'bg-[#12161f] border-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-950 to-amber-950 hover:from-red-900 hover:to-amber-900 border-red-500 text-white shadow-lg active:scale-95 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <ChevronUp className="w-5 h-5 text-amber-400" />
                      <span>ВВЕРХ: FL 0{currentFloor + 1}</span>
                    </div>
                    <Footprints className="w-4 h-4 text-amber-400" />
                  </button>

                  <button
                    type="button"
                    disabled={currentFloor <= 1}
                    onClick={() => handlePressStairsButton(currentFloor - 1)}
                    className={`p-3.5 rounded-2xl border-2 font-mono font-black text-xs uppercase tracking-wider flex items-center justify-between transition ${
                      currentFloor <= 1
                        ? 'bg-[#12161f] border-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-950 to-amber-950 hover:from-red-900 hover:to-amber-900 border-red-500 text-white shadow-lg active:scale-95 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <ChevronDown className="w-5 h-5 text-amber-400" />
                      <span>ВНИЗ: FL 0{currentFloor - 1}</span>
                    </div>
                    <Footprints className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>
            ) : (
              /* REAL ELEVATOR BUTTON MATRIX (6 ROUND INDUSTRIAL BUTTONS) */
              <div className="my-2 space-y-2">
                <div className="text-[11px] font-mono text-[#8b9ba8] uppercase tracking-wider flex items-center justify-between mb-1">
                  <span>НАЖМИТЕ КНОПКУ ЭТАЖА НАЗНАЧЕНИЯ:</span>
                  <span className="text-cyan-400 font-bold">Лифт готов к отправке</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ELEVATOR_FLOORS.map((f) => {
                    const isCurrent = f.floorNumber === currentFloor;
                    const isPending = selectedFloorPending === f.floorNumber;

                    // Heroes currently on this floor
                    const heroesOnFloor = allCharacters.filter(
                      (c) => (characterFloors[c.id] || 2) === f.floorNumber
                    );

                    return (
                      <button
                        key={f.floorNumber}
                        type="button"
                        disabled={isCurrent}
                        onClick={() => handlePressFloorButton(f.floorNumber)}
                        className={`p-2.5 sm:p-3 rounded-2xl border-2 transition-all flex items-center justify-between text-left group cursor-pointer ${
                          isCurrent
                            ? 'bg-cyan-950/70 border-cyan-400/90 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                            : isPending
                            ? 'bg-amber-950/90 border-amber-400 scale-98 shadow-[0_0_20px_rgba(251,191,36,0.5)]'
                            : 'bg-[#15202c] hover:bg-[#1f3042] border-[#293d52] hover:border-cyan-400/80 active:scale-98'
                        }`}
                      >
                        {/* Physical Round Elevator Button Face */}
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center font-mono font-black text-lg transition-all shadow-md ${
                              isCurrent
                                ? 'bg-cyan-400 text-black border-2 border-white ring-4 ring-cyan-400/30'
                                : isPending
                                ? 'bg-amber-400 text-black border-2 border-white ring-4 ring-amber-400/50 animate-pulse'
                                : 'bg-[#0f1720] border-2 border-[#3b4f65] text-white group-hover:border-cyan-400 group-hover:text-cyan-300'
                            }`}
                          >
                            {f.floorNumber}
                          </div>

                          {/* Floor Details */}
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-xs sm:text-sm text-white group-hover:text-cyan-200 transition">
                              {f.name}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                              {f.badge}
                            </span>
                          </div>
                        </div>

                        {/* Status Pin or Character Avatars on Floor */}
                        <div className="flex flex-col items-end space-y-1">
                          {isCurrent ? (
                            <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono text-[10px] font-bold">
                              ВЫ ЗДЕСЬ
                            </span>
                          ) : isPending ? (
                            <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-400 text-amber-300 font-mono text-[10px] font-bold animate-pulse">
                              ОТПРАВКА...
                            </span>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 group-hover:text-cyan-300 group-hover:border-cyan-400 transition">
                              →
                            </div>
                          )}

                          {/* Heroes Tokens */}
                          {heroesOnFloor.length > 0 && (
                            <div className="flex items-center space-x-1">
                              {heroesOnFloor.map((hero) => (
                                <span
                                  key={hero.id}
                                  title={`Герой на этаже: ${hero.name}`}
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                                    hero.id === activeCharacter.id
                                      ? 'bg-amber-400 text-black font-black'
                                      : 'bg-black/80 text-gray-300 border border-gray-700'
                                  }`}
                                >
                                  {hero.name.slice(0, 4)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LOWER COP UTILITY BAR (DOOR OPEN/CLOSE, ALARM, TOGGLE POWER) */}
            <div className="mt-4 pt-3 border-t-2 border-[#263747] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                {/* Door Open */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playDoorSlide();
                  }}
                  title="Открыть двери лифта"
                  className="w-10 h-10 rounded-xl bg-[#172332] hover:bg-[#203144] border border-[#2b3e54] text-gray-300 hover:text-white flex items-center justify-center font-mono font-bold text-xs"
                >
                  ◄||►
                </button>

                {/* Door Close */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playDoorSlide();
                    setIsOpen(false);
                  }}
                  title="Закрыть двери и пульт"
                  className="w-10 h-10 rounded-xl bg-[#172332] hover:bg-[#203144] border border-[#2b3e54] text-gray-300 hover:text-white flex items-center justify-center font-mono font-bold text-xs"
                >
                  ►||◄
                </button>

                {/* Emergency Siren */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playAlarm();
                  }}
                  title="Аварийная сирена шахты"
                  className="w-10 h-10 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-600 text-red-300 flex items-center justify-center"
                >
                  <Bell className="w-4 h-4" />
                </button>

                {/* Network / Power Key Switch */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onTogglePower();
                  }}
                  title={isBlackout ? 'Восстановить электросеть' : 'Имитировать обесточивание (Блекаут)'}
                  className={`px-2.5 py-2 rounded-xl border font-mono text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                    isBlackout
                      ? 'bg-red-950 border-red-500 text-red-300 animate-pulse'
                      : 'bg-[#172332] hover:bg-[#203144] border-[#2b3e54] text-cyan-400'
                  }`}
                >
                  {isBlackout ? <ZapOff className="w-3.5 h-3.5 text-red-400" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
                  <span className="text-[11px]">{isBlackout ? 'ОБЕСТОЧЕНО' : 'СЕТЬ 220V'}</span>
                </button>
              </div>

              {/* Action Buttons: Stay / Close */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onStay();
                    setIsOpen(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#182330] hover:bg-[#223345] border border-[#2d4054] text-gray-300 hover:text-white font-mono text-xs font-bold transition"
                >
                  Остаться здесь
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition shadow-lg"
                >
                  Свернуть пульт
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
