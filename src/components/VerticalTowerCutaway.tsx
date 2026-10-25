import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Room,
  GameState,
  InteractionRecipe,
  CardItem,
  InteractableObject
} from '../types/game';
import {
  Clock,
  Zap,
  ZapOff,
  Volume2,
  VolumeX,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Wrench,
  Camera,
  Trash2,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
  BookOpen
} from 'lucide-react';
import { sound } from '../utils/audio';
import { narrator } from '../utils/narrator';
import {
  evaluateInteraction,
  applyInteraction,
  parseCardCode,
  getCardByCode,
  PreFlightCheckResult
} from '../utils/interactionEngine';
import { OFFICIAL_ITEMS, OFFICIAL_DATA_CARDS } from '../data/officialScenario';

interface VerticalTowerCutawayProps {
  rooms: Room[];
  activeFloorNum: number;
  currentHour: number;
  maxHours: number;
  power: boolean;
  leakStatus: string;
  leakDeadlineRound: number;
  roofHatchOpen: boolean;
  rescueSignal: string;
  irinaStatus: string;
  doorReinforced: boolean;
  hasUndo: boolean;
  gameState: GameState;
  onUndo: () => void;
  onTogglePower: () => void;
  onSelectActiveFloor: (floorNumber: number) => void;
  onOpenEndOfRound: () => void;
  onOpenReference: (tab: 'characters' | 'catalog' | 'goals' | 'traumas' | 'rules') => void;
  onOpenLogs?: () => void;
  onResetGame?: () => void;
  onPerformEvacuation: () => void;
  onApplyRecipe: (recipe: InteractionRecipe, calculatedNoise: number, isHeavyTech?: boolean) => void;
}

interface HotspotDefinition {
  id: string;
  name: string;
  floor: number;
  topPercent: number;
  leftPercent: number;
  isActionable: boolean;
  statusText: (props: VerticalTowerCutawayProps) => string;
  statusColor: (props: VerticalTowerCutawayProps) => 'emerald' | 'amber' | 'red' | 'cyan';
}

const HOTSPOTS: HotspotDefinition[] = [
  // Floor 11: Cooling Pipeline
  {
    id: 'obj_cooling_pipeline',
    name: 'ОХЛАЖДАЮЩАЯ МАГИСТРАЛЬ',
    floor: 11,
    topPercent: 36,
    leftPercent: 47,
    isActionable: true,
    statusText: (p) =>
      p.leakStatus === 'repaired'
        ? '✓ РЕМОНТ ЗАВЕРШЕН'
        : p.leakStatus === 'temporary_patch'
        ? 'ЗАПЛАТА (ДО РАУНДА ' + p.leakDeadlineRound + ')'
        : `КРИТИЧЕСКИЙ СВИЩ (ДО РАУНДА ${p.leakDeadlineRound})`,
    statusColor: (p) =>
      p.leakStatus === 'repaired'
        ? 'emerald'
        : p.leakStatus === 'temporary_patch'
        ? 'amber'
        : 'red'
  },
  // Floor 14: Dispatcher Irina
  {
    id: 'obj_irina',
    name: 'ДИСПЕТЧЕР ИРИНА',
    floor: 14,
    topPercent: 54,
    leftPercent: 34,
    isActionable: true,
    statusText: (p) =>
      p.irinaStatus === 'prepared'
        ? '✓ ГОТОВА К ЭВАКУАЦИИ'
        : p.irinaStatus === 'lost'
        ? '✝ ПОГИБЛА'
        : 'РАНЕНА (ПОМОЩЬ ДО РАУНДА 5)',
    statusColor: (p) =>
      p.irinaStatus === 'prepared'
        ? 'emerald'
        : p.irinaStatus === 'lost'
        ? 'red'
        : 'amber'
  },
  // Floor 14: Quarantined Wing Door
  {
    id: 'obj_wing_door',
    name: 'ГЕРМОДВЕРЬ КРЫЛА',
    floor: 14,
    topPercent: 48,
    leftPercent: 88,
    isActionable: true,
    statusText: (p) =>
      p.doorReinforced ? '✓ УКРЕПЛЕНА' : 'УГРОЗА ПРОРЫВА (РАУНД 4)',
    statusColor: (p) => (p.doorReinforced ? 'emerald' : 'amber')
  },
  // Floor 15: Roof Hatch
  {
    id: 'obj_roof_hatch',
    name: 'ЛЮК НА КРЫШУ',
    floor: 15,
    topPercent: 24,
    leftPercent: 72,
    isActionable: true,
    statusText: (p) => (p.roofHatchOpen ? '✓ ОТКРЫТ' : 'ЗАКЛИНЕН'),
    statusColor: (p) => (p.roofHatchOpen ? 'emerald' : 'amber')
  },
  // Floor 15: Military Radio Station
  {
    id: 'obj_radio_station',
    name: 'РАДИОСТАНЦИЯ',
    floor: 15,
    topPercent: 64,
    leftPercent: 42,
    isActionable: true,
    statusText: (p) =>
      p.rescueSignal === 'radio'
        ? '✓ ВЫЗОВ ПРИНЯТ'
        : 'ОЖИДАНИЕ СИГНАЛА (С РАУНДА 6)',
    statusColor: (p) => (p.rescueSignal === 'radio' ? 'emerald' : 'cyan')
  },
  // Floor 15: Backup Siren Console
  {
    id: 'obj_siren_reserve',
    name: 'РЕЗЕРВНЫЙ ПУЛЬТ СИРЕН',
    floor: 15,
    topPercent: 50,
    leftPercent: 55,
    isActionable: true,
    statusText: (p) => (p.gameState.reservePower ? '✓ ПОДКЛЮЧЕН' : 'ОБЕСТОЧЕН'),
    statusColor: (p) => (p.gameState.reservePower ? 'emerald' : 'cyan')
  },
  // Floor 10: Diesel Generator Relay
  {
    id: 'obj_generator_relay',
    name: 'ЗАЩИТНОЕ РЕЛЕ 220V',
    floor: 10,
    topPercent: 50,
    leftPercent: 80,
    isActionable: true,
    statusText: (p) => (p.power ? '✓ НОРМА 220V' : 'ВЫБИТО (ОБЕСТОЧЕНО)'),
    statusColor: (p) => (p.power ? 'emerald' : 'red')
  },
  // Floor 12: Archive Document Shelves (Tabletop search info)
  {
    id: 'obj_archive_shelves',
    name: 'СТЕЛЛАЖИ АРХИВА',
    floor: 12,
    topPercent: 54,
    leftPercent: 50,
    isActionable: false,
    statusText: () => 'ОБЫСК НА СТОЛЕ',
    statusColor: () => 'cyan'
  },
  // Floor 13: Lounge Base (Tabletop search info)
  {
    id: 'obj_lounge_base',
    name: 'БАЗА ВЫЖИВШИХ',
    floor: 13,
    topPercent: 54,
    leftPercent: 50,
    isActionable: false,
    statusText: () => 'СТАРТОВАЯ ТОЧКА (ОБЫСК НА СТОЛЕ)',
    statusColor: () => 'cyan'
  }
];

export const VerticalTowerCutaway: React.FC<VerticalTowerCutawayProps> = (props) => {
  const {
    rooms,
    activeFloorNum,
    currentHour,
    maxHours,
    power,
    leakStatus,
    leakDeadlineRound,
    roofHatchOpen,
    rescueSignal,
    irinaStatus,
    doorReinforced,
    hasUndo,
    gameState,
    onUndo,
    onSelectActiveFloor,
    onOpenEndOfRound,
    onOpenReference,
    onOpenLogs,
    onResetGame,
    onPerformEvacuation,
    onApplyRecipe
  } = props;

  // Active room data
  const currentRoom = rooms.find((r) => r.floorNumber === activeFloorNum) || rooms[0];

  // Selected hotspot target for Action Drawer: null by default (room view is clean)
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);

  // Voice narration state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Action Drawer State
  const [scannedCards, setScannedCards] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [showModifiers, setShowModifiers] = useState(false);

  // 3 Tabletop Modifier Toggles
  const [isWorkingUnderThreat, setIsWorkingUnderThreat] = useState(false);
  const [isHeavyTech, setIsHeavyTech] = useState(false);
  const [isCautionOverload, setIsCautionOverload] = useState(false);

  // Verification & Execution Stages:
  // stage 1: validationAttempted = false, evaluationResult = null
  // stage 2: validationAttempted = true, evaluationResult != null (Сочетание подходит)
  // stage 3: actionCompletedResult != null (Действие выполнено)
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<PreFlightCheckResult | null>(null);
  const [actionCompletedResult, setActionCompletedResult] = useState<{
    recipe: InteractionRecipe;
    consumedText: string;
    actionCost: number;
    tabletopInstruction: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Selected interactable object from current floor (STRICT: no fallback!)
  const selectedObject: InteractableObject | null = selectedHotspotId
    ? currentRoom.interactables.find((i) => i.id === selectedHotspotId) || null
    : null;

  // Reset drawer and draft state when switching floors
  useEffect(() => {
    setSelectedHotspotId(null);
    setScannedCards([]);
    setManualInput('');
    setShowCamera(false);
    setValidationAttempted(false);
    setEvaluationResult(null);
    setActionCompletedResult(null);
  }, [activeFloorNum]);

  // Audio voice narrator toggle
  const handleToggleVoice = () => {
    sound.playClick();
    if (isSpeaking) {
      narrator.stop();
      setIsSpeaking(false);
    } else {
      const textToSpeak =
        currentRoom.audioBriefingText ||
        `${activeFloorNum}-й этаж. ${currentRoom.name}. ${currentRoom.quickAlert || currentRoom.description}`;
      setIsSpeaking(true);
      narrator.speak(textToSpeak);
    }
  };

  const addCardCode = (rawCode: string) => {
    const code = parseCardCode(rawCode);
    if (!code) {
      sound.playError();
      return;
    }

    if (scannedCards.includes(code)) {
      sound.playError();
      return;
    }

    sound.playCardSnap();
    setValidationAttempted(false);
    setEvaluationResult(null);

    // Support up to 2 cards in slots. If 2 cards already present, replace slot 2
    if (scannedCards.length >= 2) {
      setScannedCards([scannedCards[0], code]);
    } else {
      setScannedCards([...scannedCards, code]);
    }
  };

  const handleManualAddCard = () => {
    if (!manualInput.trim()) return;
    addCardCode(manualInput.trim());
    setManualInput('');
  };

  const removeCard = (idx: number) => {
    sound.playClick();
    setValidationAttempted(false);
    setEvaluationResult(null);
    setScannedCards((prev) => prev.filter((_, i) => i !== idx));
  };

  // QR Scanning
  const scanQRCode = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameId.current = requestAnimationFrame(scanQRCode);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animFrameId.current = requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const jsQR = (window as any).jsQR;
    if (typeof jsQR === 'function') {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        const parsed = parseCardCode(code.data);
        if (parsed && !scannedCards.includes(parsed)) {
          addCardCode(parsed);
          setShowCamera(false);
          return;
        }
      }
    }

    animFrameId.current = requestAnimationFrame(scanQRCode);
  }, [scannedCards]);

  useEffect(() => {
    if (!showCamera) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      return;
    }

    let mounted = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            animFrameId.current = requestAnimationFrame(scanQRCode);
          }).catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [showCamera, scanQRCode]);

  // STAGE 1 -> STAGE 2: PRELIMINARY COMBINATION CHECK
  const handleValidateAction = (forcedRecipeId?: any) => {
    const result = evaluateInteraction(scannedCards, activeFloorNum, gameState, {
      targetId: selectedHotspotId,
      isWorkingUnderThreat,
      isCautionOverload,
      isHeavyTech,
      specificRecipeId: forcedRecipeId
    });

    setEvaluationResult(result);
    setValidationAttempted(true);

    if (result.isValid && result.recipe) {
      sound.playSuccess();
    } else {
      sound.playError();
    }
  };

  // STAGE 2 -> STAGE 3: APPLY AND SPEND CARDS ON PHYSICAL TABLE
  const handleConfirmAndApply = () => {
    if (!evaluationResult?.isValid || !evaluationResult.recipe) return;

    const recipe = evaluationResult.recipe;
    const noise = evaluationResult.calculatedNoise;

    sound.playSuccess();
    onApplyRecipe(recipe, noise, isHeavyTech);

    const consumedCardsList = evaluationResult.consumedCards.map((c) => `#${c.code} ${c.name}`);
    const consumedText = consumedCardsList.length > 0
      ? `Уберите в сброс (израсходованные): ${consumedCardsList.join(', ')}`
      : 'Расходные карты не требовались.';

    const tabletopInstruction = `На столе: ${consumedText}. Потратьте ${recipe.actionCost} очко(а) действий активного персонажа.`;

    setActionCompletedResult({
      recipe,
      consumedText,
      actionCost: recipe.actionCost,
      tabletopInstruction
    });
  };

  // Reset drawer state and return to room view
  const handleCloseDrawer = () => {
    sound.playClick();
    setSelectedHotspotId(null);
    setScannedCards([]);
    setManualInput('');
    setShowCamera(false);
    setValidationAttempted(false);
    setEvaluationResult(null);
    setActionCompletedResult(null);
  };

  // Authentic room illustration
  const getRoomIllustration = (): string => {
    switch (activeFloorNum) {
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

  // Evacuation readiness check (Strict: Radio from R6, Light from R7)
  const canEvacuate =
    roofHatchOpen &&
    rescueSignal !== 'none' &&
    ((rescueSignal === 'radio' && currentHour >= 6) ||
      (rescueSignal === 'light' && currentHour >= 7));

  // Hotspots for current floor
  const floorHotspots = HOTSPOTS.filter((h) => h.floor === activeFloorNum);

  return (
    <div className="w-screen h-screen overflow-hidden flex bg-[#07090c] text-[#e6edf3] font-mono select-none">
      
      {/* =========================================================================
          1. LEFT TACTICAL COLUMN (280px)
          Global Systems Status + Vertical Tower Shaft (15 -> 10) + Command Controls
          ========================================================================= */}
      <aside className="w-[280px] shrink-0 h-full bg-[#07090c] border-r border-slate-800/80 flex flex-col justify-between p-3 z-30 select-none overflow-hidden shadow-2xl">
        
        {/* TOP: GLOBAL SYSTEM STATUS BAR */}
        <div className="border-b border-slate-800/80 pb-3 space-y-2.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold tracking-wider">
            <span>ДО РАССВЕТА // ТЕРМИНАЛ</span>
            <span className="text-cyan-400 animate-pulse">● ОНЛАЙН</span>
          </div>

          {/* Large Round Indicator */}
          <div className="p-2.5 bg-[#0d1117] border border-amber-500/40 tactical-chamfer-tr flex items-center justify-between shadow-inner">
            <div>
              <div className="text-sm font-mono font-black text-amber-300 tracking-wider">
                РАУНД {currentHour} ИЗ {maxHours}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                ДО РАССВЕТА: {maxHours - currentHour} РАУНДОВ
              </div>
            </div>
            <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>

          {/* 4 Tactical Status Diodes (Power is strictly an indicator, not a free toggle!) */}
          <div className="space-y-1.5 text-[10px] font-mono">
            {/* 1. Power 220V */}
            <div className="flex items-center justify-between p-1.5 bg-[#0b0f14] border border-slate-800">
              <span className="text-slate-400 flex items-center space-x-1">
                {power ? <Zap className="w-3 h-3 text-emerald-400" /> : <ZapOff className="w-3 h-3 text-red-500" />}
                <span>ПИТАНИЕ 220V:</span>
              </span>
              <span
                className={`px-2 py-0.5 font-bold ${
                  power
                    ? 'text-emerald-400 bg-emerald-950/70 border border-emerald-600'
                    : 'text-red-400 bg-red-950/70 border border-red-600 animate-pulse'
                }`}
              >
                {power ? 'В СЕТИ' : 'ОБЕСТОЧЕНО'}
              </span>
            </div>

            {/* 2. Cooling Pipe */}
            <div className="flex items-center justify-between p-1.5 bg-[#0b0f14] border border-slate-800">
              <span className="text-slate-400">💧 ОХЛАЖДЕНИЕ (FL 11):</span>
              <span
                className={`font-bold ${
                  leakStatus === 'repaired'
                    ? 'text-emerald-400'
                    : leakStatus === 'temporary_patch'
                    ? 'text-amber-400'
                    : 'text-red-400 animate-pulse'
                }`}
              >
                {leakStatus === 'repaired'
                  ? 'НОРМА ✓'
                  : leakStatus === 'temporary_patch'
                  ? 'ЗАПЛАТА'
                  : `СВИЩ (ДО Р.${leakDeadlineRound})`}
              </span>
            </div>

            {/* 3. Rescue Signal */}
            <div className="flex items-center justify-between p-1.5 bg-[#0b0f14] border border-slate-800">
              <span className="text-slate-400">📡 СИГНАЛ БОРТУ:</span>
              <span
                className={`font-bold ${
                  rescueSignal === 'radio'
                    ? 'text-emerald-400'
                    : rescueSignal === 'light'
                    ? 'text-amber-300'
                    : 'text-slate-500'
                }`}
              >
                {rescueSignal === 'radio'
                  ? 'РАДИО (Р.6+) ✓'
                  : rescueSignal === 'light'
                  ? 'СВЕТОВОЙ (Р.7+) ✓'
                  : 'НЕТ СВЯЗИ'}
              </span>
            </div>

            {/* 4. Roof Hatch */}
            <div className="flex items-center justify-between p-1.5 bg-[#0b0f14] border border-slate-800">
              <span className="text-slate-400">🚪 ЛЮК КРЫШИ (FL 15):</span>
              <span className={`font-bold ${roofHatchOpen ? 'text-emerald-400' : 'text-amber-400'}`}>
                {roofHatchOpen ? 'ОТКРЫТ ✓' : 'ЗАКЛИНЕН'}
              </span>
            </div>
          </div>
        </div>

        {/* MIDDLE: VERTICAL TOWER SHAFT (15 DOWN TO 10) */}
        <div className="flex-1 py-2.5 flex flex-col justify-between overflow-hidden relative">
          
          {/* Vertical Technical Elevator Shaft Line */}
          <div
            className={`absolute top-2 bottom-2 left-1.5 w-1 transition-colors duration-500 z-10 ${
              power
                ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                : 'bg-red-800/80 shadow-[0_0_8px_rgba(220,38,38,0.5)]'
            }`}
          ></div>

          {/* 6 Floor Modules */}
          <div className="pl-4 space-y-1.5 flex-1 flex flex-col justify-between z-20">
            {rooms.map((room) => {
              const isSelected = room.floorNumber === activeFloorNum;
              const isCabinHere = gameState.cabinFloor === room.floorNumber;

              return (
                <button
                  key={room.floorNumber}
                  type="button"
                  data-floor-row={room.floorNumber}
                  onClick={() => {
                    sound.playClick();
                    onSelectActiveFloor(room.floorNumber);
                  }}
                  title="Осмотреть помещение этажа (перемещение персонажей выполняется на столе)"
                  className={`w-full p-2 text-left font-mono transition-all flex items-center justify-between border cursor-pointer ${
                    isSelected
                      ? 'bg-[#101b26] border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400'
                      : 'bg-[#0a0e14] hover:bg-[#121820] border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span
                      className={`w-6 h-6 shrink-0 flex items-center justify-center font-black text-xs border ${
                        isSelected
                          ? 'bg-cyan-500 text-black border-cyan-300'
                          : 'bg-black/80 border-slate-700 text-slate-300'
                      }`}
                    >
                      {room.floorNumber}
                    </span>

                    <div className="truncate leading-tight">
                      <div className="text-xs font-bold truncate">
                        {room.name}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {room.floorNumber === 15
                          ? 'Крыша & Радио'
                          : room.floorNumber === 14
                          ? 'Медпункт & Ирина'
                          : room.floorNumber === 13
                          ? 'База выживших'
                          : room.floorNumber === 12
                          ? 'Архив'
                          : room.floorNumber === 11
                          ? 'Охлаждение'
                          : 'Реле генератора'}
                      </div>
                    </div>
                  </div>

                  {/* Floor Status Indicators */}
                  <div className="shrink-0 ml-1.5 flex items-center space-x-1 text-[8px] font-bold">
                    {isCabinHere && (
                      <span className="px-1 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-300">
                        ЛИФТ
                      </span>
                    )}

                    {room.floorNumber === 11 && (
                      <span className={leakStatus === 'repaired' ? 'text-emerald-400' : 'text-red-400 animate-pulse'}>
                        {leakStatus === 'repaired' ? '✓ НОРМА' : '💧 СВИЩ'}
                      </span>
                    )}
                    {room.floorNumber === 14 && (
                      <span className={irinaStatus === 'prepared' ? 'text-emerald-400' : 'text-red-400'}>
                        {irinaStatus === 'prepared' ? '✓ СПАСЕНА' : '💉 ИРИНА'}
                      </span>
                    )}
                    {room.floorNumber === 15 && (
                      <span className={roofHatchOpen ? 'text-emerald-400' : 'text-amber-400'}>
                        {roofHatchOpen ? '✓ ЛЮК' : '🔒 ЛЮК'}
                      </span>
                    )}
                    {room.floorNumber === 10 && (
                      <span className={power ? 'text-emerald-400' : 'text-red-400 animate-pulse'}>
                        {power ? '220V' : '⚡ 0V'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* BOTTOM: TACTICAL COMMAND & UTILITY */}
        <div className="border-t border-slate-800/80 pt-3 space-y-2">
          {/* Evacuation Button */}
          {canEvacuate ? (
            <button
              type="button"
              onClick={onPerformEvacuation}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-black font-black font-mono text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(16,185,129,0.7)] animate-bounce cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>🚁 ЭВАКУАЦИЯ НА КРЫШЕ</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenEndOfRound}
              className="w-full py-2.5 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-black font-mono text-xs uppercase tracking-wider transition shadow-lg cursor-pointer flex items-center justify-center space-x-1.5 active:scale-98"
            >
              <span>⏳ ЗАВЕРШИТЬ РАУНД</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Utility Tools */}
          <div className="grid grid-cols-4 gap-1 pt-1 text-[10px] font-mono font-bold">
            {hasUndo ? (
              <button
                type="button"
                onClick={onUndo}
                title="Отменить последнее действие"
                className="p-1.5 bg-amber-950/80 border border-amber-600 text-amber-300 hover:bg-amber-900 transition flex items-center justify-center cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="p-1.5 bg-black/40 border border-slate-800 text-slate-600 flex items-center justify-center">
                <RotateCcw className="w-3.5 h-3.5" />
              </div>
            )}

            <button
              type="button"
              onClick={() => onOpenReference('rules')}
              title="Справочник правил игры"
              className="p-1.5 bg-[#0f1722] border border-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>

            {onOpenLogs && (
              <button
                type="button"
                onClick={onOpenLogs}
                title="Журнал событий"
                className="p-1.5 bg-[#0f1722] border border-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const next = !sound.getMuted();
                sound.setMuted(next);
              }}
              title="Звук"
              className="p-1.5 bg-[#0f1722] border border-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer"
            >
              {sound.getMuted() ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
          </div>
        </div>

      </aside>

      {/* =========================================================================
          2. RIGHT MAIN CANVAS (FULL BLEED SCENE VIEWPORT)
          ========================================================================= */}
      <main className="flex-1 h-full relative overflow-hidden bg-black flex flex-col justify-between">
        
        {/* ROOM SCENE VIEWPORT */}
        <div className="scene-viewport relative w-full h-full overflow-hidden flex items-center justify-center">
          
          {/* Base Room Illustration */}
          <img
            key={activeFloorNum}
            src={getRoomIllustration()}
            alt={currentRoom.name}
            className={`w-full h-full object-cover select-none transition-all duration-700 ${
              power ? 'brightness-95 contrast-105' : 'brightness-50 contrast-125 saturate-50'
            }`}
          />

          {/* FX LAYER: Dynamic Lighting & Emergency Beacon */}
          {power ? (
            <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none anim-lamp-flicker"></div>
          ) : (
            <div className="absolute inset-0 bg-red-950/25 pointer-events-none anim-emergency-pulse"></div>
          )}

          {/* Subtle Atmospheric Vignette */}
          <div className="vignette-overlay absolute inset-0 pointer-events-none"></div>

          {/* TOP BAR: Room Title, Sensory Description & Room Object Shortcuts */}
          <div className="absolute top-3 left-4 right-4 z-20 flex flex-col md:flex-row md:items-center justify-between gap-2 pointer-events-auto">
            
            {/* Room Title & Sensor Summary */}
            <div className="bg-[#070b10]/90 backdrop-blur-md border border-slate-800 p-2.5 max-w-xl text-left">
              <div className="flex items-center space-x-2">
                <span className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-500 text-cyan-300 text-[10px] font-bold">
                  ЭТАЖ {activeFloorNum}
                </span>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  {currentRoom.name}
                </h2>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {currentRoom.description}
              </p>

              {/* Room Objects clickable chips */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800">
                <span className="text-[10px] text-slate-400">Объекты помещения:</span>
                {floorHotspots.map((h) => {
                  const isSelected = selectedHotspotId === h.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedHotspotId(h.id);
                      }}
                      className={`px-2 py-0.5 text-[10px] font-bold transition flex items-center space-x-1 border cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-900/80 border-cyan-400 text-cyan-200'
                          : 'bg-black/60 hover:bg-[#121c27] border-slate-700 text-slate-300'
                      }`}
                    >
                      <span>{h.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center space-x-2 self-start md:self-auto">
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition flex items-center space-x-1.5 cursor-pointer border ${
                  isSpeaking
                    ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.7)] animate-pulse'
                    : 'bg-[#0d141e]/90 hover:bg-cyan-900 border-slate-700 text-cyan-300'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isSpeaking ? 'ПАУЗА ДОКЛАДА' : '🔊 ОЗВУЧИТЬ ОБСТАНОВКУ'}</span>
              </button>
            </div>
          </div>

          {/* --- DIEGETIC HOTSPOTS OVER OBJECTS IN THE ROOM --- */}
          {floorHotspots.map((hotspot) => {
            const isTargetSelected = selectedHotspotId === hotspot.id;
            const statusColor = hotspot.statusColor(props);
            const statusText = hotspot.statusText(props);

            return (
              <div
                key={hotspot.id}
                style={{ top: `${hotspot.topPercent}%`, left: `${hotspot.leftPercent}%` }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              >
                <div
                  onClick={() => {
                    sound.playClick();
                    setSelectedHotspotId(hotspot.id);
                  }}
                  className={`relative p-2 cursor-pointer transition-all duration-300 group flex items-center space-x-2 ${
                    isTargetSelected ? 'scale-105' : 'hover:scale-102'
                  }`}
                >
                  {/* Corner Reticle Box [   ] */}
                  <div
                    className={`relative w-10 h-10 flex items-center justify-center transition-all ${
                      isTargetSelected
                        ? 'text-cyan-400'
                        : statusColor === 'red'
                        ? 'text-red-500'
                        : statusColor === 'amber'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-current"></span>
                    <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-current"></span>
                    <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-current"></span>
                    <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-current"></span>

                    <span
                      className={`w-2.5 h-2.5 rotate-45 transition-transform ${
                        isTargetSelected
                          ? 'bg-cyan-400 scale-125 shadow-[0_0_10px_rgba(34,211,238,0.8)]'
                          : statusColor === 'red'
                          ? 'bg-red-500 animate-ping'
                          : 'bg-amber-400'
                      }`}
                    ></span>
                  </div>

                  {/* Technical Callout Badge */}
                  <div
                    className={`px-2 py-1 text-left font-mono transition-all tactical-chamfer-tr ${
                      isTargetSelected
                        ? 'bg-[#0d1c29]/95 border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] text-white'
                        : 'bg-[#090e15]/90 hover:bg-[#121c27] border border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="text-[10px] font-black tracking-wider">
                      {hotspot.name}
                    </div>
                    <div
                      className={`text-[9px] font-bold ${
                        statusColor === 'emerald'
                          ? 'text-emerald-400'
                          : statusColor === 'red'
                          ? 'text-red-400 animate-pulse'
                          : 'text-amber-400'
                      }`}
                    >
                      {statusText}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* =====================================================================
              4. ACTION DRAWER (SEMI-TRANSPARENT INTERACTION CONSOLE)
              Opened ONLY when player clicks an object; closeable!
              ===================================================================== */}
          {selectedObject && (
            <div className="action-drawer absolute bottom-0 left-0 right-0 z-30 bg-[#070b10]/95 backdrop-blur-md border-t-2 border-cyan-500/80 shadow-[0_-15px_40px_rgba(0,0,0,0.8)] p-3 sm:p-4 text-xs font-mono transition-all">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 max-w-[1700px] mx-auto">
                
                {/* A. LEFT: NODE INFORMATION (~280px) */}
                <div className="lg:col-span-3 border-r border-slate-800 pr-3 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                        ОСМОТР ОБЪЕКТА:
                      </span>
                      <button
                        type="button"
                        onClick={handleCloseDrawer}
                        className="text-slate-400 hover:text-white text-[11px] cursor-pointer font-bold"
                      >
                        [✕ ЗАКРЫТЬ]
                      </button>
                    </div>

                    <h3 className="text-sm font-black text-white uppercase tracking-wide">
                      {selectedObject.name}
                    </h3>

                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      {selectedObject.whatIsHappening || selectedObject.description}
                    </p>

                    {selectedObject.deadlineRoundsText && (
                      <div className="mt-2 text-[10px] text-red-400 font-bold flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{selectedObject.deadlineRoundsText}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        narrator.speak(`${selectedObject.name}. ${selectedObject.whatIsHappening || selectedObject.description}`);
                      }}
                      className="py-1 px-2.5 bg-[#121c27] hover:bg-cyan-900 border border-slate-700 text-cyan-300 text-[10px] font-bold uppercase transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>ОЗВУЧИТЬ</span>
                    </button>
                  </div>
                </div>

                {/* B. CENTER: CARD SLOTS, INPUT, AND MODIFIERS */}
                <div className="lg:col-span-5 space-y-2.5">
                  
                  {/* STAGE 3: ACTION COMPLETED VIEW */}
                  {actionCompletedResult ? (
                    <div className="p-3 bg-emerald-950/70 border border-emerald-500 rounded text-emerald-200 space-y-2">
                      <div className="font-black text-sm flex items-center space-x-1.5 text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>✓ ДЕЙСТВИЕ ВЫПОЛНЕНО</span>
                      </div>
                      <p className="text-xs text-white leading-relaxed">
                        {actionCompletedResult.recipe.resultText}
                      </p>
                      
                      {/* Physical Table Instructions */}
                      <div className="p-2.5 bg-black/70 border border-emerald-600/70 rounded text-[11px] text-emerald-300 font-mono space-y-1">
                        <div className="font-bold uppercase tracking-wider text-amber-300">
                          🎲 ИНСТРУКЦИЯ ДЛЯ СТОЛА:
                        </div>
                        <div>• {actionCompletedResult.consumedText}</div>
                        <div>• Потратьте {actionCompletedResult.actionCost} очко(а) действий активного персонажа.</div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleCloseDrawer}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
                        >
                          ← Вернуться к осмотру комнаты
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* STAGE 1 & 2: CARD SLOTS AND INPUTS */
                    <>
                      {/* The 2 Slots */}
                      <div className="grid grid-cols-2 gap-2">
                        {[0, 1].map((slotIdx) => {
                          const code = scannedCards[slotIdx];
                          const card = code ? getCardByCode(code) : undefined;

                          return (
                            <div
                              key={slotIdx}
                              className={`p-2 border transition-all flex items-center justify-between h-14 ${
                                card
                                  ? 'bg-[#0f1d2a] border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)] text-white'
                                  : 'bg-[#080d13] border-dashed border-slate-700 text-slate-500'
                              }`}
                            >
                              {card ? (
                                <div className="truncate flex-1 pr-1">
                                  <div className="text-[9px] font-black text-amber-300">
                                    СЛОТ {slotIdx + 1} • #{card.code}
                                  </div>
                                  <div className="text-xs font-bold text-white truncate">
                                    {card.name}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-500 font-bold truncate">
                                  {slotIdx === 0 ? '[ СЛОТ 1 КАРТЫ ]' : '[ СЛОТ 2 (если нужен) ]'}
                                </div>
                              )}

                              {card && (
                                <button
                                  type="button"
                                  onClick={() => removeCard(slotIdx)}
                                  className="p-1 text-slate-400 hover:text-red-400 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Fast Code Input & QR Scanner */}
                      <div className="flex items-center space-x-2">
                        <input
                          data-testid="card-code-input"
                          type="text"
                          maxLength={4}
                          placeholder="Номер карты (напр. 103)"
                          value={manualInput}
                          onChange={(e) => setManualInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleManualAddCard();
                          }}
                          className="flex-1 bg-black border border-slate-700 px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                        />
                        <button
                          data-testid="submit-card-code-btn"
                          type="button"
                          onClick={handleManualAddCard}
                          className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs cursor-pointer"
                        >
                          Добавить карту
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCamera(!showCamera)}
                          title="Сканировать QR камерой"
                          className={`p-1.5 border text-xs cursor-pointer ${
                            showCamera
                              ? 'bg-red-950 border-red-500 text-red-300'
                              : 'bg-[#14202c] border-slate-700 text-cyan-300'
                          }`}
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>

                      {/* QR Camera Preview Overlay */}
                      {showCamera && (
                        <div className="relative aspect-video max-h-32 rounded bg-black border border-cyan-500 overflow-hidden flex items-center justify-center">
                          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                          <canvas ref={canvasRef} className="hidden" />
                          <div className="absolute inset-0 border border-dashed border-cyan-400 pointer-events-none flex items-center justify-center">
                            <span className="text-[9px] bg-black/80 px-2 py-0.5 text-cyan-300">
                              Наведите камеру на QR-код карты
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Special Action: Manual Roof Hatch Override (H5 without QR cards) */}
                      {selectedObject.id === 'obj_roof_hatch' && !roofHatchOpen && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleValidateAction('H5')}
                            className="w-full py-1.5 px-2 bg-amber-950/60 hover:bg-amber-900 border border-amber-600 text-amber-300 text-[10px] font-bold uppercase transition flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <span>⚡ Использовать ручной аварийный привод (без карт • 2 действия)</span>
                          </button>
                        </div>
                      )}

                      {/* Modifiers Toggle */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowModifiers(!showModifiers)}
                          className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
                        >
                          <span>⚙️ Усилить действие / Модификаторы</span>
                          {showModifiers ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {showModifiers && (
                          <div className="flex flex-wrap items-center gap-2 text-[10px] mt-1.5 p-2 bg-black/60 border border-slate-800">
                            <label className="flex items-center space-x-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isWorkingUnderThreat}
                                onChange={(e) => {
                                  setValidationAttempted(false);
                                  setIsWorkingUnderThreat(e.target.checked);
                                }}
                                className="rounded bg-black border-slate-700 text-red-500"
                              />
                              <span className="text-red-300">⚠️ Под угрозой (+1 шум)</span>
                            </label>

                            <label className="flex items-center space-x-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isHeavyTech}
                                onChange={(e) => {
                                  setValidationAttempted(false);
                                  setIsHeavyTech(e.target.checked);
                                }}
                                className="rounded bg-black border-slate-700 text-amber-400"
                              />
                              <span className="text-amber-300">🔧 Усиленная техника (сохранить инструмент)</span>
                            </label>

                            <label className="flex items-center space-x-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isCautionOverload}
                                onChange={(e) => {
                                  setValidationAttempted(false);
                                  setIsCautionOverload(e.target.checked);
                                }}
                                className="rounded bg-black border-slate-700 text-cyan-400"
                              />
                              <span className="text-cyan-300">🤫 Осторожность (-2 шума)</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* C. RIGHT: SYSTEM ESTIMATE & ACTIONS (~320px) */}
                <div className="lg:col-span-4 border-l border-slate-800 pl-3 flex flex-col justify-between space-y-2">
                  
                  {/* STAGE 1: BEFORE VALIDATION */}
                  {!validationAttempted && !actionCompletedResult && (
                    <div className="p-2.5 bg-black/60 border border-slate-800 text-[10px] space-y-1.5">
                      <div className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">
                        ПРЕДВАРИТЕЛЬНАЯ ПРОВЕРКА:
                      </div>
                      <div className="text-slate-300">
                        Предъявите 1 или 2 физические карты со стола и нажмите «Проверить сочетание».
                      </div>
                      <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
                        Ошибочный ввод ничего не тратит на столе и не запускает действие с другим объектом.
                      </div>
                    </div>
                  )}

                  {/* STAGE 2: VERIFICATION OUTCOME */}
                  {validationAttempted && !actionCompletedResult && (
                    <div
                      className={`p-2.5 border text-[10px] space-y-1.5 ${
                        evaluationResult?.isValid
                          ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                          : 'bg-red-950/70 border-red-500 text-red-200'
                      }`}
                    >
                      <div className="font-bold flex items-center space-x-1">
                        {evaluationResult?.isValid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>✓ СОЧЕТАНИЕ ПОДХОДИТ</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                            <span>❌ НЕ ПОДХОДИТ ДЛЯ ЭТОГО ОБЪЕКТА</span>
                          </>
                        )}
                      </div>

                      {evaluationResult?.isValid && evaluationResult.futureCostSummary ? (
                        <div className="space-y-1 text-[9px] border-t border-emerald-800/80 pt-1 text-slate-200">
                          <div>⏱️ <b>Действие:</b> {evaluationResult.futureCostSummary.actionText}</div>
                          <div>📦 <b>Расход:</b> {evaluationResult.futureCostSummary.materialsText}</div>
                          <div>🔧 <b>Инструмент:</b> {evaluationResult.futureCostSummary.durabilityText}</div>
                          <div>🎲 <b>Навыки / поддержка:</b> {evaluationResult.futureCostSummary.skillsAndSupportText}</div>
                          <div>🔊 <b>Шум:</b> {evaluationResult.futureCostSummary.noiseText}</div>
                          <div className="text-emerald-300 pt-1 font-sans leading-normal">
                            <b>Эффект:</b> {evaluationResult.futureCostSummary.consequencesPreviewText}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-red-200 leading-relaxed">
                          {evaluationResult?.errorMessage || 'Эти карты не могут быть применены к выбранному объекту.'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* ACTION BUTTONS ACCORDING TO STAGE */}
                  <div>
                    {!actionCompletedResult && (
                      <>
                        {!validationAttempted ? (
                          <button
                            data-testid="referee-validate-cards-btn"
                            type="button"
                            disabled={scannedCards.length === 0}
                            onClick={() => handleValidateAction()}
                            className={`w-full py-2.5 font-mono text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-1 cursor-pointer tactical-chamfer-tr ${
                              scannedCards.length > 0
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)] active:scale-98'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            }`}
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>ПРОВЕРИТЬ СОЧЕТАНИЕ ➔</span>
                          </button>
                        ) : evaluationResult?.isValid ? (
                          <div className="space-y-1.5">
                            <button
                              data-testid="confirm-apply-recipe-btn"
                              type="button"
                              onClick={handleConfirmAndApply}
                              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-black font-mono text-xs font-black uppercase tracking-wider transition shadow-[0_0_20px_rgba(16,185,129,0.7)] cursor-pointer active:scale-98"
                            >
                              <span>ПРИМЕНИТЬ И ПОТРАТИТЬ КАРТЫ ✓</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setValidationAttempted(false)}
                              className="w-full py-1 text-slate-400 hover:text-white text-[10px] cursor-pointer"
                            >
                              ← Изменить карты
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setValidationAttempted(false)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold uppercase transition cursor-pointer"
                          >
                            ← ВЫБРАТЬ ДРУГИЕ КАРТЫ
                          </button>
                        )}
                      </>
                    )}
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

      </main>

    </div>
  );
};
