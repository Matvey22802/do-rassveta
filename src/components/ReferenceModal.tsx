import React, { useState } from 'react';
import { Character, CardItem, PersonalGoal, TraumaCard } from '../types/game';
import {
  X,
  Users,
  BookOpen,
  Target,
  HeartPulse,
  Zap,
  Shield,
  KeyRound,
  Sparkles,
  BookMarked,
  Volume2,
  Radio,
  RotateCcw,
  Package,
  Wrench
} from 'lucide-react';
import { sound } from '../utils/audio';

interface ReferenceModalProps {
  initialTab?: 'characters' | 'catalog' | 'goals' | 'traumas' | 'rules';
  characters: Character[];
  cardCatalog: CardItem[];
  personalGoals: PersonalGoal[];
  traumaCards: TraumaCard[];
  onClose: () => void;
}

export const ReferenceModal: React.FC<ReferenceModalProps> = ({
  initialTab = 'rules',
  characters,
  cardCatalog,
  personalGoals,
  traumaCards,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'catalog' | 'goals' | 'traumas' | 'rules'>(initialTab);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(characters[0]?.id || '');

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId) || characters[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#121922] border border-[#27384a] rounded-3xl max-w-5xl w-full h-[88vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header with Navigation Tabs */}
        <div className="p-4 sm:p-5 border-b border-[#223040] flex items-center justify-between bg-[#151f2b]">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {/* Rules Tab */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('rules');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-[#1e2a38] text-[#8b949e] hover:text-white'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Правила игры (Система)</span>
            </button>

            {/* Characters Tab */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('characters');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer ${
                activeTab === 'characters'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                  : 'bg-[#1e2a38] text-[#8b949e] hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Герои ({characters.length})</span>
            </button>

            {/* Catalog Tab */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('catalog');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30'
                  : 'bg-[#1e2a38] text-[#8b949e] hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Каталог предметов</span>
            </button>

            {/* Goals Tab */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('goals');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer ${
                activeTab === 'goals'
                  ? 'bg-emerald-400 text-black shadow-lg shadow-emerald-400/30'
                  : 'bg-[#1e2a38] text-[#8b949e] hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Личные цели</span>
            </button>

            {/* Traumas Tab */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('traumas');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer ${
                activeTab === 'traumas'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-[#1e2a38] text-[#8b949e] hover:text-white'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Травмы</span>
            </button>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-[#212d3b] hover:bg-[#2b3a4a] text-[#8b949e] hover:text-white transition ml-2 flex-shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-6 text-left">
          {/* TAB 0: OFFICIAL GAME SYSTEM RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-6 text-xs sm:text-sm font-mono text-gray-300">
              {/* Introduction Banner */}
              <div className="p-4 rounded-2xl bg-[#15202c] border border-cyan-500/60">
                <h3 className="text-base font-black text-white font-mono uppercase mb-1">
                  «ДО РАССВЕТА»: ОБЩАЯ СИСТЕМА ИГРЫ
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Игроки оказываются в многоэтажном комплексе в первые часы катастрофы. Задача команды: подготовить спасение и выбраться до рассвета (8 раундов), пока аварии и заражённые ограничивают возможности.
                </p>
              </div>

              {/* 1. Стол и приложение */}
              <div className="p-4 rounded-2xl bg-[#141d27] border border-gray-700 space-y-2">
                <div className="text-amber-400 font-bold uppercase flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>1. Стол и приложение</span>
                </div>
                <p className="leading-relaxed">
                  • <b>На физическом столе</b>: постоянно виден вертикальный план здания. На нём находятся миниатюры персонажей, общая кабина лифта, группы заражённых, жетоны шума и стопки этажей.
                </p>
                <p className="leading-relaxed">
                  • <b>В приложении</b>: показывается общий срез здания, состояние электросети, аварии, время и сюжетные события. Приложение проверяет применение карт с QR и сохраняет изменения объектов.
                </p>
                <p className="leading-relaxed text-gray-400">
                  ⚠️ Приложение не отслеживает положение персонажей, физические перемещения заражённых и карты в руках. Выбирать активного игрока на экране не требуется.
                </p>
              </div>

              {/* 2. Раунд и ходы */}
              <div className="p-4 rounded-2xl bg-[#141d27] border border-gray-700 space-y-2">
                <div className="text-cyan-400 font-bold uppercase flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span>2. Что происходит за раунд (Лимит 2 действий)</span>
                </div>
                <p className="leading-relaxed">
                  В начале раунда команда видит текущие угрозы, обсуждает план и порядок ходов.
                </p>
                <p className="leading-relaxed">
                  Каждый игрок в свой ход:
                </p>
                <ul className="pl-4 space-y-1 list-disc">
                  <li>Может <b>один раз переместиться</b> (лифт / лестница) или остаться на месте.</li>
                  <li>Выполняет <b>до 2 действий</b> на своём этаже (обыск стопки, работа с объектом, бой с группой, намеренное отвлечение, функция диспетчерской).</li>
                  <li><b>Передышка</b>: заменяет оба действия и возвращает все карты из обычного Отката в руку.</li>
                </ul>
                <p className="text-gray-400 text-xs">
                  После ходов всех игроков разрешается движение и атаки заражённых, появление новых угроз и восстановление карт.
                </p>
              </div>

              {/* 3. Лифт и лестницы */}
              <div className="p-4 rounded-2xl bg-[#141d27] border border-gray-700 space-y-2">
                <div className="text-amber-400 font-bold uppercase flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>3. Лифт и лестница</span>
                </div>
                <p className="leading-relaxed">
                  • <b>При работающем питании (220V)</b>:
                </p>
                <ul className="pl-4 space-y-1 list-disc">
                  <li>Можно использовать лестницу для перехода на соседний этаж (+/- 1).</li>
                  <li>Можно воспользоваться лифтом для переезда на <b>любой доступный этаж</b>.</li>
                  <li>Если кабина уже находится на этаже персонажа — он перемещается вместе с ней.</li>
                  <li><b>Если кабина находится в другом месте</b> — её вызов добавляет <b>1 шум на этаже вызывающего</b> (вызов входит в перемещение). Кабина остаётся на этаже прибытия!</li>
                </ul>
                <p className="leading-relaxed">
                  • <b>При отключении питания (Блэкаут)</b>: лифт замирает. Доступны только переходы пешком по лестнице на один соседний этаж (+/- 1).
                </p>
              </div>

              {/* 4. Исследование этажей */}
              <div className="p-4 rounded-2xl bg-[#141d27] border border-gray-700 space-y-2">
                <div className="text-emerald-400 font-bold uppercase flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>4. Исследование этажей (Стопки находок)</span>
                </div>
                <p className="leading-relaxed">
                  В каждой стопке <b>верхняя находка открыта</b>, остальные закрыты. Игрок видит, ради чего рискует, и выбирает способ взятия:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800">
                    <span className="text-cyan-300 font-bold block">Аккуратно (1 действие):</span>
                    <span>Отправляет подходящую карту навыка в Откат. Находка получена без шума.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800">
                    <span className="text-red-300 font-bold block">Напролом (1 действие):</span>
                    <span>Без расхода навыка, но добавляет <b>+1 шум на этом этаже</b>.</span>
                  </div>
                </div>
                <p className="text-gray-400 text-xs pt-1">
                  После взятия открывается следующая карта. Если это угроза/событие — разрешается немедленно.
                </p>
              </div>

              {/* 5 & 6. Предметы, решения и износ */}
              <div className="p-4 rounded-2xl bg-[#141d27] border border-gray-700 space-y-2">
                <div className="text-purple-400 font-bold uppercase flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <span>5 & 6. Предметы, инженерные решения и износ</span>
                </div>
                <p className="leading-relaxed">
                  Предметы имеют узнаваемое назначение и свойства (рычаг, герметизация, фиксация, ток, энергия).
                </p>
                <p className="leading-relaxed">
                  • <b>Многовариантность</b>: у существенной проблемы есть несколько подходов. Например, свищ магистрали на 11-м этаже:
                  <br />- <i>Полный ремонт (#103 Ремонтный хомут + #104 Резиновая накладка или #105 Изолента)</i>: устраняет утечку навсегда, сохраняет охлаждение генератора, 0 шума.
                  <br />- <i>Временная заплата (#104 Накладка + #106 Стяжки)</i>: сдерживает воду на 2 раунда.
                  <br />- <i>Перекрытие (#101 Газовый ключ)</i>: останавливает воду, но генератор без охлаждения отключается (блэкаут)!
                </p>
                <p className="leading-relaxed">
                  • <b>Износ</b>: <i>Расходный материал</i> исчезает после применения. <i>Многоразовый инструмент</i> сохраняется. <i>Мощные предметы</i> имеют ограниченное число применений (зарядов).
                </p>
              </div>

              {/* 7. Механика заражённых */}
              <div className="p-4 rounded-2xl bg-[#141d27] border border-gray-700 space-y-2">
                <div className="text-red-400 font-bold uppercase flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  <span>7. Механика заражённых (Шум и Движение)</span>
                </div>
                <p className="leading-relaxed">
                  • <b>Шум</b>: на каждом этаже накапливается от 0 до 3 жетонов шума на столе.
                </p>
                <p className="leading-relaxed">
                  • <b>Алгоритм движения</b>: каждая группа сравнивает шум на своём и двух соседних этажах:
                </p>
                <ul className="pl-4 space-y-1 list-disc text-gray-300">
                  <li>Если на соседнем этаже шум выше — группа переходит туда.</li>
                  <li>Если оба соседних одинаково громкие и громче текущего — выбирает <b>верхний</b>.</li>
                  <li>Если собственный этаж не тише соседних — остаётся на месте.</li>
                  <li><b>При полной тишине на всех 3 этажах</b> — поднимается на 1 этаж ВВЕРХ.</li>
                </ul>
                <p className="leading-relaxed">
                  • <b>Столкновения и Травма</b>: по 1 карте действия в Откат за каждую группу защищает весь этаж. Если карт нет или отступили — каждый герой получает <b>Травму</b> (в след. ходу выполняет 1 действие вместо 2) и отходит на соседний этаж.
                </p>
                <p className="leading-relaxed">
                  • <b>Спавн</b>: +1 группа на нижнем этаже (этаж 10 — Генераторная) после столкновений. Если хоть где-то было 3 шума — ещё +1 группа на 10-м этаже. После этого весь шум убирается со стола!
                </p>
              </div>

              {/* 8. Диспетчерская и совместные действия */}
              <div className="p-4 rounded-2xl bg-[#141d27] border border-gray-700 space-y-2">
                <div className="text-cyan-400 font-bold uppercase flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span>8. Совместные действия и Диспетчерская (Этаж 15)</span>
                </div>
                <p className="leading-relaxed">
                  • <b>Поддержка на своём этаже</b>: раз в раунд можно скинуть карту в Откат за чужое действие. Передача предметов при встрече — бесплатна.
                </p>
                <p className="leading-relaxed">
                  • <b>Диспетчерская (Этаж 15, при работающем питании 220V)</b>:
                  <br />1) <i>Разведка стопки</i> (1 действие): просмотр 2 верхних карт любой стопки на столе.
                  <br />2) <i>Аварийная сирена</i> (раз в раунд, сброс карты Техники 🔧): включить сирену на пустом этаже ➔ <b>+2 шума</b> на этом этаже, привлекая тварей!
                </p>
              </div>

              {/* 9. Карты и Откат */}
              <div className="p-4 rounded-2xl bg-[#141d27] border border-gray-700 space-y-2">
                <div className="text-emerald-400 font-bold uppercase flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>9. Карты действий и восстановление</span>
                </div>
                <p className="leading-relaxed">
                  У каждого игрока 3 карты действий. Обычное свойство отправляет карту в <b>Откат</b>. Сильное свойство («На перегруз») отправляет карту в <b>Глубокий откат</b>.
                </p>
                <p className="leading-relaxed">
                  В конце каждого раунда:
                  <br />1. Игрок возвращает <b>1 карту из обычного Отката в руку</b>.
                  <br />2. Затем переводит карты из <b>Глубокого отката в обычный Откат</b>.
                </p>
              </div>

              {/* 10. Пути спасения */}
              <div className="p-4 rounded-2xl bg-[#141d27] border border-gray-700 space-y-2">
                <div className="text-amber-400 font-bold uppercase flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>10. Условия спасения команды («Последний рейс», до рассвета — раунд 8)</span>
                </div>
                <p className="leading-relaxed">
                  • <b>1. Доступ на крышу</b>: вскрыть заклиненный люк на этаже 15 (рецепты H1..H5: сервисный ключ #101+#204, лом #102, верёвки #116+#117/#118, или ручной привод).
                </p>
                <p className="leading-relaxed">
                  • <b>2. Сигнал спасателям</b>: подтвердить радиосвязь через радиостанцию этажа 15 (с раунда 6, рецепты R1..R3) либо зажечь световой маяк на крыше (с раунда 7, рецепты O1..O2).
                </p>
                <p className="leading-relaxed">
                  • <b>3. Сбор и эвакуация</b>: все три персонажа должны собраться на этаже 15 (Диспетчерская / крыша), и на этаже 15 не должно быть групп заражённых.
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: CHARACTERS */}
          {activeTab === 'characters' && (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-64 space-y-2 flex-shrink-0">
                <div className="text-xs font-mono uppercase tracking-wider text-[#8b949e] mb-2">
                  Выберите персонажа ({characters.length} для демо):
                </div>
                {characters.map((char) => (
                  <div
                    key={char.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedCharacterId(char.id);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      char.id === selectedCharacter.id
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-md'
                        : 'bg-[#151e29] border-[#223040] hover:border-gray-500'
                    }`}
                  >
                    <div className="text-sm font-bold text-white font-mono">{char.name}</div>
                    <div className="text-xs text-[#8b949e]">{char.role}</div>
                  </div>
                ))}
              </div>

              {/* Selected Character Detail Card */}
              <div className="flex-1 bg-[#151f2b] border border-[#253648] rounded-2xl p-5 lg:p-6 shadow-inner">
                <div className="border-b border-[#233242] pb-4 mb-5">
                  <div className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                    ПЛАНШЕТ ПЕРСОНАЖА (3 КАРТЫ ДЕЙСТВИЯ)
                  </div>
                  <h2 className="text-2xl font-black text-white font-mono uppercase">
                    {selectedCharacter.name} — «{selectedCharacter.role}»
                  </h2>
                  <div className="mt-2 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-300">
                    <span className="font-bold uppercase font-mono mr-1">Пассивная способность:</span>
                    {selectedCharacter.perk}
                  </div>
                </div>

                <div className="text-xs font-mono uppercase tracking-wider text-[#8b949e] mb-3">
                  3 Карты действий в руке:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedCharacter.cards.map((card, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#101720] border border-[#202e3e] flex flex-col justify-between"
                    >
                      <div>
                        <div className="inline-block px-2 py-0.5 rounded bg-[#1e2a38] text-[11px] font-bold text-amber-300 font-mono mb-2">
                          {card.icon}
                        </div>
                        <h4 className="text-sm font-bold text-white font-mono mb-1">{card.name}</h4>
                        <p className="text-xs text-[#c9d1d9] leading-relaxed mb-3">
                          {card.standardEffect}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#1b2838] text-[11px] text-red-300/90 font-medium">
                        🔥 <b>Глубокий откат:</b> {card.overloadEffect}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CARD CATALOG WITH PROPERTIES & WEAR TYPE */}
          {activeTab === 'catalog' && (
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#8b949e] mb-3">
                Каталог физических карт с QR-кодами, свойствами и износом (#101–#206):
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {cardCatalog.map((card) => (
                  <div
                    key={card.code}
                    className="p-4 rounded-xl bg-[#151f2b] border border-[#243547] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded bg-amber-400 text-black font-mono font-bold text-xs">
                          #{card.code}
                        </span>
                        <h4 className="text-sm font-bold text-white font-mono">{card.name}</h4>
                        {card.wearType && (
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                            card.wearType === 'consumable'
                              ? 'bg-red-950 border border-red-500 text-red-300'
                              : card.wearType === 'limited'
                              ? 'bg-purple-950 border border-purple-500 text-purple-300'
                              : 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                          }`}>
                            {card.wearType === 'consumable' ? 'РАСХОДНИК' : card.wearType === 'limited' ? `${card.charges} ЗАРЯДА` : 'ИНСТРУМЕНТ'}
                          </span>
                        )}
                      </div>

                      {card.properties && card.properties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {card.properties.map((prop, pIdx) => (
                            <span key={pIdx} className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-[10px]">
                              {prop}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-[#c9d1d9] leading-relaxed mb-2">
                        {card.applicationDescription}
                      </p>

                      {card.discardEffect && (
                        <div className="text-[11px] text-amber-300/90 font-medium">
                          {card.discardEffect}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PERSONAL GOALS */}
          {activeTab === 'goals' && (
            <div className="space-y-4 max-w-3xl">
              <div className="p-5 rounded-2xl bg-[#15202c] border border-emerald-500/60 text-left">
                <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold text-sm uppercase mb-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <span>Принцип скрытых личных целей (Тайные мотивы)</span>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed mb-3">
                  В начале партии каждый игрок получает <b>одну закрытую карту Личной цели</b> из бумажной колоды мотивов на столе. Эта цель держится в тайне от других участников до конца игры.
                </p>
                <div className="space-y-2 text-xs font-mono text-gray-300">
                  <div className="p-3 rounded-xl bg-[#111822] border border-gray-700">
                    <span className="text-emerald-300 font-bold block mb-1">✓ Командная победа превыше всего:</span>
                    <span>Главная цель — эвакуация всей команды на крыше до рассвета (раунд 8). Если погибает команда или истекает время, проигрывают все.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#111822] border border-gray-700">
                    <span className="text-amber-300 font-bold block mb-1">⭐ Дополнительный личный успех:</span>
                    <span>Выполнение личного мотива приносит игроку индивидуальный триумф в финальном эпилоге, но <b>никогда не требует срыва командного спасения</b>.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#111822] border border-gray-700">
                    <span className="text-cyan-300 font-bold block mb-1">🤫 Сохранение тайны:</span>
                    <span>Формулировки целей не выводятся на общем экране, чтобы не раскрывать секреты напарникам. Карты остаются у игроков на руках и зачитываются вслух только при финальном подсчете результатов.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRAUMAS */}
          {activeTab === 'traumas' && (
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#8b949e] mb-3">
                Карты Травм (В первом прототипе: в след. ходу 1 действие вместо 2, затем снимается):
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {traumaCards.map((trauma) => (
                  <div
                    key={trauma.id}
                    className="p-5 rounded-2xl bg-[#1c1417] border border-red-900/60"
                  >
                    <div className="flex items-center space-x-2 text-red-400 font-mono font-bold text-base mb-2">
                      <HeartPulse className="w-5 h-5" />
                      <span>{trauma.title}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#f0f6fc] leading-relaxed mb-3">
                      {trauma.effect}
                    </p>
                    <div className="text-[11px] text-amber-300/80">
                      Снимается автоматически после хода с 1 действием, либо картой #103 / способностью Врача.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
