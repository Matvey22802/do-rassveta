import React, { useState, useEffect, useCallback } from 'react';
import { scenarioChapter1 } from './data/scenarioChapter1';
import {
  Scenario,
  ScenarioVariant,
  LogEntry,
  ActionSnapshot,
  GameState,
  InteractionRecipe,
  LeakStatus,
  RescueSignalType,
  IrinaStatus
} from './types/game';
import { RoomHeroView } from './components/RoomHeroView';
import { StartMenuModal } from './components/StartMenuModal';
import { EndGameModal } from './components/EndGameModal';
import { LogsDrawer } from './components/LogsDrawer';
import { ReferenceModal } from './components/ReferenceModal';
import { EndOfRoundModal } from './components/EndOfRoundModal';
import { sound } from './utils/audio';
import { requestScreenWakeLock, releaseScreenWakeLock } from './utils/wakeLock';
import { applyInteraction } from './utils/interactionEngine';
import {
  OFFICIAL_CHARACTERS,
  OFFICIAL_ROUNDS,
  OFFICIAL_FLOORS
} from './data/officialScenario';

const STORAGE_KEY = 'do_rassveta_save_state_v2';

export const App: React.FC = () => {
  const scenario: Scenario = scenarioChapter1;

  // 1. Core Official Game State (ДО РАССВЕТА: ПОСЛЕДНИЙ РЕЙС)
  const [variant, setVariant] = useState<ScenarioVariant>('variantA');
  const [currentHour, setCurrentHour] = useState<number>(1); // Раунд 1..8
  const [maxHours] = useState<number>(8);

  const [power, setPower] = useState<boolean>(true); // Электросеть здания 220V
  const [leakStatus, setLeakStatus] = useState<LeakStatus>('leak'); // Утечка на этаже 11
  const [leakDeadlineRound, setLeakDeadlineRound] = useState<number>(3); // Раунд 3
  const [temporaryPatchUsed, setTemporaryPatchUsed] = useState<boolean>(false);

  const [roofHatchOpen, setRoofHatchOpen] = useState<boolean>(false); // Люк на крышу (этаж 15)
  const [rescueSignal, setRescueSignal] = useState<RescueSignalType>('none'); // Радио (р.6+) или свет (р.7+)
  const [irinaStatus, setIrinaStatus] = useState<IrinaStatus>('waiting'); // Диспетчер Ирина на этаже 14
  const [doorReinforced, setDoorReinforced] = useState<boolean>(false); // Пожарная дверь крыла (этаж 14)
  const [reservePower, setReservePower] = useState<boolean>(false); // Резервный пульт сирен (этаж 15)
  const [journalTransmitted, setJournalTransmitted] = useState<boolean>(false); // Журнал 206 передан

  // Item durability tracker (2 uses for 101, 102, 108, 111, 115, 116)
  const [itemDurabilities, setItemDurabilities] = useState<Record<string, number>>({
    '101': 2,
    '102': 2,
    '108': 2,
    '111': 2,
    '115': 2,
    '116': 2
  });

  const [consumedItems, setConsumedItems] = useState<string[]>([]);
  const [resolvedInteractions, setResolvedInteractions] = useState<string[]>([]);

  // Starting location: Survivors and lift cabin start on Floor 13!
  const [cabinFloor, setCabinFloor] = useState<number>(13);
  const [activeFloorNum, setActiveFloorNum] = useState<number>(13);

  // Noise and Zombies tracking per floor (10..15)
  const [noisePerFloor, setNoisePerFloor] = useState<Record<number, number>>({
    10: 0,
    11: 0,
    12: 0,
    13: 0,
    14: 0,
    15: 0
  });

  const [zombiesPerFloor, setZombiesPerFloor] = useState<Record<number, number>>({
    10: 1, // 1 группа на 10-м со старта
    11: 0,
    12: 1, // 1 группа на 12-м со старта
    13: 0,
    14: 0,
    15: 0
  });

  const [traumas, setTraumas] = useState<Record<string, boolean>>({});
  const [personalGoals, setPersonalGoals] = useState<Record<string, string>>({
    lera_engineer: 'G1',
    mark_rescuer: 'G3',
    nika_medic: 'G5'
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [gamePhase, setGamePhase] = useState<'intro' | 'board' | 'game_over'>('intro');
  const [gameOutcome, setGameOutcome] = useState<'victory' | 'defeat' | null>(null);

  // Undo Snapshot
  const [lastActionSnapshot, setLastActionSnapshot] = useState<ActionSnapshot | null>(null);

  // Saved Game Detection
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(false);
  const [savedGameHour, setSavedGameHour] = useState<number | undefined>(undefined);

  // Modals state
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [referenceTab, setReferenceTab] = useState<'characters' | 'catalog' | 'goals' | 'traumas' | 'rules' | null>(null);
  const [isEndOfRoundOpen, setIsEndOfRoundOpen] = useState<boolean>(false);
  const [endOfRoundStep, setEndOfRoundStep] = useState<number>(1);

  // Screen WakeLock
  useEffect(() => {
    requestScreenWakeLock();
    return () => {
      releaseScreenWakeLock();
    };
  }, []);

  // Check for saved game in LocalStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.currentRound) {
          setHasSavedGame(true);
          setSavedGameHour(parsed.currentRound);
        }
      } catch {
        setHasSavedGame(false);
      }
    }
  }, []);

  // Save full game state to LocalStorage
  const persistState = useCallback((overrides: Partial<GameState> = {}) => {
    try {
      const stateToSave = {
        variant,
        currentRound: currentHour,
        maxRounds: maxHours,
        power,
        leakStatus,
        leakDeadlineRound,
        temporaryPatchUsed,
        roofHatchOpen,
        rescueSignal,
        irinaStatus,
        doorReinforced,
        reservePower,
        journalTransmitted,
        itemDurabilities,
        consumedItems,
        resolvedInteractions,
        activeFloorNum,
        cabinFloor,
        noisePerFloor,
        zombiesPerFloor,
        logs,
        endOfRoundStep,
        outcome: gameOutcome,
        ...overrides
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      setHasSavedGame(true);
      setSavedGameHour(stateToSave.currentRound);
    } catch (e) {
      console.error('Failed to save game state', e);
    }
  }, [
    variant,
    currentHour,
    maxHours,
    power,
    leakStatus,
    leakDeadlineRound,
    temporaryPatchUsed,
    roofHatchOpen,
    rescueSignal,
    irinaStatus,
    doorReinforced,
    reservePower,
    journalTransmitted,
    itemDurabilities,
    consumedItems,
    resolvedInteractions,
    activeFloorNum,
    cabinFloor,
    noisePerFloor,
    zombiesPerFloor,
    logs,
    endOfRoundStep,
    gameOutcome
  ]);

  // Logging helper
  const addLog = useCallback(
    (text: string, type: LogEntry['type'] = 'action') => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newEntry: LogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        hour: currentHour,
        time: timeStr,
        text,
        type
      };
      setLogs((prev) => [newEntry, ...prev]);
    },
    [currentHour]
  );

  // Construct current GameState bundle
  const currentGameState: GameState = {
    variant,
    currentRound: currentHour,
    maxRounds: maxHours,
    power,
    leakStatus,
    leakDeadlineRound,
    temporaryPatchUsed,
    roofHatchOpen,
    rescueSignal,
    irinaStatus,
    doorReinforced,
    reservePower,
    journalTransmitted,
    itemDurabilities,
    consumedItems,
    resolvedInteractions,
    activeFloorNum,
    cabinFloor,
    noisePerFloor,
    zombiesPerFloor,
    characters: OFFICIAL_CHARACTERS,
    personalGoals,
    traumas,
    logs,
    lastActionSnapshot,
    outcome: gameOutcome
  };

  // Toggle Power (strictly for service/debug tests)
  const handleTogglePower = () => {
    if (power) {
      sound.playPowerDown();
      setPower(false);
      addLog('Электросеть 220V отключена. Лифт заблокирован.', 'threat');
    } else {
      sound.playPowerUp();
      setPower(true);
      addLog('Электросеть 220V включена.', 'action');
    }
    persistState({ power: !power });
  };

  // Apply Interaction Recipe (from Action Drawer)
  const handleApplyRecipe = (
    recipe: InteractionRecipe,
    calculatedNoise: number,
    isHeavyTech?: boolean
  ) => {
    // 1. Take snapshot for Undo
    const snapshot: ActionSnapshot = {
      timestamp: Date.now(),
      description: `Применение [${recipe.code}] ${recipe.name}`,
      stateDump: JSON.stringify(currentGameState)
    };
    setLastActionSnapshot(snapshot);

    // 2. Execute deterministic state mutation
    const updated = applyInteraction(recipe, currentGameState, {
      calculatedNoise,
      targetFloor: activeFloorNum,
      isHeavyTech
    });

    setPower(updated.power);
    setLeakStatus(updated.leakStatus);
    setLeakDeadlineRound(updated.leakDeadlineRound);
    setTemporaryPatchUsed(updated.temporaryPatchUsed);
    setRoofHatchOpen(updated.roofHatchOpen);
    setRescueSignal(updated.rescueSignal);
    setIrinaStatus(updated.irinaStatus);
    setDoorReinforced(updated.doorReinforced);
    setReservePower(updated.reservePower);
    setJournalTransmitted(updated.journalTransmitted);
    setItemDurabilities(updated.itemDurabilities);
    setConsumedItems(updated.consumedItems);
    setResolvedInteractions(updated.resolvedInteractions);
    setNoisePerFloor(updated.noisePerFloor);

    // Log the transaction
    addLog(`[${recipe.code}] ${recipe.name}: ${recipe.resultText}`, 'action');
    if (calculatedNoise > 0) {
      addLog(`Шум +${calculatedNoise} на этаже ${recipe.targetFloor || activeFloorNum}!`, 'threat');
    }

    persistState({
      power: updated.power,
      leakStatus: updated.leakStatus,
      leakDeadlineRound: updated.leakDeadlineRound,
      temporaryPatchUsed: updated.temporaryPatchUsed,
      roofHatchOpen: updated.roofHatchOpen,
      rescueSignal: updated.rescueSignal,
      irinaStatus: updated.irinaStatus,
      doorReinforced: updated.doorReinforced,
      reservePower: updated.reservePower,
      journalTransmitted: updated.journalTransmitted,
      itemDurabilities: updated.itemDurabilities,
      consumedItems: updated.consumedItems,
      resolvedInteractions: updated.resolvedInteractions,
      noisePerFloor: updated.noisePerFloor
    });
  };

  // Undo Last Action
  const handleUndo = () => {
    if (!lastActionSnapshot) return;
    try {
      sound.playClick();
      const prev: GameState = JSON.parse(lastActionSnapshot.stateDump);
      setPower(prev.power);
      setLeakStatus(prev.leakStatus);
      setLeakDeadlineRound(prev.leakDeadlineRound);
      setTemporaryPatchUsed(prev.temporaryPatchUsed);
      setRoofHatchOpen(prev.roofHatchOpen);
      setRescueSignal(prev.rescueSignal);
      setIrinaStatus(prev.irinaStatus);
      setDoorReinforced(prev.doorReinforced);
      setReservePower(prev.reservePower);
      setJournalTransmitted(prev.journalTransmitted);
      setItemDurabilities(prev.itemDurabilities);
      setConsumedItems(prev.consumedItems);
      setResolvedInteractions(prev.resolvedInteractions);
      setNoisePerFloor(prev.noisePerFloor);
      setLastActionSnapshot(null);
      addLog('↩ Отменено последнее действие. На столе: верните карточки в руку и восстановите 1 действие.', 'undo');
      persistState(prev);
    } catch {
      // Ignore
    }
  };

  // Advance Round (Resolves End-of-Round threats and round transition)
  const handleAdvanceRound = (hadThreeNoise = false) => {
    setLastActionSnapshot(null); // Undo cannot cross round boundaries

    if (currentHour >= maxHours) {
      // Out of time: Defeat at dawn
      sound.playAlarm();
      setGameOutcome('defeat');
      setGamePhase('game_over');
      addLog('Рассвет наступил! Команда не успела эвакуироваться до рассвета. Поражение.', 'threat');
      persistState({ outcome: 'defeat' });
      return;
    }

    const nextRound = currentHour + 1;
    setCurrentHour(nextRound);

    // Crisis Resolution at Round Boundaries
    let nextPower = power;
    let nextDoor = doorReinforced;
    let nextIrina = irinaStatus;

    // End of Round 3: Pipe leak cuts power
    if (currentHour === 3) {
      if (leakStatus === 'leak') {
        nextPower = false;
        setPower(false);
        sound.playPowerDown();
        addLog('Конец раунда 3: Охлаждение не починено! Генератор аварийно обесточен (БЛЭКАУТ). Лифт выключен.', 'threat');
      }
      if (!doorReinforced) {
        addLog('Раунд 4: Прорыв закрытого крыла на 14-м этаже! Добавьте +2 группы зомби на 14-й этаж на столе.', 'threat');
        setZombiesPerFloor((prev) => ({
          ...prev,
          14: (prev[14] || 0) + 2
        }));
      }
    }

    // End of Round 5: Irina deadline
    if (currentHour === 5) {
      if (irinaStatus === 'waiting') {
        nextIrina = 'lost';
        setIrinaStatus('lost');
        addLog('Конец раунда 5: Время оказания помощи истекло. Диспетчер Ирина скончалась от ран.', 'threat');
      }
    }

    // Reinforcements to Floor 10
    const extraZombie = hadThreeNoise ? 2 : 1;
    setZombiesPerFloor((prev) => ({
      ...prev,
      10: (prev[10] || 0) + extraZombie
    }));
    addLog(`Раунд ${nextRound}: Начало нового раунда. +${extraZombie} группа зомби на 10-м этаже на столе.`, 'threat');

    // Reset End of Round modal progress
    setEndOfRoundStep(1);
    setIsEndOfRoundOpen(false);

    persistState({
      currentRound: nextRound,
      power: nextPower,
      irinaStatus: nextIrina,
      endOfRoundStep: 1
    });
  };

  // Perform Evacuation Action (Victory!)
  const handlePerformEvacuation = () => {
    // Exact Conditions Check
    if (!roofHatchOpen) {
      alert('Люк на вертолетную площадку крыши закрыт! Сначала откройте люк на 15-м этаже.');
      return;
    }
    if (rescueSignal === 'none') {
      alert('Спасательный борт не вызван! Установите радиосвязь (с раунда 6) или подайте световой маяк (с раунда 7).');
      return;
    }
    if (rescueSignal === 'radio' && currentHour < 6) {
      alert(`Спасательный вертолет войдет в зону только в раунде 6! Сейчас идет раунд ${currentHour}.`);
      return;
    }
    if (rescueSignal === 'light' && currentHour < 7) {
      alert(`Световой патруль спасателей появится только в раунде 7! Сейчас идет раунд ${currentHour}.`);
      return;
    }

    sound.playSuccess();
    setGameOutcome('victory');
    setGamePhase('game_over');
    addLog(`Победа! Команда выполнила эвакуацию на вертолете в раунде ${currentHour}!`, 'story');
    persistState({ outcome: 'victory' });
  };

  // Resume game from LocalStorage
  const handleResumeGame = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (saved) {
        if (saved.currentRound) setCurrentHour(saved.currentRound);
        if (saved.power !== undefined) setPower(saved.power);
        if (saved.leakStatus) setLeakStatus(saved.leakStatus);
        if (saved.leakDeadlineRound) setLeakDeadlineRound(saved.leakDeadlineRound);
        if (saved.temporaryPatchUsed !== undefined) setTemporaryPatchUsed(saved.temporaryPatchUsed);
        if (saved.roofHatchOpen !== undefined) setRoofHatchOpen(saved.roofHatchOpen);
        if (saved.rescueSignal) setRescueSignal(saved.rescueSignal);
        if (saved.irinaStatus) setIrinaStatus(saved.irinaStatus);
        if (saved.doorReinforced !== undefined) setDoorReinforced(saved.doorReinforced);
        if (saved.reservePower !== undefined) setReservePower(saved.reservePower);
        if (saved.journalTransmitted !== undefined) setJournalTransmitted(saved.journalTransmitted);
        if (saved.itemDurabilities) setItemDurabilities(saved.itemDurabilities);
        if (saved.consumedItems) setConsumedItems(saved.consumedItems);
        if (saved.resolvedInteractions) setResolvedInteractions(saved.resolvedInteractions);
        if (saved.activeFloorNum) setActiveFloorNum(saved.activeFloorNum);
        if (saved.cabinFloor) setCabinFloor(saved.cabinFloor);
        if (saved.noisePerFloor) setNoisePerFloor(saved.noisePerFloor);
        if (saved.zombiesPerFloor) setZombiesPerFloor(saved.zombiesPerFloor);
        if (saved.logs) setLogs(saved.logs);
        if (saved.endOfRoundStep) setEndOfRoundStep(saved.endOfRoundStep);
        if (saved.outcome) setGameOutcome(saved.outcome);

        setGamePhase('board');
        addLog(`Партия возобновлена из сохранения (Раунд ${saved.currentRound || 1}).`, 'story');
      }
    } catch (e) {
      console.error('Failed to parse saved game', e);
    }
  };

  // Restart / Reset Game
  const handleRestartGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasSavedGame(false);
    setSavedGameHour(undefined);
    setCurrentHour(1);
    setPower(true);
    setLeakStatus('leak');
    setLeakDeadlineRound(3);
    setTemporaryPatchUsed(false);
    setRoofHatchOpen(false);
    setRescueSignal('none');
    setIrinaStatus('waiting');
    setDoorReinforced(false);
    setReservePower(false);
    setJournalTransmitted(false);
    setItemDurabilities({ '101': 2, '102': 2, '108': 2, '111': 2, '115': 2, '116': 2 });
    setConsumedItems([]);
    setResolvedInteractions([]);
    setCabinFloor(13);
    setActiveFloorNum(13);
    setNoisePerFloor({ 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0 });
    setZombiesPerFloor({ 10: 1, 11: 0, 12: 1, 13: 0, 14: 0, 15: 0 });
    setLogs([]);
    setLastActionSnapshot(null);
    setGameOutcome(null);
    setEndOfRoundStep(1);
    setIsEndOfRoundOpen(false);
    setGamePhase('intro');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#07090c] text-[#e6edf3] font-mono select-none flex flex-col">
      {/* Main Full-Bleed Terminal Viewport */}
      <main className="w-full h-full flex-1 relative overflow-hidden">
        <RoomHeroView
          rooms={OFFICIAL_FLOORS}
          activeFloorNum={activeFloorNum}
          currentHour={currentHour}
          maxHours={maxHours}
          power={power}
          leakStatus={leakStatus}
          leakDeadlineRound={leakDeadlineRound}
          roofHatchOpen={roofHatchOpen}
          rescueSignal={rescueSignal}
          irinaStatus={irinaStatus}
          doorReinforced={doorReinforced}
          hasUndo={lastActionSnapshot !== null}
          gameState={currentGameState}
          onUndo={handleUndo}
          onTogglePower={handleTogglePower}
          onSelectActiveFloor={(fl) => setActiveFloorNum(fl)}
          onOpenEndOfRound={() => setIsEndOfRoundOpen(true)}
          onOpenReference={(tab) => setReferenceTab(tab)}
          onOpenLogs={() => setIsLogsOpen(!isLogsOpen)}
          onResetGame={handleRestartGame}
          onPerformEvacuation={handlePerformEvacuation}
          onApplyRecipe={handleApplyRecipe}
        />
      </main>

      {/* Floating Action Pill: Immediate Evacuation when conditions are met */}
      {roofHatchOpen && rescueSignal !== 'none' && gamePhase === 'board' && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 animate-bounce">
          <button
            type="button"
            onClick={handlePerformEvacuation}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 text-black font-black font-mono uppercase text-xs sm:text-sm shadow-[0_0_25px_rgba(16,185,129,0.8)] border border-white flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <span>🚁 ВЫПОЛНИТЬ ЭВАКУАЦИЮ НА КРЫШЕ (ПОБЕДА)</span>
          </button>
        </div>
      )}

      {/* End of Round Assistant Modal */}
      {isEndOfRoundOpen && (
        <EndOfRoundModal
          currentRound={currentHour}
          maxRounds={maxHours}
          currentStep={endOfRoundStep}
          onStepChange={(step) => {
            setEndOfRoundStep(step);
            persistState({ endOfRoundStep: step });
          }}
          leakStatus={leakStatus}
          doorReinforced={doorReinforced}
          irinaStatus={irinaStatus}
          rescueSignal={rescueSignal}
          roofHatchOpen={roofHatchOpen}
          onProceedToNextRound={(hadThreeNoise) => handleAdvanceRound(hadThreeNoise)}
          onClose={() => setIsEndOfRoundOpen(false)}
        />
      )}

      {/* Reference Modal (Rules, Characters, Card Catalog, Goals, Traumas) */}
      {referenceTab && (
        <ReferenceModal
          initialTab={referenceTab}
          characters={OFFICIAL_CHARACTERS}
          cardCatalog={scenario.cardCatalog}
          personalGoals={scenario.personalGoals}
          traumaCards={scenario.traumaCards}
          onClose={() => setReferenceTab(null)}
        />
      )}

      {/* Primary Start Menu & Tablet Setup Checklist */}
      {gamePhase === 'intro' && (
        <StartMenuModal
          scenario={scenario}
          hasSavedGame={hasSavedGame}
          savedGameHour={savedGameHour}
          onStartNewGame={() => {
            handleRestartGame();
            setGamePhase('board');
            addLog('Начало новой партии: Раунд 1. Выжившие на 13-м этаже.', 'story');
          }}
          onResumeGame={handleResumeGame}
        />
      )}

      {/* End Game Modal: Victory / Defeat */}
      {gamePhase === 'game_over' && (
        <EndGameModal
          gameState={currentGameState}
          onRestart={handleRestartGame}
        />
      )}

      {/* History Logs Drawer */}
      <LogsDrawer
        isOpen={isLogsOpen}
        logs={logs}
        onClose={() => setIsLogsOpen(false)}
      />
    </div>
  );
};

export default App;
