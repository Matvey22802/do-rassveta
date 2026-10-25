import React, { useState, useEffect } from 'react';
import {
  Room,
  InteractableObject,
  LeakStatus,
  RescueSignalType,
  IrinaStatus
} from '../types/game';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Wrench,
  Zap,
  ZapOff,
  Flame,
  Radio,
  Eye,
  KeyRound,
  ShieldAlert,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Video,
  MonitorPlay,
  Info,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { sound } from '../utils/audio';
import { narrator } from '../utils/narrator';

interface FloorInspectionSceneProps {
  floorNumber: number;
  room: Room;
  power: boolean;
  leakStatus: LeakStatus;
  roofHatchOpen: boolean;
  rescueSignal: RescueSignalType;
  irinaStatus: IrinaStatus;
  doorReinforced: boolean;
  reservePower: boolean;
  resolvedInteractions: string[];
  onOpenObject: (interactable: InteractableObject, preselectedCards?: string[]) => void;
  onBackToCutaway: () => void;
}

export const FloorInspectionScene: React.FC<FloorInspectionSceneProps> = ({
  floorNumber,
  room,
  power,
  leakStatus,
  roofHatchOpen,
  rescueSignal,
  irinaStatus,
  doorReinforced,
  reservePower,
  resolvedInteractions,
  onOpenObject,
  onBackToCutaway
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isCCTVModalOpen, setIsCCTVModalOpen] = useState<boolean>(false);

  // Auto-play voice narration when entering the floor if auto-narrate is enabled
  useEffect(() => {
    const unsub = narrator.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });

    const textToSpeak = room.audioBriefingText || `${room.name}. ${room.quickAlert || room.description}`;
    if (narrator.isAutoNarrateEnabled()) {
      const timer = setTimeout(() => {
        narrator.speak(textToSpeak);
      }, 350);
      return () => {
        clearTimeout(timer);
        unsub();
        narrator.stop();
      };
    }

    return () => {
      unsub();
      narrator.stop();
    };
  }, [room]);

  const handleToggleVoice = () => {
    sound.playClick();
    if (isSpeaking) {
      narrator.stop();
    } else {
      const textToSpeak = room.audioBriefingText || `${room.name}. ${room.quickAlert || room.description}`;
      narrator.speak(textToSpeak);
    }
  };

  // Get authentic high-res room illustration art
  const getRoomIllustration = (): string => {
    switch (floorNumber) {
      case 15:
        return '/rooms/floor15_dispatch.png';
      case 14:
        return '/rooms/floor14_medbay.png';
      case 13:
        return '/rooms/floor13_lounge.png';
      case 12:
        return '/rooms/floor12_archive.png';
      case 11:
        return leakStatus === 'repaired'
          ? '/rooms/floor11_repaired.png'
          : '/rooms/floor11_leak.png';
      case 10:
        return '/rooms/floor10_generator.png';
      default:
        return '/rooms/floor13_lounge.png';
    }
  };

  const isLeakRepaired = leakStatus === 'repaired';

  return (
    <div className="flex-1 flex flex-col bg-[#070b10] text-[#e6edf3] p-2.5 sm:p-4 lg:p-6 select-none max-w-[1700px] mx-auto w-full">
      
      {/* 1. TOP BAR: NAVIGATION, AUDIO NARRATOR CONTROLS, POWER STATUS */}
      <div className="flex flex-wrap items-center justify-between mb-3 pb-2.5 border-b border-[#1c2c3d] gap-2.5">
        {/* Left: Back to Grand Skyscraper Cutaway */}
        <button
          data-testid="back-to-cutaway-btn"
          onClick={() => {
            sound.playClick();
            narrator.stop();
            onBackToCutaway();
          }}
          className="px-3.5 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← К общему плану здания</span>
        </button>

        {/* Center: Prominent Voice Audio Briefing Player */}
        <div className="flex items-center space-x-2 bg-[#121c27] border border-[#24374b] rounded-2xl px-3 py-1 shadow-md">
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`px-3 py-1 rounded-xl font-mono text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              isSpeaking
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.7)] animate-pulse'
                : 'bg-[#1b2b3b] hover:bg-cyan-600 text-white hover:text-white'
            }`}
          >
            {isSpeaking ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isSpeaking ? 'Пауза доклада' : '🔊 Озвучить обстановку'}</span>
          </button>

          {isSpeaking && (
            <div className="flex items-center space-x-1 px-1.5">
              <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce"></span>
              <span className="w-1 h-4 bg-cyan-300 rounded-full animate-pulse"></span>
              <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
            </div>
          )}

          <span className="text-[11px] font-mono text-gray-400 hidden sm:inline">
            {isSpeaking ? 'Голосовой доклад в эфире' : 'Слушайте голосом'}
          </span>
        </div>

        {/* Right: Simulated Video Feed & Power Grid State */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setIsCCTVModalOpen(true);
            }}
            className="px-3 py-1 rounded-xl bg-[#142230] hover:bg-[#1b3147] border border-cyan-500/60 text-cyan-300 font-bold flex items-center space-x-1.5 cursor-pointer shadow transition"
          >
            <MonitorPlay className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>📹 Камера FL {floorNumber}</span>
          </button>

          <span
            className={`px-3 py-1 rounded-xl border font-bold flex items-center space-x-1.5 ${
              !power
                ? 'bg-red-950/80 border-red-700 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                : 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
            }`}
          >
            {!power ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            <span>{!power ? 'ОБЕСТОЧЕНО' : 'СЕТЬ 220V'}</span>
          </span>
        </div>
      </div>

      {/* 2. MAIN SCENE LAYOUT: VISUAL ARCHITECTURAL STAGE (LEFT) + INTERACTIVE OBJECTS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        {/* Left Column: Atmospheric Room Stage Visual (16:9 Widescreen Illustration with Hotspots) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-3">
          <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-[#243a4e] shadow-2xl bg-black flex items-center justify-center group">
            
            {/* The Authentic Comic Illustration */}
            <img
              src={getRoomIllustration()}
              alt={room.name}
              className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-700 group-hover:scale-101"
            />

            {/* Ambient Lighting Vignette & Camera Scanlines */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>

            {/* Widescreen Security Camera HUD Elements */}
            <div className="absolute top-3 left-4 z-20 flex items-center space-x-2 font-mono text-[10px] text-cyan-400/90 pointer-events-none bg-black/60 px-2 py-0.5 rounded-lg border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="font-bold uppercase tracking-widest">
                CAM-FL{floorNumber} [LIVE FEED]
              </span>
            </div>

            <div className="absolute top-3 right-4 z-20 font-mono text-[10px] text-gray-400 pointer-events-none bg-black/60 px-2 py-0.5 rounded-lg border border-gray-800">
              {new Date().toLocaleTimeString()} // HD
            </div>

            {/* --- INTERACTIVE HOTSPOT OVERLAYS ON TOP OF ILLUSTRATION --- */}

            {/* Floor 11: Cooling Pipeline Hotspot */}
            {floorNumber === 11 && (
              <div
                style={{ top: '35%', left: '46%' }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
              >
                <button
                  type="button"
                  onClick={() => {
                    const obj = room.interactables.find((i) => i.id === 'obj_cooling_pipeline');
                    if (obj) {
                      sound.playClick();
                      onOpenObject(obj);
                    }
                  }}
                  className={`p-2 sm:p-2.5 rounded-2xl border-2 font-mono font-bold text-xs uppercase shadow-2xl transition cursor-pointer flex items-center space-x-2 active:scale-95 ${
                    isLeakRepaired
                      ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                      : 'bg-red-950/90 border-red-500 text-red-200 animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.7)] hover:scale-105'
                  }`}
                >
                  <span className="text-base">{isLeakRepaired ? '✓' : '💧'}</span>
                  <span>{isLeakRepaired ? 'Охлаждение: Ремонт завершен ✓' : 'Свищ магистрали (Применить карты)'}</span>
                </button>
              </div>
            )}

            {/* Floor 14: Irina Hotspot & Closed Wing Door Hotspot */}
            {floorNumber === 14 && (
              <>
                {/* Irina Cot Hotspot */}
                <div
                  style={{ top: '55%', left: '32%' }}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const obj = room.interactables.find((i) => i.id === 'obj_irina');
                      if (obj) {
                        sound.playClick();
                        onOpenObject(obj);
                      }
                    }}
                    className={`p-2 rounded-2xl border-2 font-mono font-bold text-xs shadow-2xl transition cursor-pointer flex items-center space-x-1.5 active:scale-95 ${
                      irinaStatus === 'prepared'
                        ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                        : irinaStatus === 'lost'
                        ? 'bg-gray-900 border-gray-700 text-gray-500 line-through'
                        : 'bg-red-950/90 border-red-500 text-red-200 animate-pulse hover:scale-105'
                    }`}
                  >
                    <span>💉</span>
                    <span>
                      {irinaStatus === 'prepared'
                        ? 'Ирина готова к эвакуации ✓'
                        : irinaStatus === 'lost'
                        ? 'Ирина погибла ✝'
                        : 'Диспетчер Ирина (Помощь)'}
                    </span>
                  </button>
                </div>

                {/* Quarantined Wing Door Hotspot */}
                <div
                  style={{ top: '50%', right: '12%' }}
                  className="absolute z-20 -translate-y-1/2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const obj = room.interactables.find((i) => i.id === 'obj_wing_door');
                      if (obj) {
                        sound.playClick();
                        onOpenObject(obj);
                      }
                    }}
                    className={`p-2 rounded-2xl border-2 font-mono font-bold text-xs shadow-2xl transition cursor-pointer flex items-center space-x-1.5 active:scale-95 ${
                      doorReinforced
                        ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                        : 'bg-amber-950/90 border-amber-500 text-amber-200 hover:scale-105'
                    }`}
                  >
                    <span>🚪</span>
                    <span>{doorReinforced ? 'Дверь укреплена ✓' : 'Пожарная дверь крыла'}</span>
                  </button>
                </div>
              </>
            )}

            {/* Floor 15: Roof Hatch & Radio Console Hotspots */}
            {floorNumber === 15 && (
              <>
                {/* Roof Hatch Ladder Hotspot */}
                <div
                  style={{ top: '28%', right: '28%' }}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const obj = room.interactables.find((i) => i.id === 'obj_roof_hatch');
                      if (obj) {
                        sound.playClick();
                        onOpenObject(obj);
                      }
                    }}
                    className={`p-2 rounded-2xl border-2 font-mono font-bold text-xs shadow-2xl transition cursor-pointer flex items-center space-x-1.5 active:scale-95 ${
                      roofHatchOpen
                        ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                        : 'bg-amber-950/90 border-amber-500 text-amber-200 animate-pulse hover:scale-105'
                    }`}
                  >
                    <span>🚁</span>
                    <span>{roofHatchOpen ? 'Люк на крышу открыт ✓' : 'Заклиненный люк на крышу'}</span>
                  </button>
                </div>

                {/* Radio Station Hotspot */}
                <div
                  style={{ top: '65%', left: '42%' }}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const obj = room.interactables.find((i) => i.id === 'obj_radio_station');
                      if (obj) {
                        sound.playClick();
                        onOpenObject(obj);
                      }
                    }}
                    className={`p-2 rounded-2xl border-2 font-mono font-bold text-xs shadow-2xl transition cursor-pointer flex items-center space-x-1.5 active:scale-95 ${
                      rescueSignal === 'radio'
                        ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                        : 'bg-[#152535]/90 border-cyan-400 text-cyan-200 hover:scale-105'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{rescueSignal === 'radio' ? 'Радиосвязь установлена ✓' : 'Радиостанция'}</span>
                  </button>
                </div>
              </>
            )}

            {/* Floor 10: Diesel Generator Relay Hotspot */}
            {floorNumber === 10 && (
              <div
                style={{ top: '50%', right: '22%' }}
                className="absolute z-20 -translate-y-1/2"
              >
                <button
                  type="button"
                  onClick={() => {
                    const obj = room.interactables.find((i) => i.id === 'obj_generator_relay');
                    if (obj) {
                      sound.playClick();
                      onOpenObject(obj);
                    }
                  }}
                  className={`p-2.5 rounded-2xl border-2 font-mono font-bold text-xs shadow-2xl transition cursor-pointer flex items-center space-x-1.5 active:scale-95 ${
                    power
                      ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                      : 'bg-amber-950/90 border-amber-500 text-amber-200 animate-pulse hover:scale-105'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>{power ? 'Защитное реле 220V: Норма ✓' : 'Реле генератора (Восстановить)'}</span>
                </button>
              </div>
            )}

            {/* Floor 12: Archive Safe Hotspot */}
            {floorNumber === 12 && (
              <div
                style={{ top: '55%', right: '35%' }}
                className="absolute z-20 -translate-y-1/2"
              >
                <button
                  type="button"
                  onClick={() => {
                    const obj = room.interactables.find((i) => i.id === 'obj_archive_safe');
                    if (obj) {
                      sound.playClick();
                      onOpenObject(obj);
                    }
                  }}
                  className="p-2 rounded-2xl border-2 border-slate-400 bg-slate-900/90 text-slate-200 font-mono font-bold text-xs shadow-2xl hover:scale-105 transition cursor-pointer flex items-center space-x-1.5 active:scale-95"
                >
                  <span>📁</span>
                  <span>Сейф схем и протоколов #203</span>
                </button>
              </div>
            )}

            {/* Floor 13: Lounge Supplies Hotspot */}
            {floorNumber === 13 && (
              <div
                style={{ top: '60%', left: '50%' }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
              >
                <button
                  type="button"
                  onClick={() => {
                    const obj = room.interactables.find((i) => i.id === 'obj_lounge_supplies');
                    if (obj) {
                      sound.playClick();
                      onOpenObject(obj);
                    }
                  }}
                  className="p-2 rounded-2xl border-2 border-cyan-400 bg-cyan-950/90 text-cyan-200 font-mono font-bold text-xs shadow-2xl hover:scale-105 transition cursor-pointer flex items-center space-x-1.5 active:scale-95"
                >
                  <span>🛋️</span>
                  <span>Шкаф снабжения и стартовая база</span>
                </button>
              </div>
            )}

            {/* Bottom Title Bar Overlay */}
            <div className="absolute bottom-3 left-4 right-4 z-20 flex items-end justify-between pointer-events-none">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                  ЭТАЖ {floorNumber}
                </span>
                <h2 className="text-base sm:text-xl font-black text-white font-mono leading-tight mt-0.5">
                  {room.name}
                </h2>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-black/80 px-3 py-1 rounded-xl border border-cyan-500/50">
                {room.subtitle}
              </span>
            </div>
          </div>

          {/* Minimalist Audio-First Briefing Card */}
          <div className="p-3 rounded-2xl bg-[#0f1722] border border-[#203144] flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-400/60 text-cyan-300">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Доклад обстановки этажа:
                </div>
                <p className="text-xs text-gray-200 font-mono mt-0.5">
                  {room.quickAlert || room.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleVoice}
              className="px-3 py-1.5 rounded-xl bg-[#172535] hover:bg-cyan-600 border border-[#2a4057] text-gray-200 hover:text-white font-mono text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 group-hover:text-white" />
              <span>{isSpeaking ? 'Стоп' : 'Повторить'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Clean Object Dossier (NO RECIPE CHEAT SPOILERS) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-3">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0e1620] border border-[#1f3042] flex-1 flex flex-col">
            <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-black mb-3 flex items-center space-x-2">
              <Layers className="w-4 h-4" />
              <span>Объекты для взаимодействия:</span>
            </div>

            {room.interactables.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400 font-mono text-xs">
                <p>На этом этаже нет отдельных технических механизмов.</p>
                <p className="mt-2 text-cyan-300">Используйте обыск стопки этажа на физическом столе.</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto">
                {room.interactables.map((obj) => (
                  <div
                    key={obj.id}
                    className="p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between space-y-2.5 shadow-md bg-[#14202c] border-[#25394d] hover:border-amber-400/80"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold text-white leading-snug">
                          {obj.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-600">
                          FL {obj.floor}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-300 line-clamp-3 leading-relaxed font-sans">
                        {obj.whatIsHappening || obj.description}
                      </p>

                      {obj.deadlineRoundsText && (
                        <div className="mt-2 text-[10px] font-mono text-red-400 font-bold flex items-center space-x-1 bg-red-950/60 border border-red-800/80 rounded-lg px-2 py-1">
                          <Clock className="w-3 h-3 text-red-400 shrink-0" />
                          <span>{obj.deadlineRoundsText}</span>
                        </div>
                      )}
                    </div>

                    {/* Clean Action Button: opens dedicated secret referee card */}
                    <button
                      data-testid={`inspect-object-${obj.id}-btn`}
                      onClick={() => {
                        sound.playClick();
                        narrator.stop();
                        onOpenObject(obj);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer shadow bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white active:scale-95 mt-1"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Применить карты с руки / QR →</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CCTV SIMULATED VIDEO MODAL */}
      {isCCTVModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="bg-[#0b1016] border-2 border-cyan-500/80 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <div className="flex items-center space-x-2 text-cyan-300 font-mono text-sm font-bold">
                <Video className="w-4 h-4 animate-pulse text-red-500" />
                <span>ВИДЕОЗАПИСЬ С КАМЕРЫ • ЭТАЖ {floorNumber} [1080p 60FPS]</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCCTVModalOpen(false)}
                className="text-gray-400 hover:text-white font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-700 cursor-pointer"
              >
                ✕ Закрыть
              </button>
            </div>

            <div className="relative aspect-video rounded-2xl bg-black border-2 border-gray-800 overflow-hidden flex flex-col items-center justify-center p-6 shadow-inner">
              <img
                src={getRoomIllustration()}
                alt={room.name}
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,255,200,0.06)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>

              <div className="absolute top-3 left-4 font-mono text-xs text-red-500 font-bold flex items-center space-x-1.5 bg-black/80 px-2 py-0.5 rounded">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>REC // SECURITY_FEED_FL{floorNumber}</span>
              </div>
              <div className="absolute bottom-3 right-4 font-mono text-xs text-cyan-400 bg-black/80 px-2 py-0.5 rounded">
                {room.name}
              </div>

              <div className="text-center space-y-3 z-10 max-w-md bg-black/80 p-4 rounded-2xl border border-gray-800">
                <div className="text-3xl animate-pulse">
                  {floorNumber === 11 ? '💧' : floorNumber === 15 ? '🚁' : floorNumber === 14 ? '💉' : '📁'}
                </div>
                <div className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  {room.quickAlert || room.name}
                </div>
                <p className="text-xs font-mono text-gray-300">
                  {room.visualClue}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-[11px] font-mono text-gray-500">
                Оперативная обстановка этажа без перемещения персонажей.
              </span>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  handleToggleVoice();
                }}
                className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isSpeaking ? 'Остановить аудио' : 'Слушать аудио-доклад'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
