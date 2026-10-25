import React from 'react';
import { Room, RoomStatus } from '../types/game';
import { Lock, EyeOff, Radio, ChevronRight, Skull, ArrowRight, ShieldAlert, CheckCircle2, Zap, HelpCircle, Users, BookOpen, Target, HeartPulse } from 'lucide-react';
import { sound } from '../utils/audio';

interface BuildingMapProps {
  rooms: Room[];
  roomStatuses: Record<string, RoomStatus>;
  resolvedInteractables: string[];
  onSelectRoom: (roomId: string) => void;
  onAdvanceHour: () => void;
  onOpenReference: (tab: 'characters' | 'catalog' | 'goals' | 'traumas') => void;
  currentHour: number;
  maxHours: number;
  paths: {
    pathA: { name: string; description: string; requirements: string[] };
    pathB: { name: string; description: string; requirements: string[] };
  };
}

export const BuildingMap: React.FC<BuildingMapProps> = ({
  rooms,
  roomStatuses,
  resolvedInteractables,
  onSelectRoom,
  onAdvanceHour,
  onOpenReference,
  currentHour,
  maxHours,
  paths
}) => {
  const getStatusBadge = (status: RoomStatus, isCCTV?: boolean) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-950/80 border border-emerald-600/60 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1"></span>
            {isCCTV ? 'Связь активна' : 'Доступно'}
          </span>
        );
      case 'locked':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-950/80 border border-amber-600/60 text-amber-300">
            <Lock className="w-3 h-3 mr-1" />
            Заперто
          </span>
        );
      case 'hidden':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-900 border border-gray-700 text-gray-400">
            <EyeOff className="w-3 h-3 mr-1" />
            Неизведано
          </span>
        );
      case 'crisis':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-950 border border-red-600 text-red-300 animate-pulse">
            <ShieldAlert className="w-3 h-3 mr-1" />
            Осада тварей
          </span>
        );
    }
  };

  // Status checks for Path A and Path B
  const pathACooling = resolvedInteractables.includes('pipe_cooling');
  const pathAPower = resolvedInteractables.includes('diesel_gen');
  const pathAElevator = resolvedInteractables.includes('cargo_elevator');

  const pathBPower = resolvedInteractables.includes('diesel_gen');
  const pathBRoof = resolvedInteractables.includes('roof_hatch');

  return (
    <div className="flex flex-col flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-5">
      {/* Dual Victory Paths Tracker Bar */}
      <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Path A */}
        <div className="bg-[#141c26] border border-[#26374a] rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                ПУТЬ А: ПОДЗЕМНЫЙ БУНКЕР
              </span>
              <span className="text-[11px] text-[#8b949e]">Грузовой лифт</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-medium text-[#c9d1d9] mb-3">
              <span className={`px-2 py-0.5 rounded text-[11px] ${pathACooling ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-gray-800 text-gray-400'}`}>
                1. Охлаждение {pathACooling ? '✓' : '...'}
              </span>
              <span>➔</span>
              <span className={`px-2 py-0.5 rounded text-[11px] ${pathAPower ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-gray-800 text-gray-400'}`}>
                2. Питание {pathAPower ? '✓' : '...'}
              </span>
              <span>➔</span>
              <span className={`px-2 py-0.5 rounded text-[11px] ${pathAElevator ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-gray-800 text-gray-400'}`}>
                3. Лифт #202 {pathAElevator ? '✓' : '...'}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-[#8b949e]">
            {pathAElevator ? '🎉 Готово к спуску!' : 'Требует починки трубы в Генераторной и пуска дизеля.'}
          </div>
        </div>

        {/* Path B */}
        <div className="bg-[#141c26] border border-[#26374a] rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase">
                ПУТЬ Б: СИГНАЛ НА КРЫШУ
              </span>
              <span className="text-[11px] text-[#8b949e]">Вертолетная площадка</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-medium text-[#c9d1d9] mb-3">
              <span className={`px-2 py-0.5 rounded text-[11px] ${pathBPower ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-gray-800 text-gray-400'}`}>
                1. Питание Генератора {pathBPower ? '✓' : '...'}
              </span>
              <span>➔</span>
              <span className={`px-2 py-0.5 rounded text-[11px] ${pathBRoof ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-gray-800 text-gray-400'}`}>
                2. Схема #201 + Ракетница #105 {pathBRoof ? '✓' : '...'}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-[#8b949e]">
            {pathBRoof ? '🎉 Сигнал подан! Вертолет в пути!' : 'Требует питания и подачи сигнала ракетницей из Техсектора.'}
          </div>
        </div>
      </div>

      {/* Reference Tool Buttons Row */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenReference('characters')}
            className="px-3 py-1.5 rounded-xl bg-[#17222f] hover:bg-[#203042] border border-[#2b3e52] text-xs font-bold text-[#c9d1d9] hover:text-white flex items-center space-x-1.5 transition"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>6 Персонажей</span>
          </button>

          <button
            onClick={() => onOpenReference('catalog')}
            className="px-3 py-1.5 rounded-xl bg-[#17222f] hover:bg-[#203042] border border-[#2b3e52] text-xs font-bold text-[#c9d1d9] hover:text-white flex items-center space-x-1.5 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>База карт (#101-#206)</span>
          </button>

          <button
            onClick={() => onOpenReference('goals')}
            className="px-3 py-1.5 rounded-xl bg-[#17222f] hover:bg-[#203042] border border-[#2b3e52] text-xs font-bold text-[#c9d1d9] hover:text-white flex items-center space-x-1.5 transition"
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Личные цели</span>
          </button>

          <button
            onClick={() => onOpenReference('traumas')}
            className="px-3 py-1.5 rounded-xl bg-[#17222f] hover:bg-[#203042] border border-[#2b3e52] text-xs font-bold text-[#c9d1d9] hover:text-white flex items-center space-x-1.5 transition"
          >
            <HeartPulse className="w-3.5 h-3.5 text-red-400" />
            <span>Травмы и Паника</span>
          </button>
        </div>

        {/* Advance Hour Button */}
        <button
          onClick={() => {
            sound.playAlarm();
            onAdvanceHour();
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-700 hover:from-red-600 to-amber-700 hover:to-amber-600 text-white font-black tracking-wider uppercase text-xs lg:text-sm shadow-xl active:scale-95 transition flex items-center space-x-2 border border-red-500/40"
        >
          <span>Завершить час {currentHour}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Blueprint Floor Header */}
      <div className="flex items-center justify-between mb-3 text-xs font-mono tracking-widest text-[#8b949e]">
        <div className="flex items-center space-x-2 text-emerald-400 uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
          <span>ПЛАН 14-ГО ЭТАЖА • КОМПЛЕКС «ГОРИЗОНТ»</span>
        </div>
        <div className="hidden sm:inline">
          Нажмите на локацию для входа и взаимодействия
        </div>
      </div>

      {/* Building Map 6-Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
        {rooms.map((room) => {
          const status = roomStatuses[room.id] || room.status;
          const isHidden = status === 'hidden';
          const isLocked = status === 'locked';
          const isResolved = room.interactables.every((i) => i.resolved);

          return (
            <div
              key={room.id}
              onClick={() => {
                if (isHidden) return;
                sound.playClick();
                onSelectRoom(room.id);
              }}
              className={`relative rounded-2xl border transition-all duration-200 p-4 lg:p-5 flex flex-col justify-between overflow-hidden shadow-lg ${
                isHidden
                  ? 'bg-[#0f141a]/60 border-[#1f2832] opacity-60 cursor-not-allowed select-none'
                  : isLocked
                  ? 'bg-[#151a22] hover:bg-[#1a222c] border-amber-900/60 hover:border-amber-600 cursor-pointer group'
                  : 'bg-[#151f2b] hover:bg-[#1a293a] border-[#253648] hover:border-cyan-500/80 cursor-pointer group hover:shadow-cyan-950/40'
              }`}
            >
              {/* Subtle grid blueprint background lines */}
              <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

              <div>
                {/* Status + Badges Row */}
                <div className="flex items-center justify-between mb-2.5">
                  {getStatusBadge(status, room.isCCTVRoom)}

                  <div className="flex items-center space-x-1.5">
                    {room.initialZombies > 0 && (
                      <span className="inline-flex items-center text-[10px] font-mono font-bold text-red-300 bg-red-950/80 border border-red-700/60 px-2 py-0.5 rounded">
                        <Skull className="w-3 h-3 mr-1 text-red-400" />
                        {room.initialZombies} Зомби со старта
                      </span>
                    )}

                    {room.isCCTVRoom && (
                      <span className="inline-flex items-center text-[10px] font-mono tracking-wider font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-700/50 px-2 py-0.5 rounded">
                        <Radio className="w-3 h-3 mr-1" />
                        КООРДИНАТОР
                      </span>
                    )}
                  </div>
                </div>

                {/* Room Title */}
                <h3 className="text-lg lg:text-xl font-black tracking-wide text-white group-hover:text-cyan-300 transition mb-0.5 font-mono uppercase">
                  {room.name}
                </h3>
                <div className="text-xs font-semibold text-amber-400/90 tracking-wide mb-2 uppercase">
                  {room.subtitle}
                </div>

                {/* Description snippet */}
                <p className="text-xs text-[#8b949e] line-clamp-2 leading-relaxed mb-3">
                  {room.visualClue || room.description}
                </p>

                {/* Search Deck Note */}
                {room.searchDeckNote && (
                  <div className="text-[11px] text-cyan-300/80 bg-cyan-950/30 border border-cyan-800/30 rounded-lg p-2 mb-3">
                    🎴 {room.searchDeckNote}
                  </div>
                )}
              </div>

              {/* Bottom Room Card Info */}
              <div className="pt-2.5 border-t border-[#202d3d] flex items-center justify-between text-xs text-[#8b949e]">
                <div>
                  {room.interactables.length > 0 && (
                    <span className="font-mono text-cyan-300 text-[11px]">
                      Объектов: {room.interactables.filter((i) => i.resolved).length} / {room.interactables.length}
                    </span>
                  )}
                </div>

                <div className="flex items-center font-bold text-[#c9d1d9] group-hover:text-white transition text-xs">
                  <span>Войти</span>
                  <ChevronRight className="w-4 h-4 ml-0.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabletop Reminders Bar */}
      <div className="mt-4 p-3 rounded-xl bg-[#101720] border border-[#202e3e] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8b949e] gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-amber-300 font-mono">ПРАВИЛО ПЕРЕМЕЩЕНИЯ:</span>
          <span>1 ход игрока = 1 комната. Внутри комнаты обыск стопки свободный, пока есть карты на руках.</span>
        </div>
        <div className="font-mono text-cyan-400 text-[11px]">
          В конце раунда: 1 карта бесплатно из Отката в руку
        </div>
      </div>
    </div>
  );
};
