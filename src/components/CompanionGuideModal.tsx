import React, { useState } from 'react';
import { BookOpen, X, Layers, UserCheck, ShieldAlert, Wrench, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface CompanionGuideModalProps {
  onClose: () => void;
}

export const CompanionGuideModal: React.FC<CompanionGuideModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<number>(0);

  const sections = [
    {
      title: '1. Разделение: Стол и Приложение',
      icon: '🏢',
      content: (
        <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-700/50 text-blue-200">
            <strong>Принцип:</strong> Приложение — это стратегический центр комплекса, а не микротрекер фигурок.
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-300">
            <li><strong>На столе:</strong> миниатюры персонажей, кабина лифта, фишки зараженных (1–3), жетоны шума (0–3) и карточки в руках игроков.</li>
            <li><strong>В приложении:</strong> общий вертикальный разрез здания, реальные аварии, таймер до рассвета (8 раундов), состояние энергосети и проверка QR-карт.</li>
            <li>Приложение <em>не отслеживает</em> точные координаты игроков и не требует выбирать «чей сейчас ход» на экране.</li>
          </ul>
        </div>
      )
    },
    {
      title: '2. Что происходит за раунд (Лимит действий)',
      icon: '⏱️',
      content: (
        <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-700/50 text-amber-200">
            <strong>Правило хода:</strong> Каждый игрок в свой ход может сделать:
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#172230] border border-[#2b3c4f]">
              <span className="text-amber-400 font-bold block mb-1">1. ПЕРЕМЕЩЕНИЕ</span>
              <span>1 раз на лифте (на любой этаж при свете) или по лестнице на 1 соседний этаж.</span>
            </div>
            <div className="p-3 rounded-xl bg-[#172230] border border-[#2b3c4f]">
              <span className="text-cyan-400 font-bold block mb-1">2. ДО 2 ДЕЙСТВИЙ</span>
              <span>Обыск стопки этажа, работа с объектом, бой, отвлечение или пульт диспетчерской.</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Передышка заменяет оба действия и позволяет восстановить силы.
          </p>
        </div>
      )
    },
    {
      title: '3. Применение карт и решение задач',
      icon: '🔧',
      content: (
        <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
          <p className="text-xs">
            Для взаимодействия с объектом выберите его на экране и отсканируйте <strong>1 или 2 карточки</strong> (либо введите короткий номер):
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-300">
            <li><strong>Ничего не сгорает сразу:</strong> до нажатия «Подтвердить» ваши карточки остаются в руках.</li>
            <li><strong>Мультивариантность:</strong> каждую ключевую аварию можно устранить несколькими способами (капитальный ремонт, временное сдерживание или отсечение участка).</li>
            <li><strong>Прозрачная цена:</strong> на экране сразу видно, какие предметы сбросить, получит ли инструмент износ и сколько шума поставить на стол.</li>
            <li><strong>Помощь:</strong> некоторые действия требуют присутствия второго игрока на том же этаже (проверяется игроками на столе).</li>
          </ul>
        </div>
      )
    },
    {
      title: '4. Конец раунда и фаза угроз',
      icon: '💀',
      content: (
        <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
          <p className="text-xs">
            Когда все игроки сделали ходы, нажмите <strong>«Завершить раунд»</strong> на общем плане:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-xs text-gray-300">
            <li><strong>Движение по шуму:</strong> зараженные идут туда, где шум выше. При равенстве — поднимаются <em>ВВЕРХ</em>.</li>
            <li><strong>Столкновения:</strong> сброс боевых карт за каждую группу, либо Травма (1 действие в следующий ход) и отступление.</li>
            <li><strong>Появление новых групп:</strong> +1 группа на 1-м этаже (и еще +1, если на каком-то этаже накопилось 3 шума).</li>
            <li><strong>Сброс шума и откат:</strong> все маркеры шума на столе убираются, игроки возвращают по 1 карте из сброса.</li>
          </ol>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-[#121922] border-2 border-amber-600/60 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-left overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#223040] pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-950 border border-amber-600/60 rounded-2xl text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                РУКОВОДСТВО К ПРИЛОЖЕНИЮ
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-mono">
                Краткая инструкция
              </h2>
            </div>
          </div>

          <button
            data-testid="guide-close-x-btn"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-[#1a2533] hover:bg-[#253549] text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {sections.map((sec, idx) => (
            <button
              key={idx}
              onClick={() => {
                sound.playClick();
                setActiveSection(idx);
              }}
              className={`p-2 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider text-center transition flex flex-col items-center justify-center space-y-1 ${
                activeSection === idx
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/60 border border-amber-400'
                  : 'bg-[#182330] text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              <span className="text-base">{sec.icon}</span>
              <span className="truncate w-full">{sec.title.split('.')[1] || sec.title}</span>
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="p-5 rounded-2xl bg-[#16202c] border border-[#27384b] min-h-[220px]">
          <h3 className="text-base font-bold text-white font-mono mb-3 flex items-center space-x-2">
            <span>{sections[activeSection].icon}</span>
            <span>{sections[activeSection].title}</span>
          </h3>
          {sections[activeSection].content}
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 pt-4 border-t border-[#223040] flex items-center justify-between">
          <div className="text-xs font-mono text-gray-500">
            Шаг {activeSection + 1} из {sections.length}
          </div>

          <div className="flex items-center space-x-2">
            {activeSection < sections.length - 1 ? (
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveSection(activeSection + 1);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition"
              >
                Далее →
              </button>
            ) : (
              <button
                data-testid="guide-close-btn"
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Понятно! К игре
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
