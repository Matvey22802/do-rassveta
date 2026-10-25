import React, { useState, useEffect, useCallback } from 'react';
import { Room, RoomStatus, InteractableObject, Character } from '../types/game';
import {
  Users,
  BookOpen,
  Target,
  HeartPulse,
  LayoutGrid,
  Zap,
  ZapOff,
  ArrowRight,
  ShieldAlert,
  Skull,
  UserCheck
} from 'lucide-react';
import { sound } from '../utils/audio';
import { AuthenticRoomStage } from './AuthenticRoomStage';
import { ElevatorControlPanel } from './ElevatorControlPanel';

interface ElevatorTowerViewProps {
  rooms: Room[];
  roomStatuses: Record<string, RoomStatus>;
  characters: Character[];
  characterFloors?: Record<string, number>;
  activeFloorNum?: number;
  onUpdateFloors?: (newFloors: Record<string, number>, newActiveFloor: number) => void;
  resolvedInteractables: string[];
  currentHour: number;
  maxHours: number;
  onOpenScanner: (interactable: InteractableObject) => void;
  onAdvanceHour: () => void;
  onOpenReference: (tab: 'characters' | 'catalog' | 'goals' | 'traumas') => void;
  paths: {
    pathA: { name: string; description: string; requirements: string[] };
    pathB: { name: string; description: string; requirements: string[] };
  };
  onSwitchToCutaway?: () => void;
}

// Floor mapping from Top (6) to Bottom (1)
const FLOOR_TO_ROOM_ID: Record<number, string> = {
  6: 'tech_sector_roof',
  5: 'archive_office',
  4: 'cctv_room',
  3: 'generator_room',
  2: 'lobby',
  1: 'apt14a_medbay'
};

export const ElevatorTowerView: React.FC<ElevatorTowerViewProps> = ({
  rooms,
  roomStatuses,
  characters,
  characterFloors: externalCharacterFloors,
  activeFloorNum: externalActiveFloorNum,
  onUpdateFloors,
  resolvedInteractables,
  currentHour,
  maxHours,
  onOpenScanner,
  onAdvanceHour,
  onOpenReference,
  paths,
  onSwitchToCutaway
}) => {
  // 1. Character tracking & Turn state
  const [activeCharIndex, setActiveCharIndex] = useState<number>(0);
  const [isElevatorDockOpen, setIsElevatorDockOpen] = useState<boolean>(false);

  const [characterFloors, setCharacterFloors] = useState<Record<string, number>>(() => {
    if (externalCharacterFloors) return externalCharacterFloors;
    const initial: Record<string, number> = {};
    characters.forEach((c, idx) => {
      initial[c.id] = idx === 0 ? 3 : 2;
    });
    return initial;
  });

  // Sync external floor changes if passed
  useEffect(() => {
    if (externalCharacterFloors) {
      setCharacterFloors(externalCharacterFloors);
    }
  }, [externalCharacterFloors]);

  // Track if active character has moved in their current turn
  const [hasMovedMap, setHasMovedMap] = useState<Record<string, boolean>>({});

  // 2. Power Grid state: 'online' | 'warning' | 'blackout'
  const [powerState, setPowerState] = useState<'online' | 'warning' | 'blackout'>('online');

  // 3. Elevator animation state
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [transitionMethod, setTransitionMethod] = useState<'elevator' | 'stairs'>('elevator');
  const [doorsClosed, setDoorsClosed] = useState<boolean>(false);

  // Active character
  const activeChar = characters[activeCharIndex] || characters[0];
  const activeFloorNum = externalActiveFloorNum !== undefined
    ? externalActiveFloorNum
    : (characterFloors[activeChar.id] || 2);

  const activeRoomId = FLOOR_TO_ROOM_ID[activeFloorNum] || 'lobby';
  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];
  const activeRoomStatus = roomStatuses[activeRoom.id] || activeRoom.status;

  // Victory status checks
  const pathACooling = resolvedInteractables.includes('pipe_cooling');
  const pathAPower = resolvedInteractables.includes('diesel_gen');
  const pathAElevator = resolvedInteractables.includes('cargo_elevator');

  const pathBPower = resolvedInteractables.includes('diesel_gen');
  const pathBRoof = resolvedInteractables.includes('roof_hatch');

  // Automatically restore power if diesel generator and cooling are fixed
  useEffect(() => {
    if (pathAPower && powerState === 'blackout') {
      sound.playPowerUp();
      setPowerState('online');
    }
  }, [pathAPower, powerState]);

  // Handle Travel (Elevator or Stairs)
  const handleTravel = useCallback((destFloor: number, method: 'elevator' | 'stairs') => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTransitionMethod(method);
    setDoorsClosed(true);

    if (method === 'elevator') {
      const distance = Math.abs(destFloor - activeFloorNum);
      const duration = Math.min(0.65, 0.35 + distance * 0.07);
      sound.playElevatorMotor(duration);

      setTimeout(() => {
        const newFloors = {
          ...characterFloors,
          [activeChar.id]: destFloor
        };
        setCharacterFloors(newFloors);
        if (onUpdateFloors) onUpdateFloors(newFloors, destFloor);

        setHasMovedMap((prev) => ({
          ...prev,
          [activeChar.id]: true
        }));
        sound.playElevatorChime();

        // Open doors
        setTimeout(() => {
          setDoorsClosed(false);
          setIsTransitioning(false);
        }, 220);
      }, duration * 1000);
    } else {
      // Stairs navigation
      sound.playFootsteps();

      setTimeout(() => {
        const newFloors = {
          ...characterFloors,
          [activeChar.id]: destFloor
        };
        setCharacterFloors(newFloors);
        if (onUpdateFloors) onUpdateFloors(newFloors, destFloor);

        setHasMovedMap((prev) => ({
          ...prev,
          [activeChar.id]: true
        }));

        setTimeout(() => {
          setDoorsClosed(false);
          setIsTransitioning(false);
        }, 200);
      }, 550);
    }
  }, [activeFloorNum, activeChar.id, characterFloors, onUpdateFloors, isTransitioning]);

  // Handle stay on current floor
  const handleStay = () => {
    sound.playClick();
    setHasMovedMap((prev) => ({
      ...prev,
      [activeChar.id]: true
    }));
  };

  // Toggle Power state (online / blackout)
  const handleTogglePower = () => {
    if (powerState === 'online') {
      sound.playPowerDown();
      setPowerState('blackout');
    } else {
      sound.playPowerUp();
      setPowerState('online');
    }
  };

  // Switch Active Character
  const handleSelectCharacter = (index: number) => {
    sound.playClick();
    setActiveCharIndex(index);
    const targetChar = characters[index];
    const targetFloor = characterFloors[targetChar.id] || 2;
    if (onUpdateFloors) {
      onUpdateFloors(characterFloors, targetFloor);
    }
  };

  // End turn & pass to next hero
  const handleEndTurn = () => {
    sound.playClick();
    const nextIdx = (activeCharIndex + 1) % characters.length;
    handleSelectCharacter(nextIdx);
  };

  return (
    <div className="flex flex-col flex-1 max-w-[1600px] mx-auto w-full px-2 sm:px-4 lg:px-6 py-2 select-none">
      {/* 1. TOP STRATEGIC APOCALYPTIC BAR (CRISIS TIMER & OBJECTIVES) */}
      <div className="mb-2 bg-[#090e15]/95 border border-[#1b2b3b] rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Left: Code Black Dawn Ticker */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="px-2.5 py-1 rounded-xl bg-red-950/90 border border-red-500/80 flex items-center space-x-1.5 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="font-mono text-[11px] font-black text-red-300 uppercase tracking-widest">
              КОД «ЧЕРНЫЙ РАССВЕТ»
            </span>
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-[11px] font-mono text-[#8b949e]">
              Авиаудар в 06:00 // До зачистки: {maxHours - currentHour} ч.
            </span>
          </div>
        </div>

        {/* Center: Victory Path Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Path A */}
          <div
            className={`px-3 py-1 rounded-xl border font-mono text-xs flex items-center space-x-2 transition ${
              pathAElevator && pathAPower && pathACooling
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                : 'bg-[#101822] border-[#223547] text-gray-300'
            }`}
          >
            <span className="font-bold text-cyan-400">ПУТЬ А (БУНКЕР):</span>
            <span className={pathACooling ? 'text-emerald-400' : 'text-gray-500'}>
              [Труба {pathACooling ? '✓' : '✗'}]
            </span>
            <span className={pathAPower ? 'text-emerald-400' : 'text-gray-500'}>
              [Дизель {pathAPower ? '✓' : '✗'}]
            </span>
            <span className={pathAElevator ? 'text-emerald-400' : 'text-gray-500'}>
              [Лифт {pathAElevator ? '✓' : '... '}]
            </span>
          </div>

          {/* Path B */}
          <div
            className={`px-3 py-1 rounded-xl border font-mono text-xs flex items-center space-x-2 transition ${
              pathBRoof && pathBPower
                ? 'bg-amber-950/80 border-amber-400 text-amber-300'
                : 'bg-[#101822] border-[#223547] text-gray-300'
            }`}
          >
            <span className="font-bold text-amber-400">ПУТЬ Б (КРЫША):</span>
            <span className={pathBPower ? 'text-emerald-400' : 'text-gray-500'}>
              [Дизель {pathBPower ? '✓' : '✗'}]
            </span>
            <span className={pathBRoof ? 'text-emerald-400' : 'text-gray-500'}>
              [Люк {pathBRoof ? '✓' : '... '}]
            </span>
          </div>
        </div>

        {/* Right: Switch to 2D Tower Cutaway, Reference Tablets & End Hour */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          {onSwitchToCutaway && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onSwitchToCutaway();
              }}
              title="Открыть общий 2D-срез 6-этажной башни"
              className="p-2 px-3 rounded-xl bg-gradient-to-r from-[#172332] to-[#213448] hover:from-[#213448] hover:to-[#2c4560] border-2 border-cyan-500/60 text-cyan-300 transition text-xs font-mono font-bold flex items-center space-x-1.5 shadow"
            >
              <LayoutGrid className="w-4 h-4 text-cyan-400" />
              <span>2D-Срез башни</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenReference('characters')}
            title="Планшеты персонажей"
            className="p-2 rounded-xl bg-[#14202c] hover:bg-[#1e2f42] border border-[#263a4e] text-[#c9d1d9] hover:text-white transition text-xs font-bold flex items-center space-x-1"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="hidden xl:inline">Герои</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenReference('catalog')}
            title="База QR-карт"
            className="p-2 rounded-xl bg-[#14202c] hover:bg-[#1e2f42] border border-[#263a4e] text-[#c9d1d9] hover:text-white transition text-xs font-bold flex items-center space-x-1"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden xl:inline">Карты</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenReference('goals')}
            title="Тайные личные цели"
            className="p-2 rounded-xl bg-[#14202c] hover:bg-[#1e2f42] border border-[#263a4e] text-[#c9d1d9] hover:text-white transition text-xs font-bold flex items-center space-x-1"
          >
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="hidden xl:inline">Цели</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenReference('traumas')}
            title="Травмы и Паника"
            className="p-2 rounded-xl bg-[#14202c] hover:bg-[#1e2f42] border border-[#263a4e] text-[#c9d1d9] hover:text-white transition text-xs font-bold flex items-center space-x-1"
          >
            <HeartPulse className="w-4 h-4 text-red-400" />
            <span className="hidden xl:inline">Травмы</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playAlarm();
              onAdvanceHour();
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 hover:to-amber-600 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition flex items-center space-x-1.5 border border-red-500/40"
          >
            <span>Конец часа {currentHour}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. ACTIVE CHARACTER SELECTOR (TABLETOP SYNC: SHOWS WHICH HERO IS ACTING) */}
      <div className="mb-2 bg-[#0c131c]/90 border border-[#203144] rounded-2xl p-2 px-3 flex flex-wrap items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider hidden sm:inline">
            АКТИВНЫЙ ХОД:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {characters.map((char, idx) => {
              const isActive = idx === activeCharIndex;
              const charFloor = characterFloors[char.id] || 2;
              const hasMoved = hasMovedMap[char.id] || false;

              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => handleSelectCharacter(idx)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-amber-500 text-black border-amber-300 shadow-md scale-102 font-black'
                      : 'bg-[#141f2d] hover:bg-[#1c2a3c] border-[#25394f] text-[#c9d1d9] hover:text-white'
                  }`}
                >
                  <span>{char.name}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                    isActive ? 'bg-black text-amber-300' : 'bg-black/60 text-cyan-300 border border-[#2f4358]'
                  }`}>
                    FL 0{charFloor}
                  </span>
                  {hasMoved && <span className="text-[10px] text-emerald-400">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Turn Step & Pass Turn Action */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono text-[#8b949e] hidden md:inline">
            {hasMovedMap[activeChar.id] ? 'Действие на этаже' : 'Ожидает перемещения'}
          </span>

          <button
            type="button"
            onClick={handleEndTurn}
            className="px-3 py-1 rounded-xl bg-[#172332] hover:bg-[#203144] border border-[#2b3e54] text-[#c9d1d9] hover:text-white font-mono text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
          >
            <span>Завершить ход</span>
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* 3. FULL-SCREEN 2D ROOM STAGE (16:9 CINEMATIC ATMOSPHERE) */}
      <div className="relative flex-1 mb-2 overflow-hidden rounded-3xl">
        {/* Animated Sliding Elevator Doors overlay */}
        {doorsClosed && (
          <div className="absolute inset-0 z-50 flex pointer-events-none transition-all duration-300">
            {transitionMethod === 'elevator' ? (
              <>
                <div className="w-1/2 h-full bg-[#121822] border-r-4 border-amber-500 hazard-stripes flex items-center justify-end pr-8 shadow-2xl">
                  <div className="text-right">
                    <div className="text-amber-400 font-mono text-xs font-bold uppercase tracking-widest">
                      ПОЕЗДКА НА ЛИФТЕ
                    </div>
                    <div className="text-4xl font-mono font-black text-white">
                      FL 0{activeFloorNum}
                    </div>
                  </div>
                </div>
                <div className="w-1/2 h-full bg-[#121822] border-l-4 border-amber-500 hazard-stripes flex items-center justify-start pl-8 shadow-2xl">
                  <div>
                    <div className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-widest animate-pulse">
                      СМЕНА ЭТАЖА...
                    </div>
                    <div className="text-xs font-mono text-gray-400">
                      ГЕРОЙ: {activeChar.name.toUpperCase()}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Stairs Transition Overlay */
              <div className="w-full h-full bg-[#0a0505]/95 border-4 border-red-600/80 flex flex-col items-center justify-center space-y-2 shadow-2xl">
                <div className="text-red-400 font-mono text-sm font-bold uppercase tracking-widest animate-pulse">
                  🪜 ПЕРЕХОД ПО ПОЖАРНОЙ ЛЕСТНИЦЕ...
                </div>
                <div className="text-2xl font-mono font-black text-white">
                  ЭТАЖ 0{activeFloorNum}
                </div>
              </div>
            )}
          </div>
        )}

        <AuthenticRoomStage
          floorNumber={activeFloorNum}
          room={activeRoom}
          roomStatus={activeRoomStatus}
          activeCharacter={activeChar}
          resolvedInteractables={resolvedInteractables}
          powerState={powerState}
          onOpenScanner={onOpenScanner}
          onOpenElevator={() => setIsElevatorDockOpen(true)}
        />
      </div>

      {/* 4. REALISTIC ELEVATOR CONTROL PANEL (AUTHENTIC COP WITH PHYSICAL ROUND BUTTONS) */}
      <ElevatorControlPanel
        currentFloor={activeFloorNum}
        activeCharacter={activeChar}
        allCharacters={characters}
        characterFloors={characterFloors}
        hasMovedThisTurn={hasMovedMap[activeChar.id] || false}
        powerState={powerState}
        roomStatuses={roomStatuses}
        onTravel={handleTravel}
        onStay={handleStay}
        onTogglePower={handleTogglePower}
        isOpenControlled={isElevatorDockOpen}
        onOpenControlledChange={setIsElevatorDockOpen}
        onPassTurn={handleEndTurn}
      />
    </div>
  );
};
