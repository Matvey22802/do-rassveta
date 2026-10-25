import React, { useState } from 'react';
import { Room, RoomStatus, InteractableObject, Character } from '../types/game';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Skull,
  Lock,
  Unlock,
  Radio,
  Flame,
  Zap,
  Eye,
  Info,
  X
} from 'lucide-react';
import { sound } from '../utils/audio';

interface CinemaRoomStageProps {
  floorNumber: number;
  room: Room;
  roomStatus: RoomStatus;
  activeCharacter: Character;
  resolvedInteractables: string[];
  powerState: 'online' | 'warning' | 'blackout';
  onOpenScanner: (interactable: InteractableObject) => void;
}

export const CinemaRoomStage: React.FC<CinemaRoomStageProps> = ({
  floorNumber,
  room,
  roomStatus,
  activeCharacter,
  resolvedInteractables,
  powerState,
  onOpenScanner
}) => {
  const [selectedInteractable, setSelectedInteractable] = useState<InteractableObject | null>(null);

  const isBlackout = powerState === 'blackout';
  const isLocked = roomStatus === 'locked';

  // Specific visual helpers for objects
  const coolingResolved = resolvedInteractables.includes('pipe_cooling');
  const generatorResolved = resolvedInteractables.includes('diesel_gen');
  const safeResolved = resolvedInteractables.includes('boss_safe');
  const roofResolved = resolvedInteractables.includes('roof_hatch');
  const elevatorResolved = resolvedInteractables.includes('cargo_elevator');

  return (
    <div className={`relative w-full h-[66vh] min-h-[480px] max-h-[720px] rounded-3xl overflow-hidden border-2 transition-all duration-700 select-none flex flex-col justify-between ${
      isBlackout
        ? 'border-red-900/80 blackout-emergency shadow-[0_0_50px_rgba(220,38,38,0.2)]'
        : 'border-[#1e2e42] bg-[#090d14] shadow-2xl'
    }`}>
      {/* 1. CRT Scanline Texture & Atmosphere Overlay */}
      <div className="absolute inset-0 scanline opacity-25 pointer-events-none z-10"></div>

      {/* 2. BACKGROUND: ROOM ARCHITECTURE MATCHING REFERENCE VIDEO */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
        {/* Upper Wall & Panoramic Window overlooking burning city */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          {/* Panoramic Window Frame */}
          <div className="relative w-[70%] max-w-4xl h-[80%] rounded-2xl border-4 border-[#1a2330] overflow-hidden shadow-2xl bg-[#06080d]">
            {/* Window Glass: City Night Skyline & Fires */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#180a06] via-[#1f110a] to-[#0a0f18]">
              {/* Distant Skyscrapers Silhouettes */}
              <div className="absolute bottom-0 inset-x-0 h-40 flex items-end justify-around opacity-75">
                <div className="w-16 h-36 bg-[#080d14] rounded-t-sm flex flex-wrap gap-1 p-1">
                  <div className="w-1.5 h-2 bg-amber-400/60 rounded-xs"></div>
                  <div className="w-1.5 h-2 bg-amber-400/40 rounded-xs"></div>
                  <div className="w-1.5 h-2 bg-amber-400/70 rounded-xs"></div>
                </div>
                <div className="w-24 h-48 bg-[#0a1019] rounded-t-sm flex flex-wrap gap-1 p-1">
                  <div className="w-1.5 h-2 bg-amber-300/60 rounded-xs"></div>
                  <div className="w-1.5 h-2 bg-amber-400/50 rounded-xs"></div>
                </div>
                <div className="w-20 h-40 bg-[#080c13] rounded-t-sm flex flex-wrap gap-1 p-1">
                  <div className="w-1.5 h-2 bg-amber-400/40 rounded-xs"></div>
                  <div className="w-1.5 h-2 bg-amber-400/80 rounded-xs"></div>
                </div>
                <div className="w-28 h-56 bg-[#0c1420] rounded-t-sm flex flex-wrap gap-1 p-1">
                  <div className="w-1.5 h-2 bg-amber-400/50 rounded-xs"></div>
                  <div className="w-1.5 h-2 bg-amber-400/70 rounded-xs"></div>
                  <div className="w-1.5 h-2 bg-amber-300/40 rounded-xs"></div>
                </div>
                <div className="w-20 h-32 bg-[#080d14] rounded-t-sm"></div>
              </div>

              {/* Fire glow & smoke plumes */}
              <div className="absolute top-0 right-1/4 w-72 h-72 bg-gradient-to-t from-orange-600/30 to-amber-500/10 rounded-full blur-3xl anim-city-fire"></div>
              <div className="absolute top-1/4 left-1/4 w-60 h-60 bg-red-600/20 rounded-full blur-3xl anim-city-fire"></div>
            </div>

            {/* Window Panes Grid Divider */}
            <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
              <div className="border-r-2 border-[#1a2330]"></div>
              <div className="border-r-2 border-[#1a2330]"></div>
              <div className="border-r-2 border-[#1a2330]"></div>
              <div></div>
            </div>
            <div className="absolute inset-0 grid grid-rows-2 pointer-events-none">
              <div className="border-b-2 border-[#1a2330]"></div>
              <div></div>
            </div>

            {/* Curtains on the sides (matching reference video frames 003 & 008) */}
            <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#200b0d] to-[#120507] border-r border-[#301014] opacity-90"></div>
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#200b0d] to-[#120507] border-l border-[#301014] opacity-90"></div>
          </div>
        </div>

        {/* Floor: Dark wooden planks with atmospheric perspective */}
        <div className="h-28 bg-gradient-to-b from-[#131b26] via-[#0f151e] to-[#070b10] border-t-2 border-[#223345] relative overflow-hidden">
          {/* Wood plank lines */}
          <div className="absolute inset-0 flex justify-between opacity-15">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="w-[1px] h-full bg-white/40"></div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC ROOM LIGHTING & PARTICLES */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {floorNumber === 1 && (
          <>
            <div className="absolute bottom-8 right-16 w-80 h-80 bg-red-600/15 rounded-full blur-3xl anim-alarm"></div>
            {!coolingResolved && (
              <div className="absolute bottom-28 right-28 w-32 h-32 bg-white/20 rounded-full blur-2xl anim-steam"></div>
            )}
          </>
        )}
        {floorNumber === 3 && (
          <div className="absolute top-12 left-1/4 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl anim-quartz"></div>
        )}
        {floorNumber === 4 && (
          <div className="absolute top-12 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl anim-monitors"></div>
        )}
        {isBlackout && (
          <div className="absolute inset-0 bg-red-950/20 anim-alarm"></div>
        )}
      </div>

      {/* 4. TOP HUD (MINIMALIST & MOODY, LIKE REFERENCE VIDEO DAY 1 6:43 AM) */}
      <div className="relative z-20 p-4 sm:p-6 flex items-start justify-between">
        {/* Top-Left: Digital Time and Floor Badge */}
        <div className="flex items-start space-x-3">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
                {isBlackout ? '⚠️ АВАРИЙНЫЙ РЕЖИМ • БЛЭКАУТ' : '• РАУНД 1 // ВЫЖИВАНИЕ'}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight drop-shadow-md">
              00:00
            </div>
            <div className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase flex items-center space-x-1.5 mt-0.5">
              <span>ЭТАЖ 0{floorNumber}</span>
              <span className="text-gray-500">•</span>
              <span className="text-white">{room.name}</span>
            </div>
          </div>
        </div>

        {/* Top-Right: Status & Threat Indicator */}
        <div className="flex items-center space-x-2">
          {room.initialZombies > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-600/80 text-red-300 font-mono text-xs font-bold flex items-center space-x-2 shadow-lg animate-pulse">
              <Skull className="w-4 h-4 text-red-400" />
              <span>{room.initialZombies} ЗОМБИ В ОТСЕКЕ</span>
            </div>
          )}

          {isLocked && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-600/80 text-amber-300 font-mono text-xs font-bold flex items-center space-x-2 shadow-lg">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>ЗАПЕРТО #102</span>
            </div>
          )}

          {room.isCCTVRoom && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-600/80 text-emerald-300 font-mono text-xs font-bold flex items-center space-x-2 shadow-lg">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>ПОСТ КООРДИНАТОРА</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. ROOM INTERACTIVE STAGE & SILHOUETTE CHARACTER */}
      <div className="relative z-20 flex-1 flex items-end justify-between px-6 sm:px-12 pb-4">
        {/* 5A. ACTIVE CHARACTER SILHOUETTE (MATCHING STICKMAN WITH WARM RIM LIGHT) */}
        <div className="relative flex flex-col items-center">
          {/* Character Tag Pill above head */}
          <div className="mb-2 px-2.5 py-1 rounded-lg bg-black/80 border border-amber-500/60 text-[11px] font-mono font-bold text-amber-300 tracking-wider shadow-lg flex items-center space-x-1.5 backdrop-blur-xs">
            <span>👤</span>
            <span>{activeCharacter.name}</span>
            <span className="text-gray-400 font-normal">({activeCharacter.role})</span>
          </div>

          {/* Minimalist Stickman/Silhouette Character with Warm Glow */}
          <div className="relative w-16 sm:w-20 h-44 sm:h-52 flex items-end justify-center char-rim-light">
            <svg
              viewBox="0 0 100 240"
              className="w-full h-full fill-[#0a0f16] stroke-amber-400/90"
              style={{ strokeWidth: '4px' }}
            >
              {/* Head with glowing circular outline */}
              <circle cx="50" cy="36" r="22" className="fill-[#080d14] stroke-amber-400" />
              {/* Torso */}
              <line x1="50" y1="58" x2="50" y2="135" strokeLinecap="round" style={{ strokeWidth: '10px' }} />
              {/* Left Arm (raised/holding flashlight) */}
              <line x1="50" y1="75" x2="20" y2="105" strokeLinecap="round" style={{ strokeWidth: '8px' }} />
              <line x1="20" y1="105" x2="14" y2="92" strokeLinecap="round" style={{ strokeWidth: '7px' }} />
              {/* Right Arm */}
              <line x1="50" y1="75" x2="80" y2="110" strokeLinecap="round" style={{ strokeWidth: '8px' }} />
              {/* Left Leg */}
              <line x1="50" y1="135" x2="30" y2="190" strokeLinecap="round" style={{ strokeWidth: '9px' }} />
              <line x1="30" y1="190" x2="26" y2="234" strokeLinecap="round" style={{ strokeWidth: '8px' }} />
              {/* Right Leg */}
              <line x1="50" y1="135" x2="70" y2="190" strokeLinecap="round" style={{ strokeWidth: '9px' }} />
              <line x1="70" y1="190" x2="74" y2="234" strokeLinecap="round" style={{ strokeWidth: '8px' }} />
            </svg>
          </div>
        </div>

        {/* 5B. INTERACTIVE OBJECT HOTSPOTS IN THE ROOM */}
        <div className="flex-1 flex flex-wrap items-end justify-end gap-3 sm:gap-4 pl-4 sm:pl-8">
          {room.interactables.map((item) => {
            const isResolved = resolvedInteractables.includes(item.id);

            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedInteractable(item);
                }}
                className={`group relative p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-start max-w-xs shadow-2xl backdrop-blur-md active:scale-95 ${
                  isResolved
                    ? 'bg-emerald-950/70 border-emerald-500/60 hover:border-emerald-400'
                    : 'bg-[#101824]/85 border-[#243649] hover:border-cyan-400 hover:bg-[#152030]'
                }`}
              >
                {/* Status indicator top */}
                <div className="w-full flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-400">
                    ОБЪЕКТ ЭТАЖА
                  </span>

                  {isResolved ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-900/80 border border-emerald-500 text-emerald-300 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>РЕШЕНО ✓</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 border border-amber-600 text-amber-300 flex items-center space-x-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      <span>ДЕЙСТВИЕ</span>
                    </span>
                  )}
                </div>

                <h4 className="font-mono font-bold text-xs sm:text-sm text-white group-hover:text-cyan-300 transition text-left line-clamp-1">
                  {item.name}
                </h4>

                <div className="mt-1 text-[11px] font-mono text-[#8b949e] flex items-center space-x-1">
                  <span>Требуется:</span>
                  <span className="text-amber-300 font-bold">
                    {item.requiredCode ? `#${item.requiredCode}` : item.recipes ? item.recipes.join(', ') : 'Взаимодействие'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. BOTTOM BAR: PHYSICAL TABLE SEARCH DECK & DEDUCTION CUE */}
      <div className="relative z-20 bg-[#070b12]/95 border-t border-[#1c2c3d] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between text-xs font-mono text-[#8b949e] gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-cyan-400 font-bold">🎴 СТОПКА ОБЫСКА НА СТОЛЕ:</span>
          <span className="text-white">
            {room.searchDeckNote || 'Нет стопки карт (Тактический узел)'}
          </span>
        </div>

        <div className="text-amber-400/90 truncate max-w-xl hidden md:inline">
          🔍 {room.visualClue}
        </div>
      </div>

      {/* 7. CINEMATIC INTERACTIVE OBJECT MODAL (MATCHING "DO YOU OPEN IT?" PROMPT IN VIDEO) */}
      {selectedInteractable && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-[#111923] border-2 border-cyan-500/70 rounded-3xl p-6 sm:p-7 shadow-2xl text-left">
            {/* Close button */}
            <button
              onClick={() => setSelectedInteractable(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#182330] hover:bg-[#223345] text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider bg-cyan-950 border border-cyan-600 text-cyan-300 uppercase">
                ТАКТИЧЕСКИЙ ОБЪЕКТ
              </span>
              <span className="text-xs font-mono text-gray-400">
                ЭТАЖ 0{floorNumber}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-mono font-black text-white uppercase tracking-wide mb-3">
              {selectedInteractable.name}
            </h3>

            <p className="text-sm text-[#c9d1d9] leading-relaxed mb-4">
              {selectedInteractable.description}
            </p>

            {/* Requirement Box */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-[#233548] mb-6 flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">Необходимая карта:</span>
              <span className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-600 text-amber-300 font-mono text-xs font-bold">
                {selectedInteractable.requiredCode ? `#${selectedInteractable.requiredCode} ${selectedInteractable.cardName || ''}` : selectedInteractable.recipes ? `Рецепты: ${selectedInteractable.recipes.join(', ')}` : 'Действие'}
              </span>
            </div>

            {/* Action Buttons (Style inspired by reference video's [OPEN IT] / [KEEP IT SHUT]) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const item = selectedInteractable;
                  setSelectedInteractable(null);
                  onOpenScanner(item);
                }}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition flex items-center justify-center space-x-2"
              >
                <QrCode className="w-4 h-4" />
                <span>СКАНИРОВАТЬ QR</span>
              </button>

              <button
                onClick={() => setSelectedInteractable(null)}
                className="py-3 px-4 rounded-xl bg-[#1b2532] hover:bg-[#253344] border border-[#2d4054] text-gray-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider transition flex items-center justify-center"
              >
                ОТМЕНА
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
