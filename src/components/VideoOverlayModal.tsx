import React, { useEffect } from 'react';
import { Film, Play, CheckCircle2, Sparkles, Volume2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface VideoOverlayModalProps {
  title: string;
  description: string;
  videoUrl?: string;
  color?: string;
  onClose: () => void;
}

export const VideoOverlayModal: React.FC<VideoOverlayModalProps> = ({
  title,
  description,
  videoUrl,
  color = 'amber',
  onClose
}) => {
  useEffect(() => {
    sound.playSuccess();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4">
      <div className="max-w-3xl w-full bg-[#0d141b] border-2 border-cyan-500/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
        {/* Cinema Viewport */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden scanline">
          {videoUrl ? (
            <video
              src={videoUrl}
              autoPlay
              controls
              className="w-full h-full object-cover"
              onEnded={onClose}
            />
          ) : (
            /* Procedural Cinematic Sequence for Prototype */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-t from-black via-[#0d1926] to-black">
              {/* Dynamic pulsing radar / circuit */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_2px,transparent_2px)] [background-size:24px_24px] animate-pulse"></div>

              <div className="p-5 rounded-full bg-cyan-950/80 border-2 border-cyan-400/80 text-cyan-300 shadow-2xl shadow-cyan-500/50 mb-4 animate-[bounce_3s_infinite]">
                <Film className="w-12 h-12" />
              </div>

              <div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase mb-2 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <span>ВИДЕОХРОНИКА СОБЫТИЯ • СИСТЕМА «АВРОРА»</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white font-mono uppercase text-center max-w-xl mb-3 tracking-wide">
                {title}
              </h2>

              <p className="text-sm sm:text-base text-[#c9d1d9] text-center max-w-lg leading-relaxed">
                {description}
              </p>

              {/* Timecode overlay */}
              <div className="absolute bottom-4 left-4 text-xs font-mono text-cyan-500/70">
                CAM_14 // REC // 1080p
              </div>
            </div>
          )}
        </div>

        {/* Footer info & close */}
        <div className="p-6 bg-[#121a24] border-t border-[#223040] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-[#8b949e]">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Состояние локации на карте успешно обновлено</span>
          </div>

          <button
            data-testid="continue-video-btn"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm uppercase tracking-wider transition shadow-lg shadow-cyan-900/50"
          >
            Продолжить партию
          </button>
        </div>
      </div>
    </div>
  );
};
