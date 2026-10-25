import React, { useState, useEffect } from 'react';
import {
  Skull,
  Wrench,
  AlertTriangle,
  QrCode,
  X,
  Volume2,
  VolumeX,
  Flame,
  Radio,
  Lock,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Room, RoomStatus, Character, InteractableObject } from '../types/game';
import { sound } from '../utils/audio';

interface AuthenticRoomStageProps {
  floorNumber: number;
  room: Room;
  roomStatus: RoomStatus;
  activeCharacter: Character;
  allCharacters?: Character[];
  characterFloors?: Record<string, number>;
  resolvedInteractables: string[];
  powerState: 'online' | 'warning' | 'blackout';
  onOpenScanner: (interactable: InteractableObject) => void;
  onOpenElevator: () => void;
}

export const AuthenticRoomStage: React.FC<AuthenticRoomStageProps> = ({
  floorNumber,
  room,
  roomStatus,
  activeCharacter,
  allCharacters,
  characterFloors,
  resolvedInteractables,
  powerState,
  onOpenScanner,
  onOpenElevator
}) => {
  const [activeModalItem, setActiveModalItem] = useState<{
    id: string;
    title: string;
    subtitle: string;
    description: string;
    requiredCode?: string;
    cardName?: string;
    resolved?: boolean;
    interactable?: InteractableObject;
    type?: string;
  } | null>(null);

  const isBlackout = powerState === 'blackout';
  const isFloor06 = floorNumber === 6;
  const isFloor05 = floorNumber === 5;
  const isFloor04 = floorNumber === 4;
  const isFloor03 = floorNumber === 3;
  const isFloor02 = floorNumber === 2;
  const isFloor01 = floorNumber === 1;

  // Status checks for interactive elements
  const coolingResolved = resolvedInteractables.includes('pipe_cooling');
  const generatorResolved = resolvedInteractables.includes('diesel_gen');
  const cargoElevatorResolved = resolvedInteractables.includes('cargo_elevator');
  const roofHatchResolved = resolvedInteractables.includes('roof_hatch');
  const managerSafeResolved = resolvedInteractables.includes('manager_safe');
  const cctvUnlocked = !roomStatus || roomStatus !== 'locked';

  // Heroes stationed on this floor
  const heroesInThisRoom = (allCharacters || (activeCharacter ? [activeCharacter] : [])).filter((c) => {
    if (characterFloors && characterFloors[c.id] !== undefined) {
      return characterFloors[c.id] === floorNumber;
    }
    return c.id === activeCharacter?.id;
  });
  const displayHeroes = heroesInThisRoom.length > 0 ? heroesInThisRoom : (activeCharacter ? [activeCharacter] : []);

  // Procedural audio: start water sound if on Floor 3 and pipe is not fixed
  useEffect(() => {
    if (isFloor03 && !coolingResolved) {
      sound.startWaterSound();
    } else {
      sound.stopWaterSound();
    }

    return () => {
      sound.stopWaterSound();
    };
  }, [isFloor03, coolingResolved]);

  // Find interactable object from room scenario
  const getInteractable = (id: string) => room.interactables.find((i) => i.id === id);

  // Formatted room title
  const roomTitleFormatted = `ЭТАЖ 0${floorNumber} • ${room.name.toUpperCase()}`;

  return (
    <div className="relative w-full aspect-[16/9] max-h-[72vh] mx-auto rounded-3xl overflow-hidden border-2 border-[#202d3d] shadow-2xl bg-black select-none flex flex-col justify-between">
      {/* 1. ROOM BACKGROUND LAYER */}
      {isFloor03 ? (
        <img
          src="/rooms/floor03_tech.png"
          alt="Этаж 03: Техническое помещение"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      ) : isFloor04 ? (
        <img
          src="/rooms/floor04_lounge.png"
          alt="Этаж 04: Комната отдыха"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      ) : (
        /* Atmospheric Architectural Vector Background for Floors 1, 2, 5, 6 */
        <div className="absolute inset-0 bg-[#0c1218] overflow-hidden pointer-events-none">
          {/* Concrete Wall Grid & Overhead Fluorescent Light Fixture */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#182330] to-transparent"></div>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-72 h-3 rounded-full bg-amber-100/30 blur-md"></div>
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-[#090e14] border-t-2 border-[#1c2937]"></div>

          {/* Integrated Elevator Shaft Portal on the left (matches user's art) */}
          <div className="absolute top-[18%] left-[2.2%] w-[18%] h-[72%] rounded-2xl border-4 border-[#2d3f52] bg-[#101720] shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Top Amber LED Matrix Display above door */}
            <div className="w-full bg-black py-1.5 px-3 border-b-2 border-[#202f3f] flex items-center justify-between">
              <span className="font-mono font-black text-amber-400 text-sm tracking-wider">
                0{floorNumber}
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            </div>

            {/* Elevator Sliding Doors (Steel panels with vertical split seam) */}
            <div className="relative flex-1 bg-gradient-to-r from-[#172330] via-[#1f3044] to-[#172330] flex items-center justify-center">
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-black"></div>
              <div className="w-full h-8 bg-black/40 hazard-stripes"></div>
            </div>

            {/* Bottom threshold */}
            <div className="w-full h-3 bg-[#0d141c] border-t border-gray-700"></div>
          </div>

          {/* Floor 6: Industrial roof trusses & night sky through hatch */}
          {isFloor06 && (
            <>
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl anim-city-fire"></div>
              {/* Roof ladder silhouette */}
              <div className="absolute top-[18%] right-[22%] w-14 h-[60%] border-x-4 border-gray-600 flex flex-col justify-between py-2">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="w-full h-1 bg-gray-500"></div>
                ))}
              </div>
              {/* Ceiling Hatch */}
              <div className="absolute top-[12%] right-[20%] w-20 h-8 rounded-full border-4 border-amber-500/80 bg-black/80 flex items-center justify-center">
                <span className="text-[9px] font-mono font-bold text-amber-400">ЛЮК КРЫШИ</span>
              </div>
            </>
          )}

          {/* Floor 5: Executive panoramic window overlooking burning city skyline */}
          {isFloor05 && (
            <>
              {/* Panoramic window */}
              <div className="absolute top-[15%] left-[26%] right-[28%] h-[55%] rounded-2xl border-4 border-[#253648] bg-black/90 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-orange-950/60 via-black to-slate-950"></div>
                {/* Burning skyline glow */}
                <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-amber-600/30 to-transparent anim-city-fire"></div>
                {/* Silhouette high-rises */}
                <div className="absolute bottom-0 left-4 w-12 h-28 bg-[#070b10]"></div>
                <div className="absolute bottom-0 left-20 w-16 h-36 bg-[#070b10]"></div>
                <div className="absolute bottom-0 right-8 w-20 h-32 bg-[#070b10]"></div>
                {/* Window vertical mullions */}
                <div className="absolute inset-y-0 left-1/3 w-1 bg-gray-700"></div>
                <div className="absolute inset-y-0 right-1/3 w-1 bg-gray-700"></div>
              </div>
              {/* Overturned Bookshelf Silhouette */}
              <div className="absolute bottom-[18%] right-[10%] w-36 h-48 border-2 border-gray-700 bg-[#0e1620] rotate-6 shadow-2xl"></div>
            </>
          )}

          {/* Floor 2: Central Lobby & Cargo Elevator to Bunker */}
          {isFloor02 && (
            <>
              {/* Massive Bunker Elevator Doors */}
              <div className="absolute top-[20%] left-[32%] w-[38%] h-[62%] rounded-2xl border-4 border-[#3d4f63] bg-[#101923] shadow-2xl flex flex-col justify-between p-3">
                <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">СПУСК В ПОДЗЕМНЫЙ БУНКЕР</span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">ПУТЬ А</span>
                </div>
                {/* Double blast door seams */}
                <div className="absolute inset-y-8 left-1/2 -translate-x-1/2 w-1 bg-black hazard-stripes"></div>
                {/* Heavy hydraulic pistons */}
                <div className="flex items-center justify-between text-[9px] font-mono text-gray-500">
                  <span>ГИДРАВЛИКА: {cargoElevatorResolved ? 'РАЗЖАТО ✓' : 'ЗАБЛОКИРОВАНО'}</span>
                  <span>1000 ТОНН</span>
                </div>
              </div>
            </>
          )}

          {/* Floor 1: Medical Ward & Apartment 14A */}
          {isFloor01 && (
            <>
              {/* Cold blue quartz lamp glow */}
              <div className="absolute top-[18%] left-[35%] w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl anim-quartz"></div>
              {/* Overturned medical gurney */}
              <div className="absolute bottom-[20%] left-[30%] w-44 h-16 border-2 border-gray-600 bg-gray-900/80 -rotate-3 rounded-lg shadow-xl"></div>
              {/* IV Drip Stand */}
              <div className="absolute bottom-[20%] left-[26%] w-1.5 h-36 bg-gray-500"></div>
              {/* Medical Cabinet with Red Cross */}
              <div className="absolute top-[25%] right-[16%] w-24 h-40 rounded-xl border-2 border-red-500/60 bg-[#121a24] shadow-2xl flex flex-col items-center justify-center p-2">
                <div className="w-8 h-8 rounded-full bg-red-950 border border-red-500 flex items-center justify-center text-red-400 font-black text-sm mb-1">
                  +
                </div>
                <span className="text-[9px] font-mono font-bold text-gray-300 text-center">ЗАПАС #105</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* 2. DYNAMIC PROCEDURAL FX LAYERS */}
      {/* Water flow & spray animation over the burst pipe (Floor 03) */}
      {isFloor03 && !coolingResolved && (
        <div className="absolute top-[32%] left-[55%] w-[12%] h-[38%] pointer-events-none">
          <div className="absolute inset-0 bg-cyan-300/15 rounded-full blur-md animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-3 h-3 bg-white/70 rounded-full blur-xs anim-spark"></div>
        </div>
      )}

      {/* Flashing Red Alarm Beacon over elevator door */}
      <div className="absolute top-[8.5%] left-[10.8%] w-6 h-6 rounded-full pointer-events-none flex items-center justify-center z-20">
        <div className={`w-3.5 h-3.5 rounded-sm ${isBlackout || (!coolingResolved && isFloor03) ? 'bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.9)] animate-ping' : 'bg-red-900/60'}`}></div>
      </div>

      {/* Blackout Emergency Lighting Overlay */}
      {isBlackout && (
        <div className="absolute inset-0 bg-red-950/30 blackout-emergency pointer-events-none z-10"></div>
      )}

      {/* Scanline CRT overlay */}
      <div className="absolute inset-0 scanline opacity-20 pointer-events-none z-10"></div>

      {/* 3. MINIMALIST TOP RULE HEADER (EXACT 1:1 REPLICA OF USER ARTWORK HEADER) */}
      <div className="relative z-20 w-full pt-3 px-5 sm:px-8 pointer-events-none">
        <div className="flex items-center justify-between pb-1.5 border-b border-white/20">
          {/* Left Title: ДО РАССВЕТА with red accent line */}
          <div className="flex flex-col">
            <span className="font-mono text-sm sm:text-base font-black tracking-widest text-white uppercase drop-shadow">
              ДО РАССВЕТА
            </span>
            <div className="w-10 h-0.5 bg-red-600 mt-0.5"></div>
          </div>

          {/* Right Floor: ЭТАЖ XX • НАЗВАНИЕ */}
          <div className="flex items-center space-x-2">
            {room.initialZombies > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/90 border border-red-600 text-red-300 flex items-center space-x-1 animate-pulse mr-2">
                <Skull className="w-3 h-3" />
                <span>1 ЗОМБИ</span>
              </span>
            )}
            <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-[#d1d5db] uppercase drop-shadow">
              {roomTitleFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE HOTSPOTS ANCHORED DIRECTLY ONTO ARTWORK OBJECTS */}
      {/* 4A. INTEGRATED ELEVATOR SHAFT CALL ANCHOR (Far Left ~18% width) */}
      <button
        type="button"
        aria-label="Вызвать лифт"
        onClick={() => {
          sound.playClick();
          onOpenElevator();
        }}
        title="Вызвать лифт и открыть пульт перемещения"
        className="absolute top-[18%] left-[2.2%] w-[18%] h-[72%] cursor-pointer group z-20 rounded-xl transition-all text-left bg-transparent border-0 p-0"
      >
        {/* Hover bracket highlight */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-400/80 rounded-xl bg-cyan-950/0 group-hover:bg-cyan-950/20 transition shadow-inner">
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/85 border border-cyan-400 text-[10px] font-mono font-bold text-cyan-300 opacity-0 group-hover:opacity-100 transition shadow">
            🛗 ПУЛЬТ ЛИФТА
          </div>
        </div>

        {/* Pulsing button on the elevator frame */}
        <div className="absolute top-[48%] right-[10%] w-5 h-7 rounded-sm border border-amber-400/80 bg-amber-400/20 flex items-center justify-center animate-pulse">
          <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"></div>
        </div>
      </button>

      {/* 4B. FLOOR 06 (Roof & Tech Sector) */}
      {isFloor06 && (
        <>
          {/* Roof Hatch (Final Path B) */}
          <button
            type="button"
            aria-label="Люк на вертолетную площадку"
            onClick={() => {
              sound.playClick();
              const hatchObj = getInteractable('roof_hatch');
              setActiveModalItem({
                id: 'roof_hatch',
                title: 'СТАЛЬНОЙ ЛЮК НА ВЕРТОЛЕТНУЮ ПЛОЩАДКУ',
                subtitle: roofHatchResolved ? 'Эвакуация подготовлена' : 'Финал Пути Б (Крыша)',
                description: roofHatchResolved
                  ? 'Люк на вертолетную площадку открыт. Сигнальная ракета подала знак военному вертолету эвакуации!'
                  : 'Массивный люк на вертолетную площадку намертво заклинил. Чтобы вызвать вертолет, требуется: поданное питание с Генераторной + скан #201 Схема радиочастот + скан #105 Сигнальная ракетница!',
                requiredCode: '201',
                cardName: 'Схема радиочастот (#201) и Ракетница (#105)',
                resolved: roofHatchResolved,
                interactable: hatchObj
              });
            }}
            style={{ top: '15%', left: '72%', width: '18%', height: '32%' }}
            className="absolute cursor-pointer group z-20 bg-transparent border-0 p-0 text-left"
          >
            <div className={`w-full h-full rounded-2xl border-2 transition flex flex-col items-center justify-center ${
              roofHatchResolved ? 'border-emerald-500/70 bg-emerald-950/20' : 'border-amber-500/70 bg-amber-950/20 hover:border-amber-400'
            }`}>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 border border-amber-500 text-amber-300">
                {roofHatchResolved ? 'ВЕРТОЛЕТ ГОТОВ ✓' : '🚁 ЛЮК КРЫШИ (ПУТЬ Б)'}
              </span>
            </div>
          </button>

          {/* Vent Grate */}
          <button
            type="button"
            aria-label="Вентиляционная шахта"
            onClick={() => {
              sound.playClick();
              const ventObj = getInteractable('vent_grate');
              setActiveModalItem({
                id: 'vent_grate',
                title: 'ВЕНТИЛЯЦИОННАЯ ШАХТА ТВАРЕЙ',
                subtitle: 'Угроза прорыва зараженных',
                description: 'Решетка дрожит под ударами тварей. Ее можно намертво заварить с помощью #104 Сварочный аппарат, чтобы навсегда остановить спавн зомби на этаже!',
                requiredCode: '104',
                cardName: 'Сварочный аппарат (#104)',
                resolved: resolvedInteractables.includes('vent_grate'),
                interactable: ventObj
              });
            }}
            style={{ top: '45%', left: '36%', width: '18%', height: '26%' }}
            className="absolute cursor-pointer group z-20 bg-transparent border-0 p-0"
          >
            <div className="w-full h-full rounded-2xl border-2 border-transparent group-hover:border-red-500 group-hover:bg-red-950/20 transition flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-mono font-bold text-red-300 bg-black/80 px-2 py-0.5 rounded border border-red-500">
                РЕШЕТКА ШАХТЫ
              </span>
            </div>
          </button>
        </>
      )}

      {/* 4C. FLOOR 05 (Archive & Manager Office) */}
      {isFloor05 && (
        <>
          {/* Manager's Wall Safe */}
          <button
            type="button"
            aria-label="Сейф управляющего"
            onClick={() => {
              sound.playClick();
              const safeObj = getInteractable('manager_safe');
              setActiveModalItem({
                id: 'manager_safe',
                title: 'КОДОВЫЙ СЕЙФ УПРАВЛЯЮЩЕГО',
                subtitle: managerSafeResolved ? 'Сейф вскрыт' : 'Секретные документы комплекса',
                description: managerSafeResolved
                  ? 'Сейф управляющего открыт. Внутри находился #205 Компромат корпорации и резервный #102 Электронный пропуск!'
                  : 'Тяжелый сенсорный сейф, скрытый за картиной. Требует скан #203 Пин-код управляющего + проверку [Тишина 🤫].',
                requiredCode: '203',
                cardName: 'Пин-код управляющего (#203)',
                resolved: managerSafeResolved,
                interactable: safeObj
              });
            }}
            style={{ top: '30%', left: '74%', width: '16%', height: '32%' }}
            className="absolute cursor-pointer group z-20 bg-transparent border-0 p-0 text-left"
          >
            <div className={`w-full h-full rounded-2xl border-2 transition flex flex-col items-center justify-center ${
              managerSafeResolved ? 'border-emerald-500/70 bg-emerald-950/20' : 'border-amber-500/70 bg-amber-950/20 hover:border-amber-400'
            }`}>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 border border-amber-500 text-amber-300">
                {managerSafeResolved ? 'СЕЙФ ОТКРЫТ ✓' : '🔐 СЕЙФ #203'}
              </span>
            </div>
          </button>

          {/* Shredder Server */}
          <button
            type="button"
            aria-label="Шредер и сервер"
            onClick={() => {
              sound.playClick();
              const shredderObj = getInteractable('shredder_server');
              setActiveModalItem({
                id: 'shredder_server',
                title: 'ШРЕДЕР И СЕРВЕРНАЯ СТОЙКА',
                subtitle: 'Уничтожение улик (Личная цель)',
                description: 'Терминал экстренного уничтожения данных. Требует #205 Компромат корпорации для выполнения тайной личной цели «Чистильщик».',
                requiredCode: '205',
                cardName: 'Компромат корпорации (#205)',
                resolved: resolvedInteractables.includes('shredder_server'),
                interactable: shredderObj
              });
            }}
            style={{ top: '48%', left: '32%', width: '16%', height: '28%' }}
            className="absolute cursor-pointer group z-20 bg-transparent border-0 p-0"
          >
            <div className="w-full h-full rounded-2xl border-2 border-transparent group-hover:border-cyan-400 group-hover:bg-cyan-950/20 transition flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-mono font-bold text-cyan-300 bg-black/80 px-2 py-0.5 rounded border border-cyan-400">
                ШРЕДЕР ДАННЫХ
              </span>
            </div>
          </button>
        </>
      )}

      {/* 4D. FLOOR 04 (Lounge & CCTV Room) */}
      {isFloor04 && (
        <>
          {/* Lounge Sofa */}
          <button
            type="button"
            aria-label="Зона отдыха"
            onClick={() => {
              sound.playClick();
              setActiveModalItem({
                id: 'lounge_sofa',
                title: 'ЗОНА ОТДЫХА И ЖУРНАЛЬНЫЙ СТОЛИК',
                subtitle: 'Следы внезапной эвакуации',
                description: 'Опрокинутые подушки, брошенные документы и стаканчики с кофе. На столе лежат бумаги с пометками службы безопасности комплекса.',
                type: 'shelves'
              });
            }}
            style={{ top: '54%', left: '26%', width: '34%', height: '24%' }}
            className="absolute cursor-pointer group z-20 bg-transparent border-0 p-0"
          >
            <div className="w-full h-full rounded-2xl border-2 border-transparent group-hover:border-cyan-400 group-hover:bg-cyan-950/20 transition flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-mono font-bold text-cyan-300 bg-black/80 px-2 py-0.5 rounded border border-cyan-400 shadow">
                ИССЛЕДОВАТЬ
              </span>
            </div>
          </button>

          {/* Kitchenette & Fridge */}
          <button
            type="button"
            aria-label="Кухонный блок"
            onClick={() => {
              sound.playClick();
              setActiveModalItem({
                id: 'kitchen_fridge',
                title: 'КУХОННЫЙ БЛОК И ХОЛОДИЛЬНИК',
                subtitle: 'Припасы персонала',
                description: 'Холодильник с записками на дверце, микроволновка и кофеварка. Возьмите карту припасов или аптечки при обыске.',
                type: 'workbench'
              });
            }}
            style={{ top: '40%', left: '62%', width: '25%', height: '35%' }}
            className="absolute cursor-pointer group z-20 bg-transparent border-0 p-0"
          >
            <div className="w-full h-full rounded-2xl border-2 border-transparent group-hover:border-amber-400 group-hover:bg-amber-950/20 transition flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-mono font-bold text-amber-300 bg-black/80 px-2 py-0.5 rounded border border-amber-400 shadow">
                КУХНЯ
              </span>
            </div>
          </button>
        </>
      )}

      {/* 4E. FLOOR 03 (Technical Room / Pipe / Generator) */}
      {isFloor03 && (
        <>
          {/* Burst Pipe Hotspot */}
          <button
            type="button"
            aria-label="Свищ трубы охлаждения"
            onClick={() => {
              sound.playClick();
              const pipeObj = getInteractable('pipe_cooling');
              setActiveModalItem({
                id: 'pipe_cooling',
                title: 'ПРОБИТАЯ МАГИСТРАЛЬ ОХЛАЖДЕНИЯ',
                subtitle: coolingResolved ? 'Течь ликвидирована' : 'Критическая авария водоснабжения',
                description: coolingResolved
                  ? 'Свищ трубы охлаждения надежно заделан. Давление в контуре нормализовано.'
                  : 'Свищ магистрали охлаждения хлещет под высоким давлением! Вода заливает пол отсека. Если не заделать пробой, затопление обесточит генераторную.',
                requiredCode: '106',
                cardName: 'Огнеупорный скотч (или #104 Сварочный аппарат)',
                resolved: coolingResolved,
                interactable: pipeObj
              });
            }}
            style={{ top: '30%', left: '54%', width: '15%', height: '42%' }}
            className="absolute cursor-pointer group z-20 bg-transparent border-0 p-0 text-left"
          >
            <div className={`w-full h-full rounded-2xl border-2 transition flex flex-col items-center justify-start pt-2 ${
              coolingResolved
                ? 'border-emerald-500/60 bg-emerald-950/20 hover:border-emerald-400'
                : 'border-amber-500/70 hover:border-amber-400 bg-amber-950/15 animate-pulse'
            }`}>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider shadow ${
                coolingResolved ? 'bg-emerald-950 border border-emerald-500 text-emerald-300' : 'bg-red-950 border border-red-500 text-red-300'
              }`}>
                {coolingResolved ? 'ПОЧИНЕНО ✓' : '💧 СВИЩ ТРУБЫ'}
              </span>
            </div>
          </button>

          {/* Red Emergency Valve Wheel */}
          <button
            type="button"
            aria-label="Аварийный вентиль перекрытия"
            onClick={() => {
              sound.playClick();
              setActiveModalItem({
                id: 'valve_wheel',
                title: 'АВАРИЙНЫЙ ВЕНТИЛЬ ПЕРЕКРЫТИЯ',
                subtitle: 'Ручной клапан магистрали',
                description: 'Чугунный вентиль аварийного сброса давления. Заклинил от ржавчины. Для проворота требуется физическое усилие [Сила 💪] или монтировка (#101).',
                requiredCode: '101',
                cardName: 'Монтировка (или Сила 💪)',
                resolved: coolingResolved,
                interactable: getInteractable('pipe_cooling')
              });
            }}
            style={{ top: '32%', left: '77%', width: '8%', height: '14%' }}
            className="absolute cursor-pointer group z-20 bg-transparent border-0 p-0"
          >
            <div className="w-full h-full rounded-full border-2 border-transparent group-hover:border-red-400 group-hover:bg-red-950/30 transition flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-mono font-bold text-red-300 bg-black/80 px-1.5 py-0.5 rounded border border-red-500 -mt-8 shadow">
                ВЕНТИЛЬ
              </span>
            </div>
          </button>

          {/* Tool Shelves on the left */}
          <button
            type="button"
            aria-label="Стеллаж с инструментами"
            onClick={() => {
              sound.playClick();
              setActiveModalItem({
                id: 'tool_shelves',
                title: 'МЕТАЛЛИЧЕСКИЙ СТЕЛЛАЖ С ИНСТРУМЕНТАМИ',
                subtitle: 'Стопка обыска отсека',
                description: 'На полках стоят емкости с растворителями, канистры и ящики с крепежом. Возьмите верхнюю карту из закрытой физической стопки на столе.',
                type: 'shelves'
              });
            }}
            style={{ top: '40%', left: '26%', width: '11%', height: '34%' }}
            className="absolute cursor-pointer group z-20 bg-transparent border-0 p-0"
          >
            <div className="w-full h-full rounded-xl border-2 border-transparent group-hover:border-cyan-400 group-hover:bg-cyan-950/20 transition flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-mono font-bold text-cyan-300 bg-black/80 px-1.5 py-0.5 rounded border border-cyan-400 shadow">
                🎴 ОБЫСК
              </span>
            </div>
          </button>

          {/* Workbench on the right */}
          <button
            type="button"
            aria-label="Верстак слесаря"
            onClick={() => {
              sound.playClick();
              setActiveModalItem({
                id: 'workbench_tools',
                title: 'ВЕРСТАК И КРАСНЫЙ ЯЩИК С ИНСТРУМЕНТОМ',
                subtitle: 'Слесарное место',
                description: 'На деревянном верстаке закреплены слесарные тиски, стоит красный металлический инструментальный бокс с ключами и паяльником.',
                type: 'workbench'
              });
            }}
            style={{ top: '56%', left: '75%', width: '15%', height: '22%' }}
            className="absolute cursor-pointer group z-20 bg-transparent border-0 p-0"
          >
            <div className="w-full h-full rounded-xl border-2 border-transparent group-hover:border-amber-400 group-hover:bg-amber-950/20 transition flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-mono font-bold text-amber-300 bg-black/80 px-1.5 py-0.5 rounded border border-amber-400 shadow">
                ВЕРСТАК
              </span>
            </div>
          </button>
        </>
      )}

      {/* 4F. FLOOR 02 (Central Lobby / Cargo Elevator to Bunker) */}
      {isFloor02 && (
        <>
          {/* Cargo Elevator (Final Path A) */}
          <button
            type="button"
            aria-label="Грузовой лифт в бункер"
            onClick={() => {
              sound.playClick();
              const cargoObj = getInteractable('cargo_elevator');
              setActiveModalItem({
                id: 'cargo_elevator',
                title: 'ГРУЗОВОЙ ЛИФТ В ПОДЗЕМНЫЙ БУНКЕР',
                subtitle: cargoElevatorResolved ? 'Спуск подготовлен' : 'Финал Пути А (Бункер)',
                description: cargoElevatorResolved
                  ? 'Мастер-код введен, тормоза разжаты с шипением гидравлики. Тяжелая клеть готова к спуску команды в бункер!'
                  : 'Тяжелый грузовой лифт в бронебункер. Требует: питание от Генераторной + скан #202 Мастер-код шахты + скан #101 Монтировка (разжать тормоза) + усилие [Техника 🔧].',
                requiredCode: '202',
                cardName: 'Мастер-код шахты (#202) и Монтировка (#101)',
                resolved: cargoElevatorResolved,
                interactable: cargoObj
              });
            }}
            style={{ top: '22%', left: '34%', width: '34%', height: '56%' }}
            className="absolute cursor-pointer group z-20 bg-transparent border-0 p-0 text-left"
          >
            <div className={`w-full h-full rounded-2xl border-2 transition flex flex-col items-center justify-center ${
              cargoElevatorResolved ? 'border-emerald-500/80 bg-emerald-950/20' : 'border-amber-500/80 bg-amber-950/20 hover:border-amber-400'
            }`}>
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black uppercase tracking-wider bg-black/85 border border-amber-500 text-amber-300 shadow">
                {cargoElevatorResolved ? 'БУНКЕР ОТКРЫТ ✓' : '🛡️ ГРУЗОВОЙ ЛИФТ (ПУТЬ А)'}
              </span>
            </div>
          </button>

          {/* Stairwell Blast Door */}
          <button
            type="button"
            aria-label="Гермодверь лестницы"
            onClick={() => {
              sound.playClick();
              const doorObj = getInteractable('stairwell_blast_door');
              setActiveModalItem({
                id: 'stairwell_blast_door',
                title: 'ВХОДНАЯ ГЕРМОДВЕРЬ ПОЖАРНОЙ ЛЕСТНИЦЫ',
                subtitle: 'Баррикада нижних пролетов',
                description: 'Металлическая дверь с бронированным глазком, ведущая на нижние пожарные лестницы комплекса. Здесь в Час 2 раздастся отчаянный стук выжившего.',
                requiredCode: '102',
                cardName: 'Ключ-карта охраны (#102)',
                resolved: resolvedInteractables.includes('stairwell_blast_door'),
                interactable: doorObj
              });
            }}
            style={{ top: '35%', left: '74%', width: '16%', height: '45%' }}
            className="absolute cursor-pointer group z-20 bg-transparent border-0 p-0"
          >
            <div className="w-full h-full rounded-2xl border-2 border-transparent group-hover:border-red-500 group-hover:bg-red-950/20 transition flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-mono font-bold text-red-300 bg-black/80 px-2 py-0.5 rounded border border-red-500">
                ГЕРМОДВЕРЬ
              </span>
            </div>
          </button>
        </>
      )}

      {/* 4G. FLOOR 01 (Medical Ward / Apt 14A) */}
      {isFloor01 && (
        <>
          {/* Emergency Medicine Locker */}
          <button
            type="button"
            aria-label="Шкафчик экстренного запаса"
            onClick={() => {
              sound.playClick();
              const lockerObj = getInteractable('emergency_supply_cabinet');
              setActiveModalItem({
                id: 'emergency_supply_cabinet',
                title: 'ЗАПЕРТЫЙ ШКАФЧИК ЭКСТРЕННОГО ЗАПАСА',
                subtitle: resolvedInteractables.includes('emergency_supply_cabinet') ? 'Шкафчик вскрыт' : 'Особый арсенал',
                description: resolvedInteractables.includes('emergency_supply_cabinet')
                  ? 'Шкафчик вскрыт. Внутри находилась #105 «Сигнальная ракетница» для вызова вертолета на Крыше!'
                  : 'Запертый металлический ящик с красным крестом. Требует карты с иконкой [Взлом 🔧] (или скан #101 Монтировка / #102 Пропуск) ➔ выдает #105 Сигнальная ракетница!',
                requiredCode: '101',
                cardName: 'Инструмент [Взлом 🔧] (#101 / #102)',
                resolved: resolvedInteractables.includes('emergency_supply_cabinet'),
                interactable: lockerObj
              });
            }}
            style={{ top: '24%', left: '74%', width: '18%', height: '42%' }}
            className="absolute cursor-pointer group z-20 bg-transparent border-0 p-0 text-left"
          >
            <div className="w-full h-full rounded-2xl border-2 border-transparent group-hover:border-amber-400 group-hover:bg-amber-950/20 transition flex flex-col items-center justify-center">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 border border-amber-500 text-amber-300 shadow">
                🚑 ШКАФ #105
              </span>
            </div>
          </button>

          {/* Collapsing Rubble Partition */}
          <button
            type="button"
            aria-label="Завал в детскую"
            onClick={() => {
              sound.playClick();
              const rubbleObj = getInteractable('collapsing_partition');
              setActiveModalItem({
                id: 'collapsing_partition',
                title: 'ОБРУШИВШАЯСЯ ПЕРЕГОРОДКА В ДЕТСКУЮ',
                subtitle: 'Место морального выбора №2 (Час 4)',
                description: 'Бетонные обломки намертво придавили дверной проем. Под завалом слышны стоны женщины с ребенком. Требует монтировку (#101) или сварку (#104).',
                requiredCode: '101',
                cardName: 'Монтировка (#101) или Сварка (#104)',
                resolved: resolvedInteractables.includes('collapsing_partition'),
                interactable: rubbleObj
              });
            }}
            style={{ top: '48%', left: '32%', width: '22%', height: '32%' }}
            className="absolute cursor-pointer group z-20 bg-transparent border-0 p-0"
          >
            <div className="w-full h-full rounded-2xl border-2 border-transparent group-hover:border-red-400 group-hover:bg-red-950/20 transition flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-mono font-bold text-red-300 bg-black/80 px-2 py-0.5 rounded border border-red-500 shadow">
                ЗАВАЛ
              </span>
            </div>
          </button>
        </>
      )}

      {/* 4.5. ATMOSPHERIC STICKMAN HERO SILHOUETTES WITH GOLDEN VOLUMETRIC RIM LIGHTING */}
      <div className="absolute bottom-[11%] left-[23%] z-20 flex items-end space-x-6 pointer-events-none">
        {displayHeroes.map((hero, hIdx) => {
          const isActive = hero.id === activeCharacter?.id;
          return (
            <div
              key={hero.id}
              className="flex flex-col items-center group transition-all duration-300"
              style={{
                transform: `translateX(${hIdx * 12}px)`
              }}
            >
              {/* Name Tag Pill */}
              <div
                className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold mb-1 shadow-md transition-all ${
                  isActive
                    ? 'bg-amber-400 text-black border border-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.8)] scale-105'
                    : 'bg-black/80 text-gray-300 border border-gray-700'
                }`}
              >
                {hero.name}
              </div>

              {/* Stickman / Stylized Silhouette with Golden Rim Lighting */}
              <svg
                width="34"
                height="80"
                viewBox="0 0 34 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  filter: isActive
                    ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.9)) drop-shadow(0 0 2px #fff)'
                    : 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.6))'
                }}
              >
                {/* Flashlight beam forward on the floor if active */}
                {isActive && (
                  <path
                    d="M24 38 L90 20 L100 70 L24 45 Z"
                    fill="url(#flashlightGlow)"
                    opacity="0.25"
                  />
                )}
                <defs>
                  <linearGradient id="flashlightGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Head */}
                <circle
                  cx="17"
                  cy="11"
                  r="7.5"
                  fill="#0c1219"
                  stroke="#fbbf24"
                  strokeWidth="1.6"
                />

                {/* Neck & Torso / Jacket */}
                <path
                  d="M12 20 L22 20 L24 46 L10 46 Z"
                  fill="#0c1219"
                  stroke="#fbbf24"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />

                {/* Left Arm */}
                <path
                  d="M11 22 L5 36 L7 44"
                  stroke="#fbbf24"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />

                {/* Right Arm (Holding equipment / flashlight) */}
                <path
                  d="M23 22 L28 34 L26 42"
                  stroke="#fbbf24"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />

                {/* Left Leg */}
                <path
                  d="M13 46 L11 64 L8 76"
                  stroke="#fbbf24"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />

                {/* Right Leg */}
                <path
                  d="M21 46 L23 64 L25 76"
                  stroke="#fbbf24"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              </svg>

              {/* Shadow on Floor */}
              <div className="w-8 h-2 rounded-full bg-black/70 blur-xs -mt-1"></div>
            </div>
          );
        })}
      </div>

      {/* 5. BOTTOM TACTICAL BAR (PHYSICAL TABLETOP DECK SYNCHRONIZATION) */}
      <div className="relative z-20 px-5 sm:px-8 pb-3 flex items-center justify-between pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md flex items-center space-x-2 text-xs font-mono text-[#d1d5db]">
          <span className="text-cyan-400 font-bold">🎴 СТОПКА ОБЫСКА НА СТОЛЕ:</span>
          <span className="text-white">
            {room.searchDeckNote || 'Возьмите верхнюю карту из стопки отсека'}
          </span>
        </div>

        {/* Clue hint */}
        <div className="px-3 py-1.5 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md text-xs font-mono text-amber-300/90 hidden sm:inline">
          💡 Кликните на объект в комнате для взаимодействия
        </div>
      </div>

      {/* 6. POPUP ACTION MODAL (INSPIRED BY REFERENCE VIDEO "DO YOU OPEN IT?") */}
      {activeModalItem && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-[#111923] border-2 border-cyan-500/80 rounded-3xl p-6 sm:p-7 shadow-2xl text-left animate-fadeIn">
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#182330] hover:bg-[#223345] text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider bg-cyan-950 border border-cyan-600 text-cyan-300 uppercase">
                {activeModalItem.subtitle}
              </span>
              <span className="text-xs font-mono text-gray-400">
                ЭТАЖ 0{floorNumber}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-mono font-black text-white uppercase tracking-wide mb-3">
              {activeModalItem.title}
            </h3>

            <p className="text-sm text-[#c9d1d9] leading-relaxed mb-4">
              {activeModalItem.description}
            </p>

            {activeModalItem.requiredCode && (
              <div className="p-3.5 rounded-xl bg-black/60 border border-[#233548] mb-6 flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400">Требуемая карта / предмет:</span>
                <span className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-600 text-amber-300 font-mono text-xs font-bold">
                  #{activeModalItem.requiredCode} {activeModalItem.cardName}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {activeModalItem.interactable && !activeModalItem.resolved ? (
                <button
                  type="button"
                  onClick={() => {
                    const item = activeModalItem.interactable!;
                    setActiveModalItem(null);
                    onOpenScanner(item);
                  }}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>СКАНИРОВАТЬ QR</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveModalItem(null)}
                  className="py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition flex items-center justify-center cursor-pointer"
                >
                  ПОНЯТНО
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="py-3 px-4 rounded-xl bg-[#1b2532] hover:bg-[#253344] border border-[#2d4054] text-gray-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider transition flex items-center justify-center cursor-pointer"
              >
                ЗАКРЫТЬ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
