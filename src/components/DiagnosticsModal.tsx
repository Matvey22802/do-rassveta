import React, { useState, useRef, useEffect } from 'react';
import { Camera, Volume2, Monitor, CheckCircle2, AlertTriangle, X, Play, RefreshCw, Smartphone } from 'lucide-react';
import { sound } from '../utils/audio';
import { narrator } from '../utils/narrator';

interface DiagnosticsModalProps {
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'audio' | 'screen'>('camera');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [testedAudio, setTestedAudio] = useState<Record<string, boolean>>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera preview
  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (!isMounted) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
        setCameraError(null);
      } catch (err: unknown) {
        if (!isMounted) return;
        setHasCameraPermission(false);
        setCameraError(err instanceof Error ? err.message : 'Камера недоступна');
      }
    }

    if (activeTab === 'camera') {
      initCamera();
    }

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode, activeTab]);

  const testSoundEffect = (key: string, fn: () => void) => {
    fn();
    setTestedAudio((prev) => ({ ...prev, [key]: true }));
  };

  const testVoice = () => {
    narrator.speak('Внимание! Проверка синтезатора речи завершена успешно. Комплекс готов к партии.');
    setTestedAudio((prev) => ({ ...prev, voice: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-[#121922] border-2 border-cyan-700/60 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-left overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#223040] pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-cyan-950 border border-cyan-600/60 rounded-2xl text-cyan-400">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                ДИАГНОСТИКА ОБОРУДОВАНИЯ
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-mono">
                Проверка камеры, звука и ТВ
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-[#1a2533] hover:bg-[#253549] text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => setActiveTab('camera')}
            className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition ${
              activeTab === 'camera'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/60'
                : 'bg-[#182330] text-gray-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Камера (QR)</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition ${
              activeTab === 'audio'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/60'
                : 'bg-[#182330] text-gray-400 hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Звук и Голос</span>
          </button>

          <button
            onClick={() => setActiveTab('screen')}
            className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition ${
              activeTab === 'screen'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/60'
                : 'bg-[#182330] text-gray-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Экран / ТВ</span>
          </button>
        </div>

        {/* Tab 1: Camera Test */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-[#2b3c4f] flex items-center justify-center">
              {hasCameraPermission ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-dashed border-cyan-400/80 rounded-2xl flex items-center justify-center">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 bg-black/60 px-2 py-0.5 rounded">
                        Зона считывания QR
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                  <p className="text-sm text-gray-300">
                    {cameraError || 'Камера не подключена или доступ заблокирован браузером.'}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    Приложение поддерживает ручной ввод номеров карточек при отсутствии камеры.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {hasCameraPermission ? 'Видеопоток активен' : 'Доступен ручной ввод'}
                </span>
              </span>

              {hasCameraPermission && (
                <button
                  onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                  className="px-3 py-1.5 rounded-lg bg-[#1a2533] hover:bg-[#253549] text-xs font-mono text-cyan-300 flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Переключить камеру</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Audio Test */}
        {activeTab === 'audio' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-mono mb-2">
              Проверьте громкость встроенных динамиков или колонок телевизора/проектора:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => testSoundEffect('click', () => sound.playClick())}
                className="p-3 rounded-xl bg-[#16202c] hover:bg-[#1d2a3a] border border-[#26374a] text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white font-mono">1. Тактильный щелчок</div>
                  <div className="text-[10px] text-gray-400">Нажатия кнопок</div>
                </div>
                {testedAudio.click && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                onClick={() => testSoundEffect('success', () => sound.playSuccess())}
                className="p-3 rounded-xl bg-[#16202c] hover:bg-[#1d2a3a] border border-[#26374a] text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-emerald-300 font-mono">2. Успех сканирования</div>
                  <div className="text-[10px] text-gray-400">Принятие карты QR</div>
                </div>
                {testedAudio.success && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                onClick={() => testSoundEffect('powerDown', () => sound.playPowerDown())}
                className="p-3 rounded-xl bg-[#16202c] hover:bg-[#1d2a3a] border border-[#26374a] text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-amber-300 font-mono">3. Авария питания</div>
                  <div className="text-[10px] text-gray-400">Блэкаут и остановка лифта</div>
                </div>
                {testedAudio.powerDown && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                onClick={() => testSoundEffect('alarm', () => sound.playAlarm())}
                className="p-3 rounded-xl bg-[#16202c] hover:bg-[#1d2a3a] border border-[#26374a] text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-red-400 font-mono">4. Сирена тревоги</div>
                  <div className="text-[10px] text-gray-400">Наступление часа угроз</div>
                </div>
                {testedAudio.alarm && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>

            <button
              onClick={testVoice}
              className="w-full mt-2 py-3 rounded-xl bg-[#1a2533] hover:bg-[#253549] border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition"
            >
              <Volume2 className="w-4 h-4" />
              <span>🔊 Проверить дикторский голос (TTS)</span>
            </button>
          </div>
        )}

        {/* Tab 3: Screen / TV Ready */}
        {activeTab === 'screen' && (
          <div className="space-y-4 text-sm text-gray-300">
            <div className="p-4 rounded-2xl bg-[#16202c] border border-[#26374a] space-y-2.5">
              <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase">
                <Monitor className="w-4 h-4" />
                <span>Рекомендации для общего экрана</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-300">
                1. <strong>Вывод на телевизор / проектор:</strong> откройте эту страницу в браузере и нажмите <kbd className="bg-black/50 px-1.5 py-0.5 rounded text-amber-300">F11</kbd> или кнопку «Полный экран» в правом верхнем углу.
              </p>
              <p className="text-xs leading-relaxed text-gray-300">
                2. <strong>Блокировка сна:</strong> приложение автоматически удерживает экран включенным (Wake Lock API), устройство не уснет во время партии.
              </p>
              <p className="text-xs leading-relaxed text-gray-300">
                3. <strong>Планшет у стола:</strong> если устройство используется как общий стол-планшет, расположите его на торце игрового поля рядом с колодами этажей.
              </p>
            </div>

            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
              }}
              className="w-full py-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-xs font-bold uppercase tracking-wider transition flex items-center justify-center space-x-2"
            >
              <Monitor className="w-4 h-4" />
              <span>Включить полноэкранный режим</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#223040] flex justify-end">
          <button
            data-testid="diagnostics-close-btn"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
