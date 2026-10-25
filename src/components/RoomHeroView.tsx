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
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Settings,
  Menu,
  Eye,
  EyeOff,
  Compass,
  Building
} from 'lucide-react';
import { sound } from '../utils/audio';
import { narrator } from '../utils/narrator';
import {
  evaluateInteraction,
  parseCardCode,
  getCardByCode,
  PreFlightCheckResult
} from '../utils/interactionEngine';
import { OFFICIAL_ITEMS, OFFICIAL_DATA_CARDS } from '../data/officialScenario';

interface RoomHeroViewProps {
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

export const RoomHeroView: React.FC<RoomHeroViewProps> = (props) => {
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

  // Navigation & Modals state
  const [isElevatorOpen, setIsElevatorOpen] = useState(false);
  const [isStairsOpen, setIsStairsOpen] = useState(false);
  const [isBuildingOpen, setIsBuildingOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRoundEndPromptOpen, setIsRoundEndPromptOpen] = useState(false);
  const [showAllObjectLabels, setShowAllObjectLabels] = useState(false);
  const [quickTransitions, setQuickTransitions] = useState(false);
  const [isElevatorTraveling, setIsElevatorTraveling] = useState(false);
  const [travelingFloorTarget, setTravelingFloorTarget] = useState<number | null>(null);

  // Selected object for Right-Side Lateral Inspection Drawer
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isApplyingCards, setIsApplyingCards] = useState<boolean>(false);

  // Card input inside drawer
  const [scannedCards, setScannedCards] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [useHeavyTech, setUseHeavyTech] = useState(false);

  // Verification & Execution stages
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<PreFlightCheckResult | null>(null);
  const [actionCompletedResult, setActionCompletedResult] = useState<{
    recipe: InteractionRecipe;
    consumedText: string;
    actionCost: number;
    tabletopInstruction: string;
  } | null>(null);

  // Audio voice narration
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Reset drawer state when switching floors
  useEffect(() => {
    setSelectedObjectId(null);
    setIsApplyingCards(false);
    setScannedCards([]);
    setManualInput('');
    setShowCamera(false);
    setValidationAttempted(false);
    setEvaluationResult(null);
    setActionCompletedResult(null);
  }, [activeFloorNum]);

  // Selected interactable object from current floor
  const selectedObject: InteractableObject | null = selectedObjectId
    ? currentRoom.interactables.find((i) => i.id === selectedObjectId) || null
    : null;

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

  // Sound narrator toggle
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

  // Close inspection drawer
  const handleCloseDrawer = () => {
    sound.playClick();
    setSelectedObjectId(null);
    setIsApplyingCards(false);
    setScannedCards([]);
    setManualInput('');
    setShowCamera(false);
    setValidationAttempted(false);
    setEvaluationResult(null);
    setActionCompletedResult(null);
  };

  // Card slot management
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

  // Handle verification check
  const handleValidateAction = (forcedRecipeId?: any) => {
    const result = evaluateInteraction(scannedCards, activeFloorNum, gameState, {
      targetId: selectedObjectId,
      isHeavyTech: useHeavyTech,
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

  // Handle final application of action
  const handleConfirmAndApply = () => {
    if (!evaluationResult?.isValid || !evaluationResult.recipe) return;

    const recipe = evaluationResult.recipe;
    const noise = evaluationResult.calculatedNoise;

    sound.playSuccess();
    onApplyRecipe(recipe, noise, useHeavyTech);

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

  // Transition to another floor via elevator
  const handleTravelElevator = (destFloor: number) => {
    if (destFloor === activeFloorNum) {
      setIsElevatorOpen(false);
      return;
    }

    sound.playElevatorDing();
    setIsElevatorOpen(false);

    if (quickTransitions) {
      onSelectActiveFloor(destFloor);
      return;
    }

    setIsElevatorTraveling(true);
    setTravelingFloorTarget(destFloor);
    setTimeout(() => {
      onSelectActiveFloor(destFloor);
      setIsElevatorTraveling(false);
      setTravelingFloorTarget(null);
    }, 1200);
  };

  // Transition to adjacent floor via stairs
  const handleTravelStairs = (destFloor: number) => {
    sound.playClick();
    setIsStairsOpen(false);
    onSelectActiveFloor(destFloor);
  };

  // Evacuation check
  const canEvacuate =
    roofHatchOpen &&
    rescueSignal !== 'none' &&
    ((rescueSignal === 'radio' && currentHour >= 6) ||
      (rescueSignal === 'light' && currentHour >= 7));

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#07090c] text-[#e6edf3] font-sans select-none flex flex-col relative">
      
      {/* =========================================================================
          1. THIN TOP BAR (Clean, readable from distance, 48-52px)
          ========================================================================= */}
      <header className="h-12 shrink-0 bg-[#0a0e14] border-b border-slate-800/80 px-4 flex items-center justify-between z-30 shadow-md">
        
        {/* Left: Floor & Name */}
        <div className="flex items-center space-x-3">
          <div className="text-base sm:text-lg font-black text-white tracking-wide flex items-center space-x-2">
            <span className="text-cyan-400 font-mono">{activeFloorNum}</span>
            <span className="text-slate-500">·</span>
            <span className="uppercase">{currentRoom.name}</span>
          </div>

          {!power && (
            <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-600 text-red-300 text-xs font-mono font-bold animate-pulse flex items-center space-x-1">
              <ZapOff className="w-3 h-3" />
              <span>Обесточено</span>
            </span>
          )}
        </div>

        {/* Center: Round & End of Round Button */}
        <div className="flex items-center space-x-3">
          <div className="px-3 py-1 rounded bg-[#111720] border border-slate-800 text-slate-300 text-xs sm:text-sm font-mono font-bold">
            Раунд {currentHour} из {maxHours}
          </div>

          <button
            data-testid="topbar-endround-btn"
            type="button"
            onClick={onOpenEndOfRound}
            className="px-3.5 py-1.5 rounded-lg bg-[#1a2533] hover:bg-[#25364a] border border-slate-700 text-slate-200 text-xs font-bold uppercase transition flex items-center space-x-1.5 cursor-pointer shadow"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Завершить раунд</span>
          </button>
        </div>

        {/* Right: Main Navigation Actions */}
        <div className="flex items-center space-x-2">
          {/* Toggle All Object Labels */}
          <button
            data-testid="topbar-objects-toggle-btn"
            type="button"
            onClick={() => setShowAllObjectLabels(!showAllObjectLabels)}
            title="Показать / скрыть подписи объектов"
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              showAllObjectLabels
                ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                : 'bg-[#121820] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {showAllObjectLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">Объекты</span>
          </button>

          {/* Building Overview */}
          <button
            data-testid="topbar-building-btn"
            type="button"
            onClick={() => setIsBuildingOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#121820] hover:bg-[#1a2533] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span>Здание</span>
          </button>

          {/* Story & Plan */}
          <button
            data-testid="topbar-history-btn"
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#121820] hover:bg-[#1a2533] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>История</span>
          </button>

          {/* Menu & Settings */}
          <button
            data-testid="topbar-menu-btn"
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#121820] hover:bg-[#1a2533] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Меню</span>
          </button>
        </div>

      </header>

      {/* =========================================================================
          2. MAIN BIG ROOM CANVAS (Occupies nearly whole screen!)
          ========================================================================= */}
      <main className="flex-1 w-full h-[calc(100vh-48px)] relative overflow-hidden flex items-center justify-center bg-black">
        
        {/* Room Artwork */}
        <img
          key={activeFloorNum}
          src={getRoomIllustration()}
          alt={currentRoom.name}
          className={`w-full h-full object-cover select-none transition-all duration-700 ${
            power ? 'brightness-100 contrast-105' : 'brightness-50 contrast-125 saturate-50'
          }`}
        />

        {/* Ambient lighting */}
        {power ? (
          <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none anim-lamp-flicker"></div>
        ) : (
          <div className="absolute inset-0 bg-red-950/25 pointer-events-none anim-emergency-pulse"></div>
        )}

        {/* Soft edge vignette */}
        <div className="vignette-overlay absolute inset-0 pointer-events-none"></div>

        {/* --- DIEGETIC ELEMENT 1: ELEVATOR (LEFT SIDE) --- */}
        <div
          data-testid="elevator-area-btn"
          onClick={() => {
            sound.playClick();
            setIsElevatorOpen(true);
          }}
          className="absolute left-0 top-[15%] bottom-[10%] w-[16%] min-w-[120px] max-w-[200px] z-20 cursor-pointer group flex flex-col items-center justify-between p-3 select-none transition-all"
        >
          {/* Top Floor Indicator above Elevator Door */}
          <div
            className={`px-3 py-1 rounded border font-mono font-black text-sm tracking-widest shadow-lg transition-all ${
              power
                ? 'bg-black/80 border-amber-500/80 text-amber-300 shadow-amber-500/20 group-hover:scale-105 group-hover:border-amber-400'
                : 'bg-black/90 border-red-700 text-red-500 animate-pulse'
            }`}
          >
            {power ? `FL ${activeFloorNum}` : 'НЕТ СЕТИ'}
          </div>

          {/* Centered Hover Pill */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-3 py-1.5 rounded-full bg-black/85 border border-amber-400 text-amber-300 font-bold text-xs shadow-xl flex items-center space-x-1.5 backdrop-blur-sm">
            <span>Лифт · выбрать этаж</span>
          </div>

          {/* Subtle outline highlighting the elevator doors */}
          <div className="w-full h-[65%] border-2 border-transparent group-hover:border-amber-500/60 rounded-t-xl transition-all pointer-events-none shadow-inner"></div>
        </div>

        {/* --- DIEGETIC ELEMENT 2: STAIRS (RIGHT SIDE) --- */}
        <div
          data-testid="stairs-area-btn"
          onClick={() => {
            sound.playClick();
            setIsStairsOpen(true);
          }}
          className="absolute right-0 top-[20%] bottom-[10%] w-[14%] min-w-[100px] max-w-[180px] z-20 cursor-pointer group flex flex-col items-center justify-between p-3 select-none transition-all"
        >
          {/* Stairs Sign */}
          <div className="px-3 py-1 rounded border border-slate-700 bg-black/80 text-slate-300 font-bold text-xs tracking-wider group-hover:border-cyan-400 group-hover:text-cyan-300 transition-all shadow-md">
            ЛЕСТНИЦА
          </div>

          {/* Centered Hover Pill */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-3 py-1.5 rounded-full bg-black/85 border border-cyan-400 text-cyan-300 font-bold text-xs shadow-xl flex items-center space-x-1.5 backdrop-blur-sm">
            <span>Лестница · этажи</span>
          </div>

          <div className="w-full h-[65%] border-2 border-transparent group-hover:border-cyan-500/60 rounded-t-xl transition-all pointer-events-none"></div>
        </div>

        {/* --- DIEGETIC ELEMENT 3: INTERACTIVE OBJECTS (NATURAL LARGE HITBOXES) --- */}
        {/* Floor 11: Cooling Pipeline */}
        {activeFloorNum === 11 && (
          <div
            data-testid="object-cooling-pipeline"
            onClick={() => {
              sound.playClick();
              setSelectedObjectId('obj_cooling_pipeline');
            }}
            style={{ top: '26%', left: '38%', width: '22%', height: '36%' }}
            className={`absolute z-20 cursor-pointer group rounded-xl border-2 transition-all p-2 flex flex-col justify-end ${
              selectedObjectId === 'obj_cooling_pipeline'
                ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                : 'border-transparent hover:border-amber-400/80 hover:bg-amber-950/10'
            }`}
          >
            <div className={`px-2.5 py-1 rounded bg-black/85 border text-xs font-bold w-fit shadow-md transition-opacity ${
              showAllObjectLabels ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
            } ${
              leakStatus === 'repaired'
                ? 'border-emerald-600 text-emerald-300'
                : 'border-amber-500 text-amber-300'
            }`}>
              {leakStatus === 'repaired' ? '✓ Магистраль отремонтирована' : '💧 Повреждённая труба'}
            </div>
          </div>
        )}

        {/* Floor 14: Dispatcher Irina */}
        {activeFloorNum === 14 && (
          <div
            onClick={() => {
              sound.playClick();
              setSelectedObjectId('obj_irina');
            }}
            style={{ top: '38%', left: '22%', width: '26%', height: '42%' }}
            className={`absolute z-20 cursor-pointer group rounded-xl border-2 transition-all p-2 flex flex-col justify-end ${
              selectedObjectId === 'obj_irina'
                ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                : 'border-transparent hover:border-amber-400/80 hover:bg-amber-950/10'
            }`}
          >
            <div className={`px-2.5 py-1 rounded bg-black/85 border text-xs font-bold w-fit shadow-md transition-opacity ${
              showAllObjectLabels ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
            } ${
              irinaStatus === 'prepared'
                ? 'border-emerald-600 text-emerald-300'
                : irinaStatus === 'lost'
                ? 'border-red-600 text-red-400'
                : 'border-amber-500 text-amber-300'
            }`}>
              {irinaStatus === 'prepared'
                ? '✓ Ирина спасена'
                : irinaStatus === 'lost'
                ? '✝ Ирина погибла'
                : '💉 Диспетчер Ирина · тяжело ранена'}
            </div>
          </div>
        )}

        {/* Floor 14: Quarantined Wing Door */}
        {activeFloorNum === 14 && (
          <div
            onClick={() => {
              sound.playClick();
              setSelectedObjectId('obj_wing_door');
            }}
            style={{ top: '25%', left: '76%', width: '18%', height: '52%' }}
            className={`absolute z-20 cursor-pointer group rounded-xl border-2 transition-all p-2 flex flex-col justify-end ${
              selectedObjectId === 'obj_wing_door'
                ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                : 'border-transparent hover:border-amber-400/80 hover:bg-amber-950/10'
            }`}
          >
            <div className={`px-2.5 py-1 rounded bg-black/85 border text-xs font-bold w-fit shadow-md transition-opacity ${
              showAllObjectLabels ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
            } ${
              doorReinforced ? 'border-emerald-600 text-emerald-300' : 'border-amber-500 text-amber-300'
            }`}>
              {doorReinforced ? '✓ Дверь укреплена' : '🚪 Гермодверь крыла · угроза'}
            </div>
          </div>
        )}

        {/* Floor 15: Roof Hatch */}
        {activeFloorNum === 15 && (
          <div
            onClick={() => {
              sound.playClick();
              setSelectedObjectId('obj_roof_hatch');
            }}
            style={{ top: '10%', left: '60%', width: '24%', height: '32%' }}
            className={`absolute z-20 cursor-pointer group rounded-xl border-2 transition-all p-2 flex flex-col justify-end ${
              selectedObjectId === 'obj_roof_hatch'
                ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                : 'border-transparent hover:border-amber-400/80 hover:bg-amber-950/10'
            }`}
          >
            <div className={`px-2.5 py-1 rounded bg-black/85 border text-xs font-bold w-fit shadow-md transition-opacity ${
              showAllObjectLabels ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
            } ${
              roofHatchOpen ? 'border-emerald-600 text-emerald-300' : 'border-amber-500 text-amber-300'
            }`}>
              {roofHatchOpen ? '✓ Люк открыт' : '🔒 Люк на вертолётную площадку'}
            </div>
          </div>
        )}

        {/* Floor 15: Military Radio Station */}
        {activeFloorNum === 15 && (
          <div
            onClick={() => {
              sound.playClick();
              setSelectedObjectId('obj_radio_station');
            }}
            style={{ top: '48%', left: '32%', width: '22%', height: '36%' }}
            className={`absolute z-20 cursor-pointer group rounded-xl border-2 transition-all p-2 flex flex-col justify-end ${
              selectedObjectId === 'obj_radio_station'
                ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                : 'border-transparent hover:border-amber-400/80 hover:bg-amber-950/10'
            }`}
          >
            <div className={`px-2.5 py-1 rounded bg-black/85 border text-xs font-bold w-fit shadow-md transition-opacity ${
              showAllObjectLabels ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
            } ${
              rescueSignal === 'radio' ? 'border-emerald-600 text-emerald-300' : 'border-cyan-500 text-cyan-300'
            }`}>
              {rescueSignal === 'radio' ? '✓ Связь установлена' : '📡 Радиостанция связи'}
            </div>
          </div>
        )}

        {/* Floor 10: Diesel Generator Relay */}
        {activeFloorNum === 10 && (
          <div
            onClick={() => {
              sound.playClick();
              setSelectedObjectId('obj_generator_relay');
            }}
            style={{ top: '30%', left: '70%', width: '22%', height: '45%' }}
            className={`absolute z-20 cursor-pointer group rounded-xl border-2 transition-all p-2 flex flex-col justify-end ${
              selectedObjectId === 'obj_generator_relay'
                ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                : 'border-transparent hover:border-amber-400/80 hover:bg-amber-950/10'
            }`}
          >
            <div className={`px-2.5 py-1 rounded bg-black/85 border text-xs font-bold w-fit shadow-md transition-opacity ${
              showAllObjectLabels ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
            } ${
              power ? 'border-emerald-600 text-emerald-300' : 'border-red-600 text-red-300'
            }`}>
              {power ? '✓ Защитное реле 220V в норме' : '⚡ Защитное реле · обесточено'}
            </div>
          </div>
        )}

        {/* Floor 12: Archive Shelves (Tabletop search info) */}
        {activeFloorNum === 12 && (
          <div
            onClick={() => {
              sound.playClick();
              setSelectedObjectId('obj_archive_shelves');
            }}
            style={{ top: '30%', left: '35%', width: '35%', height: '45%' }}
            className={`absolute z-20 cursor-pointer group rounded-xl border-2 transition-all p-2 flex flex-col justify-end ${
              selectedObjectId === 'obj_archive_shelves'
                ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                : 'border-transparent hover:border-cyan-400/80 hover:bg-cyan-950/10'
            }`}
          >
            <div className={`px-2.5 py-1 rounded bg-black/85 border border-cyan-500 text-cyan-300 text-xs font-bold w-fit shadow-md transition-opacity ${
              showAllObjectLabels ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
            }`}>
              📂 Стеллажи архива · Обыск на столе
            </div>
          </div>
        )}

        {/* Floor 13: Lounge Base (Tabletop search info) */}
        {activeFloorNum === 13 && (
          <div
            onClick={() => {
              sound.playClick();
              setSelectedObjectId('obj_lounge_base');
            }}
            style={{ top: '30%', left: '35%', width: '35%', height: '45%' }}
            className={`absolute z-20 cursor-pointer group rounded-xl border-2 transition-all p-2 flex flex-col justify-end ${
              selectedObjectId === 'obj_lounge_base'
                ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                : 'border-transparent hover:border-cyan-400/80 hover:bg-cyan-950/10'
            }`}
          >
            <div className={`px-2.5 py-1 rounded bg-black/85 border border-cyan-500 text-cyan-300 text-xs font-bold w-fit shadow-md transition-opacity ${
              showAllObjectLabels ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
            }`}>
              🛋️ База выживших · Обыск на столе
            </div>
          </div>
        )}

        {/* Evacuation Ready floating action pill on Floor 15 */}
        {activeFloorNum === 15 && canEvacuate && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 animate-bounce">
            <button
              type="button"
              onClick={onPerformEvacuation}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.8)] border border-white flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <span>🚁 ВЫПОЛНИТЬ ЭВАКУАЦИЮ НА КРЫШЕ (ПОБЕДА!)</span>
            </button>
          </div>
        )}

        {/* Elevator Moving Screen Animation Overlay */}
        {isElevatorTraveling && (
          <div className="absolute inset-0 z-40 bg-black/95 flex flex-col items-center justify-center transition-all animate-fadeIn">
            <div className="p-4 rounded-2xl bg-[#0e1622] border border-amber-500/80 text-amber-300 font-mono text-center space-y-2 shadow-2xl">
              <div className="text-xs uppercase tracking-widest text-slate-400">ПЕРЕХОД ЛИФТА</div>
              <div className="text-3xl font-black text-amber-400 animate-pulse">
                ЭТАЖ {travelingFloorTarget}
              </div>
              <div className="text-xs text-slate-400">Двери открываются...</div>
            </div>
          </div>
        )}

      </main>

      {/* =========================================================================
          3. LATERAL RIGHT-SIDE INSPECTION DRAWER (~38% width)
          ========================================================================= */}
      {selectedObject && (
        <aside className="absolute right-0 top-12 bottom-0 w-full sm:w-[480px] lg:w-[520px] bg-[#0c1219]/95 backdrop-blur-xl border-l border-slate-700/80 z-30 shadow-2xl flex flex-col justify-between p-6 overflow-y-auto animate-slideLeft">
          
          <div className="space-y-5">
            {/* Top Close Button & Object Title */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold mb-1">
                  ОСМОТР ОБЪЕКТА
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                  {selectedObject.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleCloseDrawer}
                className="px-3 py-1.5 rounded-lg bg-[#182330] hover:bg-[#253549] text-slate-300 hover:text-white text-xs font-bold uppercase transition flex items-center space-x-1 cursor-pointer"
              >
                <span>← Комната</span>
                <X className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* Sensory Description & Threats */}
            <div className="bg-[#121922] p-4 rounded-xl border border-slate-800 space-y-2">
              <p className="text-sm text-slate-200 leading-relaxed font-sans">
                {selectedObject.whatIsHappening || selectedObject.description}
              </p>

              {selectedObject.deadlineRoundsText && (
                <div className="mt-2 text-xs text-red-400 font-bold flex items-center space-x-1.5 pt-2 border-t border-slate-800/80">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{selectedObject.deadlineRoundsText}</span>
                </div>
              )}
            </div>

            {/* VIEW A: INITIAL VIEW (Before clicking "Применить карты") */}
            {!isApplyingCards && !actionCompletedResult && (
              <div className="space-y-4 pt-2">
                {selectedObject.recipes.length > 0 ? (
                  <button
                    data-testid="open-apply-cards-btn"
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setIsApplyingCards(true);
                    }}
                    className="w-full h-14 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm uppercase tracking-wider transition shadow-lg shadow-amber-950/50 flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                  >
                    <span>Применить карты к объекту ➔</span>
                  </button>
                ) : (
                  <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800 text-cyan-200 text-xs leading-relaxed space-y-1">
                    <div className="font-bold text-amber-300">🎲 ОБЫСК НА СТОЛЕ:</div>
                    <div>{selectedObject.whatIsHappening}</div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    narrator.speak(`${selectedObject.name}. ${selectedObject.whatIsHappening || selectedObject.description}`);
                  }}
                  className="w-full h-12 rounded-xl bg-[#141d27] hover:bg-[#1d2b38] border border-slate-700 text-slate-200 text-xs font-bold uppercase transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>Прослушать описание</span>
                </button>
              </div>
            )}

            {/* VIEW B: APPLYING CARDS WORKFLOW */}
            {isApplyingCards && !actionCompletedResult && (
              <div className="space-y-5 pt-1">
                <div>
                  <h3 className="text-base font-bold text-white mb-2">
                    Что используем для решения?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Введите 3-значный номер карты с физического стола или отсканируйте камерой:
                  </p>
                </div>

                {/* Card input and Camera button */}
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
                    className="flex-1 h-12 bg-black border border-slate-700 px-3.5 text-sm text-white outline-none rounded-lg font-mono focus:border-cyan-400"
                  />
                  <button
                    data-testid="submit-card-code-btn"
                    type="button"
                    onClick={handleManualAddCard}
                    className="h-12 px-4 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs uppercase cursor-pointer"
                  >
                    Добавить
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCamera(!showCamera)}
                    title="Сканировать QR камерой"
                    className={`h-12 px-3.5 rounded-lg border text-xs cursor-pointer flex items-center justify-center ${
                      showCamera
                        ? 'bg-red-950 border-red-500 text-red-300'
                        : 'bg-[#14202c] border-slate-700 text-cyan-300 hover:border-cyan-400'
                    }`}
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                {/* QR Camera Preview */}
                {showCamera && (
                  <div className="relative aspect-video rounded-xl bg-black border border-cyan-500 overflow-hidden flex items-center justify-center">
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 border border-dashed border-cyan-400 pointer-events-none flex items-center justify-center">
                      <span className="text-[10px] bg-black/80 px-2 py-0.5 text-cyan-300">
                        Наведите камеру на QR-код карты
                      </span>
                    </div>
                  </div>
                )}

                {/* Displayed Added Cards */}
                {scannedCards.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                      Выбранные карты:
                    </div>
                    {scannedCards.map((code, idx) => {
                      const card = getCardByCode(code);
                      return (
                        <div
                          key={code}
                          className="p-3 rounded-xl bg-[#141e2a] border border-cyan-500/60 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-bold text-amber-300 mr-2">#{code}</span>
                            <span className="font-bold text-white text-sm">{card?.name || 'Предмет'}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCard(idx)}
                            className="px-2.5 py-1 rounded bg-[#202c3b] hover:bg-red-950 text-slate-300 hover:text-red-300 text-xs font-bold transition cursor-pointer"
                          >
                            Убрать карту
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Direct Manual Action (e.g. H5 Roof Hatch Override without cards) */}
                {selectedObject.id === 'obj_roof_hatch' && !roofHatchOpen && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleValidateAction('H5')}
                      className="w-full py-3 px-3 rounded-xl bg-amber-950/60 hover:bg-amber-900 border border-amber-600 text-amber-300 text-xs font-bold uppercase transition flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <span>⚡ Ручной аварийный привод (без карт • 2 действия)</span>
                    </button>
                  </div>
                )}

                {/* Verification Outcome Box */}
                {validationAttempted && (
                  <div
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      evaluationResult?.isValid
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                        : evaluationResult?.isPartial
                        ? 'bg-amber-950/70 border-amber-500 text-amber-200'
                        : 'bg-red-950/70 border-red-500 text-red-200'
                    }`}
                  >
                    <div className="font-bold flex items-center space-x-1.5 text-sm">
                      {evaluationResult?.isValid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Так можно решить задачу</span>
                        </>
                      ) : evaluationResult?.isPartial ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span>Этого предмета пока недостаточно</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span>Не подходит для этого объекта</span>
                        </>
                      )}
                    </div>

                    {evaluationResult?.isValid && evaluationResult.futureCostSummary ? (
                      <div className="space-y-1.5 pt-2 border-t border-emerald-800/80 text-slate-200">
                        <div>⏱️ <b>Действие:</b> {evaluationResult.futureCostSummary.actionText}</div>
                        <div>📦 <b>Расход:</b> {evaluationResult.futureCostSummary.materialsText}</div>
                        <div>🔧 <b>Инструмент:</b> {evaluationResult.futureCostSummary.durabilityText}</div>
                        <div>🎲 <b>На столе:</b> {evaluationResult.futureCostSummary.skillsAndSupportText}</div>
                        <div className="text-emerald-300 pt-1 font-sans">
                          <b>Результат:</b> {evaluationResult.futureCostSummary.consequencesPreviewText}
                        </div>

                        {/* Large Tabletop Technique Enhancement Options */}
                        <div className="pt-2 border-t border-emerald-800/60 space-y-2">
                          <label className="flex items-center space-x-2.5 p-2 rounded bg-black/60 border border-emerald-700/60 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useHeavyTech}
                              onChange={(e) => setUseHeavyTech(e.target.checked)}
                              className="w-4 h-4 text-amber-500 rounded bg-black"
                            />
                            <span className="text-xs text-amber-200 font-bold">
                              🔧 Усиленная Техника — сохранить инструмент на столе
                            </span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <p className="leading-relaxed">
                        {evaluationResult?.errorMessage}
                      </p>
                    )}
                  </div>
                )}

                {/* Primary Button */}
                {!evaluationResult?.isValid ? (
                  <button
                    data-testid="referee-validate-cards-btn"
                    type="button"
                    disabled={scannedCards.length === 0}
                    onClick={() => handleValidateAction()}
                    className={`w-full h-14 rounded-xl font-bold text-sm uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer ${
                      scannedCards.length > 0
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/60 active:scale-98'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Проверить решение ➔</span>
                  </button>
                ) : (
                  <button
                    data-testid="confirm-apply-recipe-btn"
                    type="button"
                    onClick={handleConfirmAndApply}
                    className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-black font-black text-sm uppercase tracking-wider transition shadow-xl shadow-emerald-950/80 cursor-pointer active:scale-98 flex items-center justify-center space-x-2"
                  >
                    <span>Применить решение ✓</span>
                  </button>
                )}
              </div>
            )}

            {/* VIEW C: ACTION COMPLETED VIEW (With dedicated Tabletop Instructions) */}
            {actionCompletedResult && (
              <div className="p-5 bg-emerald-950/70 border-2 border-emerald-500 rounded-2xl text-emerald-200 space-y-4">
                <div className="font-black text-base flex items-center space-x-2 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>✓ ДЕЙСТВИЕ ВЫПОЛНЕНО</span>
                </div>

                <p className="text-sm text-white leading-relaxed">
                  {actionCompletedResult.recipe.resultText}
                </p>

                {/* Physical Table Instructions Box */}
                <div className="p-4 bg-black/80 border border-emerald-600/80 rounded-xl text-xs text-emerald-300 font-mono space-y-1.5 shadow-inner">
                  <div className="font-bold uppercase tracking-wider text-amber-300 text-sm">
                    🎲 НА ФИЗИЧЕСКОМ СТОЛЕ:
                  </div>
                  <div>• {actionCompletedResult.consumedText}</div>
                  <div>• Потратьте {actionCompletedResult.actionCost} очко(а) действий активного персонажа.</div>
                </div>

                <button
                  data-testid="done-solution-btn"
                  type="button"
                  onClick={handleCloseDrawer}
                  className="w-full h-14 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-black text-sm uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg"
                >
                  <span>Готово (вернуться в комнату)</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Back Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCloseDrawer}
              className="w-full h-12 rounded-xl bg-[#141d27] hover:bg-[#1f2b38] border border-slate-700 text-slate-300 text-xs font-bold uppercase transition cursor-pointer"
            >
              ← Вернуться в комнату
            </button>
          </div>

        </aside>
      )}

      {/* =========================================================================
          4. ELEVATOR COP MODAL (Floors 15 down to 10)
          ========================================================================= */}
      {isElevatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#101722] border-2 border-amber-500/80 rounded-3xl max-w-md w-full p-6 shadow-2xl text-left relative overflow-hidden my-auto space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
                  ЛИФТОВАЯ ПАНЕЛЬ
                </div>
                <h3 className="text-lg font-black text-white">ВЫБЕРИТЕ ЭТАЖ</h3>
              </div>

              <button
                type="button"
                onClick={() => setIsElevatorOpen(false)}
                className="p-2 rounded-lg bg-[#182330] hover:bg-[#253549] text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Blackout notice */}
            {!power ? (
              <div className="p-4 rounded-xl bg-red-950/60 border border-red-700 text-red-200 text-xs space-y-2">
                <div className="font-bold flex items-center space-x-2 text-sm text-red-300">
                  <ZapOff className="w-4 h-4" />
                  <span>Лифт обесточен!</span>
                </div>
                <p>
                  Здание осталось без электроэнергии 220V. Лифт заблокирован. Для перемещения между этажами используйте лестницу.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsElevatorOpen(false);
                    setIsStairsOpen(true);
                  }}
                  className="w-full h-12 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  Открыть лестницу ➔
                </button>
              </div>
            ) : (
              /* Floor rows 15 down to 10 */
              <div className="space-y-2">
                {[15, 14, 13, 12, 11, 10].map((fl) => {
                  const room = rooms.find((r) => r.floorNumber === fl);
                  const isCurrent = activeFloorNum === fl;

                  return (
                    <button
                      data-testid={`elevator-floor-btn-${fl}`}
                      key={fl}
                      type="button"
                      onClick={() => handleTravelElevator(fl)}
                      className={`w-full h-14 px-4 rounded-xl border flex items-center justify-between font-mono font-bold transition cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-950/70 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                          : 'bg-[#141e2a] hover:bg-[#1e2d3e] border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black border ${
                          isCurrent ? 'bg-amber-500 text-black border-amber-300' : 'bg-black/60 border-slate-700 text-white'
                        }`}>
                          {fl}
                        </span>
                        <span className="text-sm font-sans font-bold">{room?.name || `Этаж ${fl}`}</span>
                      </div>

                      {isCurrent ? (
                        <span className="text-xs text-amber-300 uppercase tracking-widest font-mono">
                          Вы здесь
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">
                          Перейти ➔
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 text-center font-mono">
              Перемещение персонажей и кабина лифта отмечаются на физическом столе.
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          5. STAIRS DIALOG MODAL (Adjacent floors)
          ========================================================================= */}
      {isStairsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#101722] border-2 border-cyan-500/80 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-left relative overflow-hidden my-auto space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold">
                  ЛЕСТНИЧНЫЙ ПЕРЕХОД
                </div>
                <h3 className="text-lg font-black text-white">СОСЕДНИЕ ЭТАЖИ</h3>
              </div>

              <button
                type="button"
                onClick={() => setIsStairsOpen(false)}
                className="p-2 rounded-lg bg-[#182330] hover:bg-[#253549] text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Пеший переход на один соседний этаж (+/- 1) доступен всегда, даже при отключенном питании.
            </p>

            <div className="space-y-2.5 pt-1">
              {activeFloorNum < 15 && (
                <button
                  data-testid="stairs-floor-up-btn"
                  type="button"
                  onClick={() => handleTravelStairs(activeFloorNum + 1)}
                  className="w-full h-14 px-4 rounded-xl bg-[#14202d] hover:bg-[#1d2f42] border border-cyan-500/60 text-white font-bold text-sm flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <ArrowUp className="w-5 h-5 text-cyan-400" />
                    <span>Этаж {activeFloorNum + 1} · {rooms.find(r => r.floorNumber === activeFloorNum + 1)?.name}</span>
                  </div>
                  <span className="text-xs text-cyan-400 uppercase font-mono">Вверх ➔</span>
                </button>
              )}

              {activeFloorNum > 10 && (
                <button
                  data-testid="stairs-floor-down-btn"
                  type="button"
                  onClick={() => handleTravelStairs(activeFloorNum - 1)}
                  className="w-full h-14 px-4 rounded-xl bg-[#14202d] hover:bg-[#1d2f42] border border-cyan-500/60 text-white font-bold text-sm flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <ArrowDown className="w-5 h-5 text-cyan-400" />
                    <span>Этаж {activeFloorNum - 1} · {rooms.find(r => r.floorNumber === activeFloorNum - 1)?.name}</span>
                  </div>
                  <span className="text-xs text-cyan-400 uppercase font-mono">Вниз ➔</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 text-center font-mono">
              Правила перемещения и трата действий разрешаются на столе.
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          6. BUILDING OVERVIEW MODAL («Здание») (15 at top down to 10)
          ========================================================================= */}
      {isBuildingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#0f1622] border-2 border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-left relative overflow-hidden my-auto space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
                  СХЕМА НЕБОСКРЁБА
                </div>
                <h3 className="text-xl font-black text-white">ВЕРТИКАЛЬНЫЙ РАЗРЕЗ (15 → 10)</h3>
              </div>

              <button
                type="button"
                onClick={() => setIsBuildingOpen(false)}
                className="p-2 rounded-lg bg-[#182330] hover:bg-[#253549] text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Нажмите на любой этаж для осмотра помещения. Фигурки героев и заражённых остаются на столе.
            </p>

            {/* Vertical list of all 6 floors in natural top-to-bottom order */}
            <div className="space-y-2">
              {[15, 14, 13, 12, 11, 10].map((fl) => {
                const room = rooms.find((r) => r.floorNumber === fl);
                const isCurrent = activeFloorNum === fl;

                return (
                  <button
                    key={fl}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onSelectActiveFloor(fl);
                      setIsBuildingOpen(false);
                    }}
                    className={`w-full h-14 px-4 rounded-xl border flex items-center justify-between font-mono font-bold transition cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-lg'
                        : 'bg-[#141e2a] hover:bg-[#1c2a3b] border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black border ${
                        isCurrent ? 'bg-cyan-500 text-black border-cyan-300' : 'bg-black/60 border-slate-700 text-white'
                      }`}>
                        {fl}
                      </span>
                      <span className="text-sm font-sans font-bold truncate">{room?.name}</span>
                    </div>

                    <div className="text-xs shrink-0 font-bold">
                      {fl === 11 && (
                        <span className={leakStatus === 'repaired' ? 'text-emerald-400' : 'text-red-400'}>
                          {leakStatus === 'repaired' ? '✓ Исправно' : '💧 Свищ трубы'}
                        </span>
                      )}
                      {fl === 14 && (
                        <span className={irinaStatus === 'prepared' ? 'text-emerald-400' : 'text-amber-400'}>
                          {irinaStatus === 'prepared' ? '✓ Ирина спасена' : '💉 Ирина ранена'}
                        </span>
                      )}
                      {fl === 15 && (
                        <span className={roofHatchOpen ? 'text-emerald-400' : 'text-amber-400'}>
                          {roofHatchOpen ? '✓ Люк открыт' : '🔒 Люк закрыт'}
                        </span>
                      )}
                      {fl === 10 && (
                        <span className={power ? 'text-emerald-400' : 'text-red-400'}>
                          {power ? '220V' : '⚡ Обесточено'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          7. STORY & HISTORY DRAWER («История»)
          ========================================================================= */}
      {isHistoryOpen && (
        <aside className="fixed right-0 top-12 bottom-0 w-full sm:w-[480px] bg-[#0c1219]/95 backdrop-blur-xl border-l border-slate-700/80 z-40 shadow-2xl flex flex-col justify-between p-6 overflow-y-auto animate-slideLeft">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold">
                  СЮЖЕТ И ЗАДАЧИ
                </div>
                <h3 className="text-xl font-black text-white">ИСТОРИЯ ПАРТИИ</h3>
              </div>

              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 rounded-lg bg-[#182330] hover:bg-[#253549] text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rescue Plan Overview */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/60 to-amber-950/60 border border-amber-500/50 space-y-2">
              <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                УСЛОВИЯ ЭВАКУАЦИИ (ДО РАУНДА 8):
              </div>
              <ul className="text-xs text-gray-200 space-y-1.5 list-disc pl-4 font-mono">
                <li><b>Люк на крышу (этаж 15):</b> {roofHatchOpen ? '✓ Открыт' : '🔒 Заклинен'}</li>
                <li><b>Сигнал спасателям:</b> {rescueSignal === 'radio' ? '✓ Радиосвязь (с раунда 6)' : rescueSignal === 'light' ? '✓ Световой сигнал (с раунда 7)' : 'НЕТ СВЯЗИ'}</li>
                <li><b>Команда:</b> собраться всем на 15-м этаже на столе при отсутствии заражённых.</li>
              </ul>
            </div>

            {/* Story Logs */}
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                События сценария:
              </div>
              {gameState.logs.length === 0 ? (
                <div className="text-xs text-slate-500 p-3 bg-black/40 rounded border border-slate-800">
                  Событий пока не зафиксировано.
                </div>
              ) : (
                gameState.logs.slice(0, 15).map((log) => (
                  <div key={log.id} className="p-2.5 rounded bg-[#121922] border border-slate-800 text-xs text-slate-300 font-mono">
                    <span className="text-slate-500 mr-2">[{log.time}]</span>
                    <span>{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(false)}
              className="w-full h-12 rounded-xl bg-[#141d27] hover:bg-[#1f2b38] border border-slate-700 text-slate-300 text-xs font-bold uppercase cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </aside>
      )}

      {/* =========================================================================
          8. MENU & SETTINGS DRAWER («Меню»)
          ========================================================================= */}
      {isMenuOpen && (
        <aside className="fixed right-0 top-12 bottom-0 w-full sm:w-[420px] bg-[#0c1219]/95 backdrop-blur-xl border-l border-slate-700/80 z-40 shadow-2xl flex flex-col justify-between p-6 overflow-y-auto animate-slideLeft">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs uppercase font-mono tracking-widest text-slate-400 font-bold">
                  УПРАВЛЕНИЕ
                </div>
                <h3 className="text-xl font-black text-white">МЕНЮ ПРИЛОЖЕНИЯ</h3>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg bg-[#182330] hover:bg-[#253549] text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Reference rules */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenReference('rules');
                }}
                className="w-full h-12 px-4 rounded-xl bg-[#141e2a] hover:bg-[#1d2c3d] border border-slate-700 text-white font-bold text-xs uppercase flex items-center space-x-2.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Справочник правил игры</span>
              </button>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !sound.getMuted();
                  sound.setMuted(next);
                }}
                className="w-full h-12 px-4 rounded-xl bg-[#141e2a] hover:bg-[#1d2c3d] border border-slate-700 text-white font-bold text-xs uppercase flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  {sound.getMuted() ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  <span>Звуковые эффекты</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {sound.getMuted() ? 'Выключены' : 'Включены'}
                </span>
              </button>

              {/* Quick transitions toggle */}
              <button
                type="button"
                onClick={() => setQuickTransitions(!quickTransitions)}
                className="w-full h-12 px-4 rounded-xl bg-[#141e2a] hover:bg-[#1d2c3d] border border-slate-700 text-white font-bold text-xs uppercase flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Быстрые переходы лифта</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {quickTransitions ? 'Мгновенно' : '1.2 сек'}
                </span>
              </button>

              {/* Undo action */}
              {hasUndo && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onUndo();
                  }}
                  className="w-full h-12 px-4 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-300 font-bold text-xs uppercase flex items-center space-x-2.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Отменить последнее действие</span>
                </button>
              )}

              {/* Reset Game */}
              {onResetGame && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Начать сценарий заново? Текущий прогресс будет сброшен.')) {
                      setIsMenuOpen(false);
                      onResetGame();
                    }
                  }}
                  className="w-full h-12 px-4 rounded-xl bg-[#1e1317] hover:bg-[#2d1820] border border-red-900 text-red-300 font-bold text-xs uppercase flex items-center space-x-2.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Начать сценарий заново</span>
                </button>
              )}
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
              <div>Сохранение: активно в памяти браузера.</div>
              <div>Версия: 0.6.0 MVP (гибридное разделение).</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="w-full h-12 rounded-xl bg-[#141d27] hover:bg-[#1f2b38] border border-slate-700 text-slate-300 text-xs font-bold uppercase cursor-pointer"
            >
              Продолжить игру
            </button>
          </div>
        </aside>
      )}

    </div>
  );
};
