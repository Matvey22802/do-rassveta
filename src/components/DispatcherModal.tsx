import React, { useState } from 'react';
import {
  Radio,
  Eye,
  Bell,
  X,
  Zap,
  ZapOff,
  AlertTriangle,
  Volume2,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { sound } from '../utils/audio';

interface DispatcherModalProps {
  powerState: 'online' | 'warning' | 'blackout';
  onClose: () => void;
  onAddLog: (text: string, type?: 'action' | 'threat' | 'story' | 'system') => void;
}

interface FloorDeckPreview {
  floorNumber: number;
  name: string;
  topTwoCards: string[];
}

const FLOOR_DECKS: FloorDeckPreview[] = [
  {
    floorNumber: 6,
    name: 'Этаж 06: Крыша и Техсектор',
    topTwoCards: ['#101 Стальная монтировка (Инструмент)', '#104 Сварочный аппарат (2 заряда)']
  },
  {
    floorNumber: 5,
    name: 'Этаж 05: Архив и Кабинет',
    topTwoCards: ['#202 Чертеж вентилей и шахты (Инфо-карта)', '#102 Электронный пропуск охраны (Ключ)']
  },
  {
    floorNumber: 3,
    name: 'Этаж 03: Генераторная подстанция',
    topTwoCards: ['#204 Код аварийного шлюза (Инфо-карта)', '#103 Холодная сварка и заплатки (Расходник)']
  },
  {
    floorNumber: 1,
    name: 'Этаж 01: Медпункт (Апт 14А)',
    topTwoCards: ['#103 Аптечка первой помощи', '#106 Шприц с адреналином (Расходник)']
  }
];

export const DispatcherModal: React.FC<DispatcherModalProps> = ({
  powerState,
  onClose,
  onAddLog
}) => {
  const isOnline = powerState !== 'blackout';
  const [selectedDeckFloor, setSelectedDeckFloor] = useState<number | null>(null);
  const [sirenTargetFloor, setSirenTargetFloor] = useState<number>(5);
  const [sirenActiveFloor, setSirenActiveFloor] = useState<number | null>(null);

  // Trigger siren
  const handleActivateSiren = (floorNum: number) => {
    if (!isOnline) return;
    sound.playAlarm();
    setSirenActiveFloor(floorNum);
    onAddLog(
      `Диспетчерская: включена аварийная сирена на Этаже 0${floorNum}! На стол добавлено +2 жетона шума.`,
      'action'
    );
  };

  const currentInspectedDeck = FLOOR_DECKS.find((d) => d.floorNumber === selectedDeckFloor);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#101721] border-2 border-cyan-500/70 rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl text-left relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#203144] pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-mono font-black text-white uppercase tracking-wider">
                ДИСПЕТЧЕРСКИЙ ПУЛЬТ ОХРАНЫ // ЭТАЖ 04
              </h2>
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-gray-400">Системы координатора:</span>
                <span className={`px-2 py-0.2 rounded font-bold ${
                  isOnline ? 'bg-emerald-950 border border-emerald-500 text-emerald-300' : 'bg-red-950 border border-red-500 text-red-300'
                }`}>
                  {isOnline ? '⚡ 220V СЕТЬ АКТИВНА' : '🚨 ОБЕСТОЧЕНО'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-[#172332] hover:bg-[#203144] text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isOnline ? (
          /* Blackout Warning */
          <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/60 text-center my-6">
            <ZapOff className="w-12 h-12 text-red-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-lg font-mono font-bold text-red-300 mb-2">
              ПУЛЬТ ДИСПЕТЧЕРСКОЙ ОБЕСТОЧЕН
            </h3>
            <p className="text-sm font-mono text-gray-300 max-w-md mx-auto mb-4">
              Мониторы видеонаблюдения и сирена требуют работающего питания. Запустите Дизель-генератор на Этаже 03, чтобы восстановить связь.
            </p>
            <span className="px-3 py-1 rounded bg-black/60 border border-red-600/70 text-red-400 font-mono text-xs">
              Функции разведки и сирены временно недоступны
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. CCTV Deck Scout Feature */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#141e2b] border border-[#233549]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-mono font-bold text-sm text-cyan-300 uppercase tracking-wider">
                    1. Разведка стопки (Тратит 1 действие)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-gray-400">
                  Показывает 2 верхние карты выбранного этажа
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {FLOOR_DECKS.map((d) => (
                  <button
                    key={d.floorNumber}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedDeckFloor(d.floorNumber);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition flex flex-col items-center justify-center space-y-1 ${
                      selectedDeckFloor === d.floorNumber
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                        : 'bg-[#182635] hover:bg-[#203144] border-[#293d52] text-gray-300'
                    }`}
                  >
                    <span>ЭТАЖ 0{d.floorNumber}</span>
                    <span className="text-[10px] opacity-80">{d.name.split(':')[1]?.trim() || ''}</span>
                  </button>
                ))}
              </div>

              {/* Deck Preview Output */}
              {currentInspectedDeck ? (
                <div className="p-3.5 rounded-xl bg-black/60 border border-cyan-500/50">
                  <div className="text-xs font-mono font-bold text-cyan-400 mb-2 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>ВЕРХНИЕ КАРТЫ СТОПКИ НА СТОЛЕ:</span>
                  </div>
                  <div className="space-y-1.5">
                    {currentInspectedDeck.topTwoCards.map((cName, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-[#141f2c] border border-cyan-900/60 text-xs font-mono text-white flex items-center justify-between"
                      >
                        <span>{idx === 0 ? '1-я (верхняя)' : '2-я (следующая)'}: {cName}</span>
                        <span className="text-[10px] text-cyan-400 font-bold">ОТКРЫТО ДЛЯ СТОЛА</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs font-mono text-gray-500 italic text-center py-2">
                  Выберите этаж выше, чтобы просветить 2 верхние карты стопки
                </div>
              )}
            </div>

            {/* 2. Emergency Siren Decoy Feature */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#141e2b] border border-[#233549]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  <h3 className="font-mono font-bold text-sm text-amber-300 uppercase tracking-wider">
                    2. Аварийная сирена отвлечения (Раз в раунд)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-amber-400/90">
                  Требует карту Техники 🔧 в Откат на столе
                </span>
              </div>

              <p className="text-xs font-mono text-gray-300 mb-3 leading-relaxed">
                Включает громкую пожарную сирену на выбранном этаже. Добавляет туда <b>+2 жетона шума</b> на столе. В конце раунда группы заражённых побегут на звук сирены!
              </p>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-mono font-bold text-gray-400">Целевой этаж:</span>
                {[6, 5, 4, 3, 2, 1].map((fl) => (
                  <button
                    key={fl}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSirenTargetFloor(fl);
                    }}
                    className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition ${
                      sirenTargetFloor === fl
                        ? 'bg-amber-500 text-black border-amber-300 shadow-md font-black'
                        : 'bg-[#182635] hover:bg-[#203144] border-[#293d52] text-gray-300'
                    }`}
                  >
                    ЭТАЖ 0{fl}
                  </button>
                ))}
              </div>

              {sirenActiveFloor === sirenTargetFloor ? (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500 flex items-center justify-between animate-pulse">
                  <div className="flex items-center space-x-2 text-red-300 font-mono text-xs font-bold">
                    <Volume2 className="w-4 h-4 text-red-400 animate-spin" />
                    <span>СИРЕНА ВОЕТ НА ЭТАЖЕ 0{sirenActiveFloor}! ДОБАВЛЕНО +2 ШУМА НА СТОЛЕ.</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-300">АКТИВНО</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleActivateSiren(sirenTargetFloor)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 hover:from-amber-500 to-red-600 hover:to-red-500 text-white font-mono font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-98 flex items-center justify-center space-x-2"
                >
                  <Bell className="w-4 h-4" />
                  <span>ВКЛЮЧИТЬ СИРЕНУ НА ЭТАЖЕ 0{sirenTargetFloor} (+2 ШУМА)</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-[#1e2e40] flex items-center justify-between text-xs font-mono text-gray-400">
          <span>Секция 8 правил: Поддержка и функции Диспетчерской</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#1b2736] hover:bg-[#233346] text-white font-bold transition"
          >
            Закрыть пульт
          </button>
        </div>
      </div>
    </div>
  );
};
