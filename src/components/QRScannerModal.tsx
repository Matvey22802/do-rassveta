import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { InteractableObject, EngineeringApproach } from '../types/game';
import {
  X,
  Camera,
  RefreshCw,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  ShieldQuestion,
  Wrench,
  Volume2,
  Zap,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';
import { sound } from '../utils/audio';

interface QRScannerModalProps {
  interactable: InteractableObject;
  onClose: () => void;
  onSuccess: (code: string, approach?: EngineeringApproach) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  interactable,
  onClose,
  onSuccess
}) => {
  const [manualCode, setManualCode] = useState('');
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanStatus, setScanStatus] = useState<'scanning' | 'success' | 'failed' | 'approach_pending'>('scanning');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Selected engineering approach awaiting player confirmation
  const [selectedApproach, setSelectedApproach] = useState<EngineeringApproach | null>(null);
  const [matchedCode, setMatchedCode] = useState<string>(interactable.requiredCode || '');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const approaches = interactable.approaches || [];

  // Handle scanned or entered code
  const handleCodeSubmission = useCallback(
    (scannedCode: string) => {
      const cleanCode = scannedCode.trim().toUpperCase();

      // Check if code matches any multi-approach engineering solution
      if (approaches.length > 0) {
        const foundApproach = approaches.find(
          (app: EngineeringApproach) =>
            cleanCode === app.requiredCode.toUpperCase() ||
            (app.alternativeCodes || []).some((ac) => ac.toUpperCase() === cleanCode)
        );

        if (foundApproach) {
          sound.playSuccess();
          setSelectedApproach(foundApproach);
          setMatchedCode(cleanCode);
          setScanStatus('approach_pending');
          return;
        }
      }

      // Check base required code
      const targetCodes = [
        (interactable.requiredCode || '').trim().toUpperCase(),
        ...(interactable.alternativeCodes || []).map((c) => c.trim().toUpperCase())
      ].filter(Boolean);

      const isMatch = targetCodes.some(
        (target) =>
          cleanCode === target ||
          cleanCode.endsWith(target) ||
          target.endsWith(cleanCode)
      );

      if (isMatch) {
        sound.playSuccess();
        setScanStatus('success');
        setStatusMessage(interactable.successMessage || 'Успех!');
        setTimeout(() => {
          onSuccess(cleanCode);
        }, 1200);
      } else {
        sound.playError();
        setScanStatus('failed');
        setStatusMessage(
          interactable.failureMessage ||
            'Неподходящая комбинация. Проверьте свойства предмета (рычаг, герметизация, энергия).'
        );
        setTimeout(() => {
          setScanStatus('scanning');
          setStatusMessage(null);
        }, 2500);
      }
    },
    [interactable, approaches, onSuccess]
  );

  // Confirm pending engineering approach
  const handleConfirmApproach = () => {
    if (!selectedApproach) return;
    sound.playSuccess();
    setScanStatus('success');
    setStatusMessage(selectedApproach.successMessage || 'Успешно применено!');
    setTimeout(() => {
      onSuccess(matchedCode, selectedApproach);
    }, 1200);
  };

  // Scan video frame with jsQR
  const tick = useCallback(() => {
    if (
      videoRef.current &&
      videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
      canvasRef.current &&
      scanStatus === 'scanning'
    ) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          handleCodeSubmission(code.data);
          return;
        }
      }
    }
    if (scanStatus === 'scanning') {
      animFrameId.current = requestAnimationFrame(tick);
    }
  }, [handleCodeSubmission, scanStatus]);

  // Start Camera
  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setCameraError('Камера не поддерживается вашим браузером');
      return;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().then(() => {
          animFrameId.current = requestAnimationFrame(tick);
        });
      }
      setHasCamera(true);
    } catch (err) {
      console.warn('Camera access error:', err);
      setHasCamera(false);
      setCameraError('Доступ к веб-камере не разрешен или камера занята.');
    }
  }, [facingMode, tick]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [startCamera]);

  const toggleCameraFacing = () => {
    sound.playClick();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeSubmission(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#121922] border border-[#2b3d4f] rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#223040] flex items-center justify-between bg-[#16202c]">
          <div className="flex items-center space-x-2.5">
            <Camera className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                Инженерное взаимодействие
              </h3>
              <p className="text-xs text-[#8b949e]">
                Объект: <span className="text-amber-300 font-bold">{interactable.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-[#212d3b] hover:bg-[#2b3a4a] text-[#8b949e] hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. SECTION 5 MULTI-APPROACH SELECTOR (IF MULTIPLE APPROACHES EXIST) */}
        {approaches.length > 0 && scanStatus !== 'approach_pending' && (
          <div className="p-4 bg-[#141d27] border-b border-[#202e3e]">
            <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Wrench className="w-4 h-4" />
              <span>Доступные инженерные подходы:</span>
            </div>
            <div className="space-y-2">
              {approaches.map((app: EngineeringApproach) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedApproach(app);
                    setMatchedCode(app.requiredCode);
                    setScanStatus('approach_pending');
                  }}
                  className="w-full p-3 rounded-xl bg-[#192533] hover:bg-[#203144] border border-[#2a3e54] hover:border-cyan-400 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="font-mono font-bold text-xs text-white group-hover:text-cyan-300">
                      {app.title}
                    </div>
                    <div className="text-[11px] font-mono text-gray-400">
                      {app.subtitle}
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-black/50 border border-gray-700 text-[10px] font-mono text-amber-300">
                    #{app.requiredCode}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. APPROACH CONFIRMATION VIEW (SECTION 5 REQUIREMENT: CLEAR COST BEFORE CONFIRMATION) */}
        {scanStatus === 'approach_pending' && selectedApproach ? (
          <div className="p-5 sm:p-6 bg-[#101722] space-y-4">
            <div className="p-4 rounded-2xl bg-cyan-950/40 border-2 border-cyan-500/80">
              <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1">
                ПОДТВЕРЖДЕНИЕ ИНЖЕНЕРНОГО РЕШЕНИЯ
              </div>
              <h4 className="text-base font-mono font-black text-white mb-2">
                {selectedApproach.title}
              </h4>
              <p className="text-xs font-mono text-gray-300 leading-relaxed mb-4">
                {selectedApproach.description}
              </p>

              {/* Exact Consequences & Costs Breakdown */}
              <div className="space-y-2 text-xs font-mono">
                {/* Consumed items */}
                <div className="p-2.5 rounded-xl bg-black/60 border border-gray-700 flex items-start space-x-2">
                  <Package className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-amber-300 font-bold block">Расход предметов:</span>
                    <span className="text-gray-300">{selectedApproach.consumedItemsText}</span>
                    {selectedApproach.retainedItemsText && (
                      <span className="text-emerald-400 block text-[11px] mt-0.5">
                        ✓ {selectedApproach.retainedItemsText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Noise impact */}
                <div className="p-2.5 rounded-xl bg-black/60 border border-gray-700 flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div>
                    <span className="text-cyan-300 font-bold">Уровень шума: </span>
                    <span className={(selectedApproach.noiseDelta || 0) > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                      {(selectedApproach.noiseDelta || 0) > 0 ? `+${selectedApproach.noiseDelta} жетон шума на этаже` : '0 (Тихо, без привлечения тварей)'}
                    </span>
                  </div>
                </div>

                {/* Building system impact */}
                <div className="p-2.5 rounded-xl bg-black/60 border border-gray-700 flex items-start space-x-2">
                  <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-amber-300 font-bold block">Состояние здания:</span>
                    <span className="text-gray-300">{selectedApproach.buildingImpact}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setScanStatus('scanning');
                  setSelectedApproach(null);
                }}
                className="flex-1 py-3 rounded-xl bg-[#172332] hover:bg-[#223345] text-gray-300 font-mono text-xs font-bold transition cursor-pointer"
              >
                ← Выбрать другое решение
              </button>

              <button
                type="button"
                onClick={handleConfirmApproach}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>ПОДТВЕРДИТЬ РЕШЕНИЕ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 3. CAMERA SCANNER VIEWPORT */}
            <div className="relative bg-black h-56 sm:h-64 flex items-center justify-center overflow-hidden">
              {hasCamera && !cameraError ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanning Target Box */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                    <div className="relative w-44 h-44 border-2 border-cyan-400/70 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/20">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-cyan-400"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-cyan-400"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-cyan-400"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-cyan-400"></div>

                      {scanStatus === 'scanning' && (
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-0 animate-[bounce_2s_infinite]"></div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={toggleCameraFacing}
                    className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 transition border border-white/20"
                    title="Переключить камеру"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="p-6 text-center text-[#8b949e]">
                  <ShieldQuestion className="w-12 h-12 text-amber-500 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-medium text-white mb-1">Камера недоступна</p>
                  <p className="text-xs max-w-xs mx-auto">
                    {cameraError || 'Используйте быстрый ручной ввод кода с карты ниже.'}
                  </p>
                </div>
              )}

              {/* Status Message Overlay */}
              {statusMessage && (
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md transition-all ${
                    scanStatus === 'success'
                      ? 'bg-emerald-950/90 text-white'
                      : 'bg-red-950/90 text-white'
                  }`}
                >
                  {scanStatus === 'success' ? (
                    <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-2 animate-bounce" />
                  ) : (
                    <AlertCircle className="w-14 h-14 text-red-400 mb-2 animate-pulse" />
                  )}
                  <div className="text-lg font-black font-mono uppercase tracking-wider mb-1">
                    {scanStatus === 'success' ? 'КАРТА ПОДХОДИТ!' : 'ПРЕДМЕТ НЕ ПОДХОДИТ'}
                  </div>
                  <p className="text-sm max-w-sm">{statusMessage}</p>
                </div>
              )}
            </div>

            {/* 4. MANUAL CODE INPUT FORM */}
            <div className="p-4 sm:p-5 bg-[#141c26] border-t border-[#223040]">
              <div className="text-xs font-mono uppercase tracking-wider text-[#8b949e] mb-2 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ввод номера с физической карты:</span>
                </span>
                <span className="text-amber-400/90 text-[11px]">Например: 101, 103, 202</span>
              </div>

              <form onSubmit={handleManualSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Код карты (напр. 101)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0e141c] border border-[#2b3d4f] focus:border-cyan-400 focus:outline-none text-white font-mono text-sm tracking-widest uppercase placeholder:text-gray-600"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold tracking-wider uppercase text-xs font-mono transition shadow-lg cursor-pointer"
                >
                  Проверить
                </button>
              </form>

              {/* Quick Presets */}
              <div className="mt-3 pt-3 border-t border-[#1f2b38] flex items-center space-x-1.5 overflow-x-auto text-xs text-[#8b949e]">
                <span className="text-[10px] font-mono uppercase tracking-wider flex-shrink-0">
                  Быстрый ввод:
                </span>
                {['101', '102', '103', '104', '105', '106', '107', '108', '201', '202', '203', '204', '205', '206'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setManualCode(preset);
                      handleCodeSubmission(preset);
                    }}
                    className="px-2 py-0.5 rounded bg-[#1a2533] hover:bg-[#233244] border border-[#2c3d50] text-[#c9d1d9] hover:text-cyan-300 font-mono transition text-[11px] flex-shrink-0 cursor-pointer"
                  >
                    #{preset}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
