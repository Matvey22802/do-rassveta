import React from 'react';
import { Room, InteractableObject, RoomStatus } from '../types/game';
import { ArrowLeft, QrCode, CheckCircle, Lock, AlertCircle, Radio, Eye, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface RoomViewProps {
  room: Room;
  roomStatus: RoomStatus;
  allRooms: Room[];
  onBackToMap: () => void;
  onOpenScanner: (interactable: InteractableObject) => void;
  onUnlockRoomDirectly?: (roomId: string) => void;
}

export const RoomView: React.FC<RoomViewProps> = ({
  room,
  roomStatus,
  allRooms,
  onBackToMap,
  onOpenScanner
}) => {
  const isLocked = roomStatus === 'locked';

  return (
    <div className="flex flex-col flex-1 max-w-5xl mx-auto w-full px-4 lg:px-8 py-6">
      {/* Back button and navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            sound.playClick();
            onBackToMap();
          }}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#16202c] hover:bg-[#1e2c3c] border border-[#2b3a4a] text-[#c9d1d9] hover:text-white font-medium transition shadow"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Вернуться к карте здания</span>
        </button>

        <div className="flex items-center space-x-2">
          {room.isCCTVRoom && (
            <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold tracking-wider bg-cyan-950/80 border border-cyan-600/70 text-cyan-300 flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>ПОСТ КООРДИНАТОРА</span>
            </span>
          )}
          <span
            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
              isLocked
                ? 'bg-amber-950/80 border border-amber-600/70 text-amber-300'
                : 'bg-emerald-950/80 border border-emerald-600/70 text-emerald-300'
            }`}
          >
            {isLocked ? 'Заперто снаружи' : 'Доступно для исследования'}
          </span>
        </div>
      </div>

      {/* Main Room Atmosphere Card */}
      <div className="bg-[#141d27] border border-[#293848] rounded-2xl p-6 lg:p-8 shadow-2xl mb-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase mb-1">
            {room.subtitle}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-wide font-mono mb-4">
            {room.name}
          </h1>

          <p className="text-base lg:text-lg text-[#c9d1d9] leading-relaxed mb-6 font-normal">
            {room.description}
          </p>

          {/* Environmental Deduction Clue Box */}
          <div className="bg-[#101720] border-l-4 border-amber-500 rounded-r-xl p-4 lg:p-5 mb-2 shadow-inner">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs uppercase font-bold tracking-wider text-amber-400 font-mono mb-1">
                  Обстановка и визуальные зацепки
                </div>
                <div className="text-sm text-[#e6edf3] leading-relaxed">
                  {room.visualClue}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Special Coordinator Dispatcher Panel (if CCTV Room) */}
      {room.isCCTVRoom && (
        <div className="mb-6 bg-[#0f1722] border border-cyan-800/60 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-cyan-950 border border-cyan-600 rounded-xl text-cyan-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
                Мониторы системы наблюдения «Аврора-CCTV»
              </h3>
              <p className="text-xs text-[#8b949e]">
                Игрок в этой комнате выполняет роль Координатора в свой ход
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#c9d1d9] mb-4">
            <div className="p-3.5 rounded-xl bg-[#141e2b] border border-[#233345]">
              <span className="font-bold text-cyan-300 font-mono uppercase block mb-1">
                Канал информации (Бесшумно):
              </span>
              Коды, пароли и схемы передаются друзьям на расстояние мгновенно через радиосвязь Координатора.
            </div>
            <div className="p-3.5 rounded-xl bg-[#141e2b] border border-[#233345]">
              <span className="font-bold text-red-300 font-mono uppercase block mb-1">
                Физические предметы (С шумом):
              </span>
              Через камеры передать нельзя! Переброс инструмента в другую комнату шумит и привлекает 1 Зомби.
            </div>
          </div>

          {/* Quick Peek at Other Rooms */}
          <div className="border-t border-[#1e2c3c] pt-4">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-3 flex items-center space-x-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Камеры других секторов этажа:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {allRooms
                .filter((r) => r.id !== room.id)
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-lg bg-[#141d27] border border-[#253547] text-[11px]"
                  >
                    <div className="font-bold text-white truncate">{r.name}</div>
                    <div className="text-[#8b949e] text-[10px] truncate">{r.subtitle}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Interactable Objects Section */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-mono tracking-wider text-white uppercase flex items-center space-x-2">
            <span>Объекты для взаимодействия</span>
            <span className="text-xs font-sans font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-full">
              {room.interactables.filter((i) => i.resolved).length} / {room.interactables.length}
            </span>
          </h2>
          <span className="text-xs text-[#8b949e]">
            Поднесите физическую карту к камере или введите код
          </span>
        </div>

        {room.interactables.length === 0 ? (
          <div className="p-8 text-center bg-[#141d27] border border-[#243343] rounded-2xl text-[#8b949e]">
            В этой комнате нет сюжетных механизмов. Обыскивайте физическую стопку карт комнаты на столе.
          </div>
        ) : (
          <div className="space-y-4">
            {room.interactables.map((obj) => (
              <div
                key={obj.id}
                className={`p-5 lg:p-6 rounded-2xl border transition-all ${
                  obj.resolved
                    ? 'bg-[#101b17] border-emerald-900/60'
                    : 'bg-[#16202c] border-[#293a4b] hover:border-cyan-500/70'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2.5 mb-1.5">
                      {obj.resolved ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      )}
                      <h3 className="text-lg lg:text-xl font-bold text-white font-mono">
                        {obj.name}
                      </h3>
                    </div>

                    <p className="text-sm text-[#8b949e] leading-relaxed mb-3">
                      {obj.description}
                    </p>

                    {obj.resolved && (
                      <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-xs text-emerald-300 font-medium">
                        ✓ {obj.successMessage}
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  {!obj.resolved ? (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onOpenScanner(obj);
                      }}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm lg:text-base tracking-wide flex items-center justify-center space-x-2 shadow-lg shadow-cyan-950/60 hover:shadow-cyan-900/80 active:scale-95 transition"
                    >
                      <QrCode className="w-5 h-5" />
                      <span>Применить карту</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider px-3 py-2 bg-emerald-950/40 rounded-lg border border-emerald-800/40">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Выполнено
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table search deck reminder */}
      <div className="mt-8 p-4 rounded-xl bg-[#0f151e] border border-[#1f2b38] flex items-center justify-between text-xs text-[#8b949e]">
        <span>
          <b className="text-cyan-300">Стопка обыска комнаты на столе:</b> Вскрывайте карты на столе, пока хватает карт на руках игрока.
        </span>
        <span className="font-mono text-amber-400 hidden sm:inline">
          Откат: 1 карта возвращается в руку в конце раунда
        </span>
      </div>
    </div>
  );
};
