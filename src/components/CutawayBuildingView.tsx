import React, { useState } from 'react';
import { Room, RoomStatus } from '../types/game';
import {
  Lock,
  Skull,
  Radio,
  Flame,
  AlertTriangle,
  ArrowRight,
  Eye,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Users,
  BookOpen,
  Target,
  HeartPulse,
  Clock,
  Sparkles
} from 'lucide-react';
import { sound } from '../utils/audio';

interface CutawayBuildingViewProps {
  rooms: Room[];
  roomStatuses: Record<string, RoomStatus>;
  resolvedInteractables: string[];
  currentHour: number;
  maxHours: number;
  onSelectRoom: (roomId: string) => void;
  onAdvanceHour: () => void;
  onOpenReference: (tab: 'characters' | 'catalog' | 'goals' | 'traumas') => void;
  paths: {
    pathA: { name: string; description: string; requirements: string[] };
    pathB: { name: string; description: string; requirements: string[] };
  };
  onSwitchToElevator?: () => void;
}

export const CutawayBuildingView: React.FC<CutawayBuildingViewProps> = ({
  rooms,
  roomStatuses,
  resolvedInteractables,
  currentHour,
  maxHours,
  onSelectRoom,
  onAdvanceHour,
  onOpenReference,
  paths,
  onSwitchToElevator
}) => {
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>('generator_room');

  // Find room by id
  const getRoom = (id: string) => rooms.find((r) => r.id === id);

  // Status checks for Path A and Path B
  const pathACooling = resolvedInteractables.includes('pipe_cooling');
  const pathAPower = resolvedInteractables.includes('diesel_gen');
  const pathAElevator = resolvedInteractables.includes('cargo_elevator');

  const pathBPower = resolvedInteractables.includes('diesel_gen');
  const pathBRoof = resolvedInteractables.includes('roof_hatch');

  // Currently inspected room for telemetry
  const inspectedRoom = rooms.find((r) => r.id === hoveredRoomId) || rooms[0];
  const inspectedStatus = roomStatuses[inspectedRoom.id] || inspectedRoom.status;

  // Sector codes for rooms
  const sectorCodes: Record<string, string> = {
    tech_sector_roof: 'SECTOR 14-A',
    archive_office: 'SECTOR 14-B',
    cctv_room: 'SECTOR 14-C',
    apt14a_medbay: 'SECTOR 14-D',
    lobby: 'SECTOR 14-E',
    generator_room: 'SECTOR 14-F'
  };

  const handleRoomClick = (roomId: string) => {
    const status = roomStatuses[roomId] || getRoom(roomId)?.status;
    if (status === 'hidden') return;
    sound.playClick();
    onSelectRoom(roomId);
  };

  // 6 Rooms organized strictly as 2 rows of 3:
  // Row 1: tech_sector_roof (Top-Left), archive_office (Top-Center), cctv_room (Top-Right)
  // Row 2: apt14a_medbay (Bottom-Left), lobby (Bottom-Center), generator_room (Bottom-Right)
  const roomGridOrder = [
    { id: 'tech_sector_roof', col: 1, row: 1 },
    { id: 'archive_office', col: 2, row: 1 },
    { id: 'cctv_room', col: 3, row: 1 },
    { id: 'apt14a_medbay', col: 1, row: 2 },
    { id: 'lobby', col: 2, row: 2 },
    { id: 'generator_room', col: 3, row: 2 }
  ];

  return (
    <div className="flex flex-col flex-1 max-w-[1600px] mx-auto w-full px-2 sm:px-4 lg:px-6 py-2 sm:py-3">
      {/* 1. TOP HUD: Apocalyptic Ticker & Victory Paths */}
      <div className="mb-3 bg-[#0a0f16]/95 border border-[#1e2f40] rounded-2xl p-3 shadow-2xl backdrop-blur flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Ticker & Time */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="px-3 py-1 rounded-xl bg-red-950/80 border border-red-700/60 flex items-center space-x-2 text-red-400 font-mono text-xs font-bold uppercase tracking-wider flex-shrink-0 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span>КОД «ЧЕРНЫЙ РАССВЕТ»</span>
          </div>

          <div className="text-xs font-mono text-[#8b949e] truncate hidden sm:inline">
            Удар авиации в 06:00 // До удара: <b className="text-amber-400">{maxHours - currentHour} ч</b>
          </div>
        </div>

        {/* Center: Dual Victory Mini Badges */}
        <div className="flex items-center space-x-2 sm:space-x-4 text-xs font-mono">
          {/* Path A */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-[#121c27] border border-[#203244]">
            <span className="text-cyan-400 font-bold">ПУТЬ А (БУНКЕР):</span>
            <span className={pathACooling ? 'text-emerald-400' : 'text-gray-500'}>
              [Труба {pathACooling ? '✓' : '✗'}]
            </span>
            <span className={pathAPower ? 'text-emerald-400' : 'text-gray-500'}>
              [Дизель {pathAPower ? '✓' : '✗'}]
            </span>
            <span className={pathAElevator ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
              [Лифт {pathAElevator ? '✓' : '...'}]
            </span>
          </div>

          {/* Path B */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-[#121c27] border border-[#203244]">
            <span className="text-amber-400 font-bold">ПУТЬ Б (КРЫША):</span>
            <span className={pathBPower ? 'text-emerald-400' : 'text-gray-500'}>
              [Дизель {pathBPower ? '✓' : '✗'}]
            </span>
            <span className={pathBRoof ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
              [Маяк #105 {pathBRoof ? '✓' : '...'}]
            </span>
          </div>
        </div>

        {/* Right: Reference Buttons & Advance Hour */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          {onSwitchToElevator && (
            <button
              onClick={() => {
                sound.playClick();
                onSwitchToElevator();
              }}
              title="Перейти в режим Лифта"
              className="p-2 rounded-xl bg-[#1a2634] hover:bg-[#253549] border border-cyan-700/60 text-cyan-300 transition text-xs font-mono font-bold flex items-center space-x-1.5 shadow"
            >
              <ArrowRight className="w-4 h-4 text-cyan-400 rotate-90" />
              <span className="hidden lg:inline">Режим Лифта</span>
            </button>
          )}

          <button
            onClick={() => onOpenReference('characters')}
            title="Планшеты персонажей"
            className="p-2 rounded-xl bg-[#14202c] hover:bg-[#1e2f42] border border-[#263a4e] text-[#c9d1d9] hover:text-white transition text-xs font-bold flex items-center space-x-1"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="hidden lg:inline">Герои</span>
          </button>

          <button
            onClick={() => onOpenReference('catalog')}
            title="База QR-карт"
            className="p-2 rounded-xl bg-[#14202c] hover:bg-[#1e2f42] border border-[#263a4e] text-[#c9d1d9] hover:text-white transition text-xs font-bold flex items-center space-x-1"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">Карты</span>
          </button>

          <button
            onClick={() => onOpenReference('goals')}
            title="Тайные личные цели"
            className="p-2 rounded-xl bg-[#14202c] hover:bg-[#1e2f42] border border-[#263a4e] text-[#c9d1d9] hover:text-white transition text-xs font-bold flex items-center space-x-1"
          >
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline">Цели</span>
          </button>

          <button
            onClick={() => onOpenReference('traumas')}
            title="Травмы и Паника"
            className="p-2 rounded-xl bg-[#14202c] hover:bg-[#1e2f42] border border-[#263a4e] text-[#c9d1d9] hover:text-white transition text-xs font-bold flex items-center space-x-1"
          >
            <HeartPulse className="w-4 h-4 text-red-400" />
            <span className="hidden lg:inline">Травмы</span>
          </button>

          <button
            onClick={() => {
              sound.playAlarm();
              onAdvanceHour();
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 hover:to-amber-600 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition flex items-center space-x-1.5 border border-red-500/40"
          >
            <span>Завершить час {currentHour}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. THE 16:9 ATMOSPHERIC CUTAWAY STAGE */}
      <div className="relative rounded-3xl border-2 border-[#1e2e40] overflow-hidden bg-black shadow-2xl flex-1 flex flex-col justify-between">
        {/* Aspect Ratio 1376:768 Canvas Container matching original art */}
        <div className="relative w-full aspect-[1376/768] max-h-[58vh] xl:max-h-[62vh] mx-auto overflow-hidden select-none">
          {/* Background: Widescreen Cutaway Concept Art in Comic Graphic Adventure Style */}
          <img
            src="/cutaway_style_v2.jpg"
            alt="14th Floor Cutaway Cross-Section"
            className="w-full h-full object-cover pointer-events-none"
          />

          {/* CRT Scanline Overlay Texture */}
          <div className="absolute inset-0 scanline opacity-40 pointer-events-none"></div>

          {/* Dynamic Lighting & Atmospheric Particle FX Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top-Center Room (Archive): Apocalyptic Fire Glow through panoramic window */}
            <div className="absolute top-[23%] left-[36%] w-[28%] h-[32%] bg-amber-500/10 rounded-2xl blur-xl anim-city-fire"></div>

            {/* Bottom-Right Room (Generator): Billowing steam & emergency red strobe glow */}
            <div className="absolute bottom-[11%] right-[7.5%] w-[27%] h-[32%] bg-red-600/15 rounded-2xl anim-alarm"></div>
            <div className="absolute bottom-[18%] right-[15%] w-24 h-24 bg-white/20 rounded-full blur-2xl anim-steam"></div>
            <div className="absolute bottom-[17%] right-[12%] w-3 h-3 bg-cyan-300 rounded-full blur-sm anim-spark"></div>

            {/* Top-Right Room (CCTV): Green surveillance CRT monitor volumetric glow */}
            <div className="absolute top-[23%] right-[7.5%] w-[27%] h-[32%] bg-emerald-500/10 rounded-2xl anim-monitors"></div>

            {/* Bottom-Left Room (Medical): Cold flickering quartz blue light */}
            <div className="absolute bottom-[11%] left-[7.5%] w-[27%] h-[32%] bg-cyan-400/10 rounded-2xl anim-quartz"></div>
          </div>

          {/* INTERACTIVE 6-ROOM CUTAWAY HITBOXES (2 ROWS OF 3) */}
          <div className="absolute top-[22.8%] bottom-[11%] left-[7.5%] right-[7.5%] grid grid-cols-3 grid-rows-2 gap-2 sm:gap-3.5">
            {roomGridOrder.map(({ id }) => {
              const room = getRoom(id)!;
              const status = roomStatuses[id] || room.status;
              const isLocked = status === 'locked';
              const isHovered = hoveredRoomId === id;

              // Custom badge for room status
              let badgeText = '';
              let badgeColor = '';
              if (id === 'generator_room') {
                badgeText = pathACooling ? 'ОХЛАЖДЕНИЕ НОРМА' : '⚠️ УТЕЧКА ПАРА';
                badgeColor = pathACooling ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600' : 'bg-red-950/90 text-red-300 border-red-500 animate-pulse';
              } else if (id === 'cctv_room') {
                badgeText = isLocked ? '🔒 ЗАПЕРТО #102' : '📡 КООРДИНАТОР';
                badgeColor = isLocked ? 'bg-amber-950/80 text-amber-300 border-amber-600' : 'bg-emerald-950/80 text-emerald-300 border-emerald-600';
              } else if (id === 'apt14a_medbay') {
                badgeText = '🧟 1 ЗОМБИ В ПАЛАТЕ';
                badgeColor = 'bg-red-950/80 text-red-300 border-red-700';
              } else if (id === 'archive_office') {
                badgeText = '🧟 1 ЗОМБИ / СЕЙФ #203';
                badgeColor = 'bg-amber-950/80 text-amber-300 border-amber-700';
              } else if (id === 'tech_sector_roof') {
                badgeText = pathBRoof ? '✓ ЛЮК КРЫШИ РАЗБЛОКИРОВАН' : '🚁 ПУТЬ Б • КРЫША';
                badgeColor = pathBRoof ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600' : 'bg-cyan-950/80 text-cyan-300 border-cyan-600';
              } else if (id === 'lobby') {
                badgeText = pathAElevator ? '✓ ЛИФТ ГОТОВ К СПУСКУ' : '🚪 ПУТЬ А • ЛИФТ В БУНКЕР';
                badgeColor = pathAElevator ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600' : 'bg-cyan-950/80 text-cyan-300 border-cyan-600';
              }

              return (
                <div
                  key={id}
                  onMouseEnter={() => {
                    setHoveredRoomId(id);
                    sound.playHover();
                  }}
                  onPointerEnter={() => {
                    setHoveredRoomId(id);
                    sound.playHover();
                  }}
                  onClick={() => handleRoomClick(id)}
                  className={`group relative rounded-xl border-2 transition-all duration-200 cursor-pointer p-2 sm:p-3 flex flex-col justify-between overflow-hidden ${
                    isHovered
                      ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_24px_rgba(34,211,238,0.35)] backdrop-blur-xs scale-[1.01]'
                      : 'border-transparent hover:border-cyan-500/60 hover:bg-black/25'
                  }`}
                >
                  {/* High-Tech Tactical Corner Brackets when hovered */}
                  {isHovered && (
                    <>
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400"></div>
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400"></div>
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400"></div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400"></div>
                    </>
                  )}

                  {/* Top Bar inside Room: Sector Tag & Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] sm:text-xs font-bold text-white bg-black/80 px-2 py-0.5 rounded border border-white/20 backdrop-blur-sm">
                      {sectorCodes[id]}
                    </span>

                    <span className={`font-mono text-[9px] sm:text-[11px] font-bold px-2 py-0.5 rounded border ${badgeColor} backdrop-blur-sm`}>
                      {badgeText}
                    </span>
                  </div>

                  {/* Bottom Bar inside Room: Name and "Войти" Call-to-action */}
                  <div className="bg-black/75 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg border border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="font-mono font-bold text-xs sm:text-sm text-white group-hover:text-cyan-300 transition uppercase tracking-wide">
                        {room.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-[#8b949e] line-clamp-1">
                        {room.subtitle}
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center space-x-1 text-cyan-400 font-mono text-xs font-bold group-hover:translate-x-1 transition-transform pl-2">
                      <span>Войти</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. BOTTOM TELEMETRY INSPECTION DOSSIER (Deep Immersion On Hover) */}
        <div className="relative z-20 bg-[#070c12]/95 border-t-2 border-[#1c2a38] p-3 sm:p-4 backdrop-blur shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-1">
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-700/60">
                ТЕЛЕМЕТРИЯ // {sectorCodes[inspectedRoom.id]}
              </span>
              <h4 className="text-sm sm:text-base font-black text-white font-mono uppercase">
                {inspectedRoom.name}
              </h4>
              <span className="text-xs font-semibold text-amber-400/90 hidden sm:inline">
                ({inspectedRoom.subtitle})
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#c9d1d9] leading-relaxed max-w-4xl">
              🔍 <b>Обстановка в разрезе:</b> {inspectedRoom.visualClue || inspectedRoom.description}
            </p>

            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[#8b949e]">
              {inspectedRoom.searchDeckNote && (
                <span className="text-cyan-300 font-mono text-[11px]">
                  🎴 {inspectedRoom.searchDeckNote}
                </span>
              )}
              {inspectedRoom.interactables.length > 0 && (
                <span className="text-amber-300 font-mono text-[11px]">
                  ⚙️ Задачи отсека:{' '}
                  {inspectedRoom.interactables.map((i) => `${i.name} [${i.resolved ? '✓' : '...'}]`).join(' • ')}
                </span>
              )}
            </div>
          </div>

          {/* Action button into inspected room */}
          <button
            onClick={() => handleRoomClick(inspectedRoom.id)}
            className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-950/60 active:scale-95 transition flex items-center justify-center space-x-2 flex-shrink-0"
          >
            <span>Войти в {inspectedRoom.name}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
