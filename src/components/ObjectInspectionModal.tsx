import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  InteractableObject,
  GameState,
  InteractionRecipe,
  CardItem
} from '../types/game';
import {
  X,
  Camera,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Wrench,
  Zap,
  Volume2,
  Trash2,
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
  Shield,
  HelpCircle,
  ScanLine
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

interface ObjectInspectionModalProps {
  interactable: InteractableObject;
  gameState: GameState;
  onClose: () => void;
  onApplyRecipe: (recipe: InteractionRecipe, calculatedNoise: number) => void;
  initialCards?: string[];
}

export const ObjectInspectionModal: React.FC<ObjectInspectionModalProps> = ({
  interactable,
  gameState,
  onClose,
  onApplyRecipe,
  initialCards
}) => {
  const [scannedCards, setScannedCards] = useState<string[]>(initialCards || []);
  const [manualInput, setManualInput] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [handFilter, setHandFilter] = useState('');
  const [cardCategory, setCardCategory] = useState<'all' | 'tools' | 'supplies' | 'data'>('all');

  // Tabletop condition checkboxes
  const [isWorkingUnderThreat, setIsWorkingUnderThreat] = useState(false);
  const [isCautionOverload, setIsCautionOverload] = useState(false);

  // Referee evaluation state (hidden until player clicks "Применить карты")
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<PreFlightCheckResult | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Voice briefing for this specific object
  const handleVoiceBriefing = () => {
    sound.playClick();
    const text = `${interactable.name}. ${interactable.whatIsHappening || interactable.description}`;
    narrator.speak(text);
  };

  // Add or Remove Card from Slots
  const toggleCardSlot = useCallback(
    (codeRaw: string) => {
      const code = parseCardCode(codeRaw);
      if (!code) return;

      setValidationAttempted(false); // Reset attempt on change
      if (scannedCards.includes(code)) {
        sound.playClick();
        setScannedCards((prev) => prev.filter((c) => c !== code));
      } else {
        sound.playCardSnap();
        if (scannedCards.length >= 2) {
          // Replace second slot if full
          setScannedCards((prev) => [prev[0], code]);
        } else {
          setScannedCards((prev) => [...prev, code]);
        }
      }
    },
    [scannedCards]
  );

  const addManualCard = () => {
    if (!manualInput.trim()) return;
    const parsed = parseCardCode(manualInput.trim());
    if (parsed) {
      if (scannedCards.includes(parsed)) {
        sound.playError();
      } else {
        sound.playCardSnap();
        setValidationAttempted(false);
        setScannedCards((prev) => (prev.length >= 2 ? [prev[0], parsed] : [...prev, parsed]));
        setManualInput('');
      }
    } else {
      sound.playError();
    }
  };

  const removeCard = (idx: number) => {
    sound.playClick();
    setValidationAttempted(false);
    setScannedCards((prev) => prev.filter((_, i) => i !== idx));
  };

  // QR Scanning loop
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

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code && code.data) {
      const parsed = parseCardCode(code.data);
      if (parsed && !scannedCards.includes(parsed)) {
        sound.playSuccess();
        setValidationAttempted(false);
        setScannedCards((prev) => (prev.length >= 2 ? [prev[0], parsed] : [...prev, parsed]));
      }
    }

    animFrameId.current = requestAnimationFrame(scanQRCode);
  }, [scannedCards]);

  // Start Camera when requested
  useEffect(() => {
    if (!showCamera) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
        animFrameId.current = null;
      }
      return;
    }

    let mounted = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode } })
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
      .catch(() => {
        if (mounted) setHasCamera(false);
      });

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [showCamera, facingMode, scanQRCode]);

  // The Referee Action: player clicks [ ПРИМЕНИТЬ КАРТЫ ]
  const handlePerformValidation = () => {
    if (scannedCards.length === 0) {
      sound.playError();
      return;
    }

    const result = evaluateInteraction(
      scannedCards,
      interactable.floor,
      gameState,
      {
        isWorkingUnderThreat,
        isCautionOverload
      }
    );

    setEvaluationResult(result);
    setValidationAttempted(true);

    if (result.isValid && result.recipe) {
      sound.playSuccess();
    } else {
      sound.playError();
    }
  };

  // Filtered playable cards for the tray
  const allCards: CardItem[] = [...OFFICIAL_ITEMS, ...OFFICIAL_DATA_CARDS];
  const filteredCards = allCards.filter((card) => {
    const codeNum = parseInt(card.code, 10);
    let categoryMatch = true;
    if (cardCategory === 'tools') categoryMatch = codeNum >= 101 && codeNum <= 105;
    else if (cardCategory === 'supplies') categoryMatch = codeNum >= 106 && codeNum <= 118;
    else if (cardCategory === 'data') categoryMatch = codeNum >= 201 && codeNum <= 206;

    if (!categoryMatch) return false;
    if (!handFilter) return true;
    const q = handFilter.toLowerCase();
    return (
      card.code.includes(q) ||
      card.name.toLowerCase().includes(q) ||
      card.properties.some((p) => p.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2.5 sm:p-4 select-none animate-fadeIn overflow-y-auto">
      <div className="bg-[#0b1118] border-2 border-cyan-500/80 rounded-3xl max-w-3xl w-full max-h-[96vh] flex flex-col shadow-[0_0_50px_rgba(34,211,238,0.3)] overflow-hidden my-auto">
        
        {/* 1. TOP HEADER: OBJECT TITLE & PHYSICAL SENSORY STATUS */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#121c27] via-[#0d1620] to-[#121c27] border-b border-[#21354a] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 font-mono font-black text-sm shadow-md">
              FL {interactable.floor}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-black font-mono text-white tracking-wide uppercase">
                  {interactable.name}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/60 text-cyan-300">
                  ОБЪЕКТ СЦЕНАРИЯ
                </span>
              </div>
              <p className="text-[11px] font-mono text-gray-400 line-clamp-1 mt-0.5">
                {interactable.whatIsHappening || interactable.description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleVoiceBriefing}
              title="Озвучить обстановку голосом"
              className="px-3 py-1.5 rounded-xl bg-[#172535] hover:bg-cyan-600 border border-[#2a4057] text-cyan-300 hover:text-white transition cursor-pointer flex items-center space-x-1 font-mono text-xs font-bold"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Озвучить</span>
            </button>

            <button
              data-testid="close-object-modal-btn"
              onClick={() => {
                sound.playClick();
                narrator.stop();
                onClose();
              }}
              className="p-2 rounded-xl bg-gray-800/80 hover:bg-red-900 border border-gray-700 hover:border-red-500 text-gray-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. BODY: TACTILE PLAYABLE CARD INTERFACE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-mono text-xs">
          
          {/* A. SENSORY PHYSICAL BRIEFING (Atmospheric Clue without Recipe Codes) */}
          <div className="p-3.5 rounded-2xl bg-[#0f1722] border border-[#21354a] flex items-start space-x-3 shadow-md">
            <div className="text-2xl mt-0.5">
              {interactable.floor === 11 ? '💧' : interactable.floor === 14 ? '💉' : interactable.floor === 15 ? '🚁' : '⚙️'}
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-0.5">
                Обстановка перед выжившими на этаже {interactable.floor}:
              </div>
              <p className="text-xs text-gray-200 font-sans leading-relaxed">
                {interactable.whatIsHappening || interactable.description}
              </p>
              {interactable.deadlineRoundsText && (
                <div className="mt-2 text-[10px] text-red-400 font-bold flex items-center space-x-1.5 bg-red-950/60 border border-red-800/80 rounded-lg px-2.5 py-1 w-fit">
                  <Clock className="w-3.5 h-3.5 text-red-400" />
                  <span>{interactable.deadlineRoundsText}</span>
                </div>
              )}
            </div>
          </div>

          {/* B. THE 2 TACTILE CARD RECEPTACLES (SLOTS) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase text-gray-400">
              <span className="flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Гнезда карт для взаимодействия (до 2 карт):</span>
              </span>
              {scannedCards.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setValidationAttempted(false);
                    setScannedCards([]);
                  }}
                  className="text-gray-400 hover:text-red-400 text-[10px] underline cursor-pointer"
                >
                  Очистить оба слота
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[0, 1].map((slotIdx) => {
                const code = scannedCards[slotIdx];
                const card = code ? getCardByCode(code) : undefined;

                return (
                  <div
                    key={slotIdx}
                    className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[105px] shadow-lg ${
                      card
                        ? 'bg-gradient-to-br from-[#12283a] via-[#101c27] to-[#0c141d] border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] text-white'
                        : 'bg-[#0f1622] border-dashed border-gray-700 text-gray-500 hover:border-gray-500'
                    }`}
                  >
                    {card ? (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-500/70">
                            СЛОТ {slotIdx + 1} • #{card.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCard(slotIdx)}
                            title="Извлечь карту обратно в руку"
                            className="p-1 rounded bg-black/60 hover:bg-red-900 border border-gray-700 hover:border-red-500 text-gray-400 hover:text-white transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-white mt-1 leading-snug">
                          {card.name}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2 text-[9px]">
                          {card.properties.map((p, i) => (
                            <span key={i} className="px-1.5 py-0.2 rounded bg-black/60 border border-gray-700 text-cyan-300">
                              {p}
                            </span>
                          ))}
                          {card.isConsumable ? (
                            <span className="px-1.5 py-0.2 rounded bg-red-950 border border-red-700 text-red-300 font-bold">
                              Расходник 🗑️
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                              Многоразовый ●●
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center flex-1 py-3 text-center">
                        <KeyRound className="w-6 h-6 text-gray-600 mb-1 animate-pulse" />
                        <span className="text-[11px] font-bold text-gray-400">
                          Гнездо {slotIdx + 1} свободно
                        </span>
                        <span className="text-[9px] text-gray-500 mt-0.5">
                          Нажмите карту в лотке ниже или введите номер
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* C. FAST NUMBER INPUT & QR CAMERA SCANNER */}
          <div className="p-3 rounded-2xl bg-[#0c141d] border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center space-x-2 w-full sm:w-auto flex-1">
              <input
                data-testid="card-code-input"
                type="text"
                maxLength={4}
                placeholder="Номер с карты (например: 103)"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addManualCard();
                }}
                className="bg-black/80 border border-gray-700 focus:border-cyan-400 rounded-xl px-3 py-1.5 text-xs text-white outline-none flex-1 max-w-xs font-mono shadow-inner"
              />
              <button
                data-testid="submit-card-code-btn"
                type="button"
                onClick={addManualCard}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs cursor-pointer active:scale-95 transition shadow"
              >
                + Вставить
              </button>
            </div>

            {hasCamera && (
              <button
                type="button"
                onClick={() => setShowCamera(!showCamera)}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow ${
                  showCamera
                    ? 'bg-red-950 border-red-500 text-red-300'
                    : 'bg-[#162330] hover:bg-[#1f3143] border-gray-700 text-gray-300'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showCamera ? 'Выключить' : 'Сканировать QR'}</span>
              </button>
            )}
          </div>

          {/* Active QR Camera Viewport */}
          {showCamera && (
            <div className="relative aspect-video max-h-44 rounded-2xl bg-black border-2 border-cyan-500/80 overflow-hidden flex items-center justify-center shadow-xl">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-2 border-dashed border-cyan-400 pointer-events-none rounded-2xl m-3 flex items-center justify-center">
                <span className="text-[10px] font-mono text-cyan-300 bg-black/80 px-2.5 py-1 rounded-lg">
                  Наведите камеру на QR-код карты на столе
                </span>
              </div>
            </div>
          )}

          {/* D. PLAYABLE CARD TRAY (КАРТЫ НА РУКАХ / СНАРЯЖЕНИЕ КОМАНДЫ) */}
          <div className="p-3.5 rounded-2xl bg-[#0f1722] border border-[#21354a] space-y-2.5 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
                  Карты снаряжения на столе:
                </span>
                <span className="text-[10px] text-gray-400 hidden sm:inline">
                  (Нажмите карту для вставки в гнездо)
                </span>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center space-x-1">
                {(
                  [
                    { id: 'all', label: 'Все' },
                    { id: 'tools', label: 'Инструменты' },
                    { id: 'supplies', label: 'Снаряжение' },
                    { id: 'data', label: 'Данные' }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCardCategory(tab.id)}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition cursor-pointer ${
                      cardCategory === tab.id
                        ? 'bg-cyan-600 text-white shadow'
                        : 'bg-black/50 text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick search input */}
            <div className="flex items-center space-x-2 bg-black/60 border border-gray-800 rounded-xl px-2.5 py-1">
              <Search className="w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Поиск карты по номеру или названию..."
                value={handFilter}
                onChange={(e) => setHandFilter(e.target.value)}
                className="bg-transparent text-white text-xs outline-none flex-1 font-mono"
              />
              {handFilter && (
                <button
                  type="button"
                  onClick={() => setHandFilter('')}
                  className="text-gray-400 hover:text-white text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Clickable Card Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredCards.map((c) => {
                const isSelected = scannedCards.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggleCardSlot(c.code)}
                    className={`p-2 rounded-xl border text-left font-mono transition-all flex flex-col justify-between h-20 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)] ring-1 ring-cyan-400'
                        : 'bg-[#14202c] hover:bg-[#1c2e40] border-[#25394d] hover:border-gray-500 text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-amber-300">
                        #{c.code}
                      </span>
                      {isSelected ? (
                        <span className="text-[8px] font-black px-1 rounded bg-cyan-400 text-black">
                          В ГНЕЗДЕ
                        </span>
                      ) : (
                        <span className="text-[8px] text-gray-500">
                          {c.isConsumable ? 'Расходник' : '●●'}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-white line-clamp-1 leading-tight mt-0.5">
                      {c.name}
                    </div>
                    <div className="text-[8px] text-cyan-300/80 truncate">
                      {c.properties[0] || 'предмет'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* E. TABLETOP SITUATIONAL MODIFIERS */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-gray-800 flex flex-col sm:flex-row gap-3 text-[11px]">
            <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isWorkingUnderThreat}
                onChange={(e) => {
                  setValidationAttempted(false);
                  setIsWorkingUnderThreat(e.target.checked);
                }}
                className="rounded bg-black border-gray-600 text-red-500 focus:ring-0 cursor-pointer"
              />
              <span>Зомби на этаже (+1 шум)</span>
            </label>

            <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isCautionOverload}
                onChange={(e) => {
                  setValidationAttempted(false);
                  setIsCautionOverload(e.target.checked);
                }}
                className="rounded bg-black border-gray-600 text-cyan-400 focus:ring-0 cursor-pointer"
              />
              <span>Осторожность на перегруз (-2 шума)</span>
            </label>
          </div>

          {/* F. BIG ACTION BUTTON & REFEREE VALIDATION STATE */}
          {!validationAttempted ? (
            <button
              data-testid="referee-validate-cards-btn"
              type="button"
              disabled={scannedCards.length === 0}
              onClick={handlePerformValidation}
              className={`w-full py-3.5 rounded-2xl font-mono text-xs sm:text-sm font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-xl cursor-pointer ${
                scannedCards.length > 0
                  ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white shadow-amber-950/80 active:scale-95'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>
                {scannedCards.length > 0
                  ? `⚡ Применить выбранные карты (${scannedCards.map((c) => `#${c}`).join(' + ')})`
                  : 'Вставьте 1 или 2 карты в гнезда выше'}
              </span>
            </button>
          ) : (
            /* G. THE SECRET REFEREE OUTCOME */
            <div
              className={`p-4 rounded-2xl border-2 transition space-y-3.5 ${
                evaluationResult?.isValid
                  ? 'bg-gradient-to-br from-emerald-950/90 via-[#10221c] to-emerald-950/70 border-emerald-400 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-fadeIn'
                  : 'bg-gradient-to-br from-red-950/90 via-[#1e1012] to-red-950/70 border-red-500 text-red-200 animate-fadeIn shadow-[0_0_20px_rgba(239,68,68,0.35)]'
              }`}
            >
              {evaluationResult?.isValid && evaluationResult.recipe ? (
                <>
                  <div className="flex items-center space-x-2 text-emerald-300 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>✓ УСПЕШНОЕ ВЗАИМОДЕЙСТВИЕ: {evaluationResult.recipe.name}</span>
                  </div>

                  <p className="text-xs text-white font-sans leading-relaxed bg-black/40 p-3 rounded-xl border border-emerald-700/50">
                    {evaluationResult.recipe.resultText}
                  </p>

                  {/* Physical Tabletop Instructions */}
                  <div className="space-y-1.5 text-[11px] font-mono bg-black/60 p-3 rounded-xl border border-emerald-800/80">
                    <div className="text-amber-300 font-bold uppercase tracking-wider mb-1 text-[10px]">
                      Действия на физическом столе:
                    </div>
                    {evaluationResult.consumedCards.length > 0 && (
                      <div className="text-red-300 flex items-center space-x-1.5">
                        <span>🗑️</span>
                        <span>Сбросьте в сброс: {evaluationResult.consumedCards.map((c) => `#${c.code} (${c.name})`).join(', ')}</span>
                      </div>
                    )}
                    {evaluationResult.durabilitySpent.length > 0 && (
                      <div className="text-amber-200 flex items-center space-x-1.5">
                        <span>🔧</span>
                        <span>Износ: {evaluationResult.durabilitySpent.map((d) => `#${d.card.code} (${d.card.name}) потерял 1 прочность (осталось ${d.remainingUses})`).join(', ')}</span>
                      </div>
                    )}
                    <div className="text-cyan-300 flex items-center space-x-1.5">
                      <span>⚡</span>
                      <span>Потрачено очков действий: {evaluationResult.recipe.actionCost} д.</span>
                    </div>
                    <div className="text-yellow-300 flex items-center space-x-1.5">
                      <span>🔊</span>
                      <span>Создан шум на этаже: +{evaluationResult.calculatedNoise}</span>
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <button
                    data-testid="confirm-apply-recipe-btn"
                    type="button"
                    onClick={() => {
                      sound.playSuccess();
                      narrator.stop();
                      onApplyRecipe(evaluationResult.recipe!, evaluationResult.calculatedNoise);
                      onClose();
                    }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black font-mono uppercase tracking-wider text-xs sm:text-sm shadow-xl active:scale-95 transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Зафиксировать результат на столе ✓</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2 text-red-300 font-black text-sm">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <span>❌ ЭТА КОМБИНАЦИЯ НЕ РАБОТАЕТ</span>
                  </div>

                  <p className="text-xs text-gray-200 font-sans leading-relaxed bg-black/40 p-3 rounded-xl border border-red-800/50">
                    {evaluationResult?.errorMessage ||
                      'Выбранные предметы не подходят для устранения этой аварии или активации объекта. Попробуйте посовещаться с командой и осмотреть другое снаряжение.'}
                  </p>

                  <div className="text-[10px] text-gray-400 font-mono italic">
                    💡 Ошибочная проверка не тратит очки действий, прочность или карты. Верните карты на руки.
                  </div>

                  <button
                    type="button"
                    onClick={() => setValidationAttempted(false)}
                    className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs font-bold uppercase transition cursor-pointer"
                  >
                    ← Попробовать другие карты
                  </button>
                </>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};