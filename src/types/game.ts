// Official Game Types for «До рассвета: Последний рейс» (версия 0.1.0 · 25 октября 2026)

export type ScenarioVariant = 'variantA' | 'variantB';

export type FloorNumber = 10 | 11 | 12 | 13 | 14 | 15;

export type PowerGridState = 'online' | 'warning' | 'blackout';

export type RoomStatus = 'open' | 'locked' | 'hidden' | 'crisis';

export type IrinaStatus = 'waiting' | 'prepared' | 'lost';

export type LeakStatus = 'leak' | 'temporary_patch' | 'repaired' | 'shutoff';

export type RescueSignalType = 'none' | 'radio' | 'light';

export interface StartingCard {
  name: string;
  icon: string; // e.g. "Сила 💪", "Техника 🔧", "Осторожность 🤫"
  standardEffect: string;
  overloadEffect: string; // На перегруз (Глубокий откат)
}

export interface Character {
  id: string;
  name: string;
  role: string;
  perk: string;
  cards: StartingCard[];
  goalId?: string;
  hasTrauma?: boolean;
}

export interface EngineeringApproach {
  id: string;
  name?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  requiredCode: string;
  alternativeCodes?: string[];
  requiredSkill?: string;
  actionCost?: number;
  noiseGenerated?: number;
  noiseDelta?: number;
  toolDurabilityWear?: string;
  consumedItemsText?: string;
  retainedItemsText?: string;
  buildingImpact?: string;
  successMessage?: string;
  resultDescription?: string;
}

export interface CardItem {
  code: string; // "101".."118", "201".."206", "301".."312"
  name: string;
  floorFound: number;
  type: 'item' | 'data' | 'event';
  isConsumable?: boolean;
  maxDurability?: number;
  properties: string[]; // e.g. ["инструмент", "рычаг", "герметизация"]
  description: string;
  // Legacy / UI optional properties
  wearType?: 'consumable' | 'limited' | 'permanent' | string;
  charges?: number;
  applicationDescription?: string;
  discardEffect?: string;
  multiuseIcon?: string;
}

export interface PersonalGoal {
  id: string; // 'G1'..'G6'
  characterId: string; // 'Лера' | 'Марк' | 'Ника'
  title: string;
  description: string;
}

export type InteractionId =
  | 'P1' | 'P2' | 'P3' | 'P4' | 'P5'
  | 'G1' | 'G2'
  | 'R1' | 'R2' | 'R3'
  | 'H1' | 'H2' | 'H3' | 'H4' | 'H5'
  | 'O1' | 'O2'
  | 'M1' | 'M2' | 'M3' | 'M4'
  | 'D1' | 'D2'
  | 'B1' | 'B2'
  | 'E1'
  | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8';

export interface InteractionRecipe {
  id: InteractionId;
  code: string;
  name: string;
  targetFloor: number; // 10..15 or 0 for anywhere
  objectName: string;
  requiredCards: string[]; // array of card codes, e.g. ['103', '104']
  actionCost: number; // 1 or 2
  consumedCards: string[];
  durabilityCost?: { cardCode: string; cost: number };
  baseNoise: number;
  tabletopCheckText?: string;
  conditionsExplanation?: string;
  resultText: string;
  videoClipId?: string;
}

export interface InteractableObject {
  id: string;
  name: string;
  floor: number;
  description: string;
  whatIsHappening: string;
  knownConsequences?: string[];
  deadlineRoundsText?: string;
  resolved: boolean;
  recipes: InteractionId[];
  // Legacy / UI optional properties
  requiredCode?: string;
  alternativeCodes?: string[];
  cardName?: string;
  approaches?: EngineeringApproach[];
  successMessage?: string;
  failureMessage?: string;
  unlockedRoomId?: string;
  victoryKey?: string;
  videoTrigger?: any;
}

export interface Room {
  id: string;
  floorNumber: number;
  name: string;
  subtitle: string;
  status: RoomStatus;
  initialZombies: number;
  description: string;
  visualClue: string;
  searchDeckOrder: string[]; // sequence of card codes
  quietSearchSkill: string; // e.g. "Техника", "Осторожность", "Сила"
  interactables: InteractableObject[];
  audioBriefingText?: string;
  quickAlert?: string;
  // Legacy / UI optional properties
  searchDeckNote?: string;
  isCCTVRoom?: boolean;
  gridPosition?: { col: number; row: number };
}

export interface RoundCrisis {
  round: number;
  title: string;
  announcementText: string;
  audioVoiceText: string;
  systemCheckDescription?: string;
  autoBreachFloor?: number;
  autoBreachZombies?: number;
}

export interface VideoClipScene {
  id: string; // 'M00'..'M08'
  title: string;
  durationSec: number;
  isSkippable: boolean;
  visualDescription: string;
  soundDescription: string;
  audioVoiceoverText?: string;
}

export interface LogEntry {
  id: string;
  hour: number;
  time: string;
  text: string;
  type: 'action' | 'system' | 'threat' | 'undo' | 'story';
}

export interface TraumaCard {
  id: string;
  title: string;
  effect: string;
  flavor?: string;
}

export interface ZombieDirective {
  spawnCount: number;
  spawnLocation: string;
  movementInstruction: string;
  specialWarning?: string;
}

export interface HourCrisis {
  hour?: number;
  timeString: string;
  title: string;
  eventDescription: string;
  zombieDirective: ZombieDirective;
  audioWarning?: string;
  consequence?: string;
}

export interface MoralDilemmaOption {
  id: string;
  text?: string;
  label?: string;
  isRisky?: boolean;
  rewardDescription?: string;
  consequence: string;
  flavor?: string;
}

export interface MoralDilemma {
  id: string;
  hour?: number;
  title: string;
  situation: string;
  options: MoralDilemmaOption[];
}

export interface ActionSnapshot {
  timestamp: number;
  description: string;
  stateDump: string; // JSON stringified state for full rollback
}

export interface PlaytestProtocol {
  date: string;
  variant: ScenarioVariant;
  team: string;
  setupMinutes: number;
  explanationMinutes: number;
  gameplayMinutes: number;
  finalRound: number;
  outcome: 'victory' | 'defeat';
  irinaSaved: boolean;
  journalTransmitted: boolean;
  finalPower: boolean;
  personalGoals: Record<string, boolean>;
  searchesCount: number;
  supportsCount: number;
  restsCount: number;
  traumasCount: number;
  sirenReactionsCount: number;
  inputErrorsCount: number;
  longestDiscussion: string;
  boringEpisode: string;
  uselessItems: string;
  whatToChangeNextGame: string;
  ruleNeedingAuthorClarification: string;
  nextHypothesis: string;
}

export interface Scenario {
  id: string;
  title: string;
  chapter: string;
  location: string;
  startHour: number;
  dawnHour: number;
  introStory: string[];
  teamObjective: string;
  paths: {
    pathA: { name: string; description: string; requirements: string[] };
    pathB: { name: string; description: string; requirements: string[] };
  };
  setupInstructions: string[];
  characters: Character[];
  cardCatalog: CardItem[];
  personalGoals: PersonalGoal[];
  traumaCards: { id: string; title: string; effect: string }[];
  rooms: Room[];
  hourCrises?: any[];
  moralDilemmas?: any[];
}

export interface GameState {
  variant: ScenarioVariant;
  currentRound: number;
  maxRounds: number;
  power: boolean;
  leakStatus: LeakStatus;
  leakDeadlineRound: number;
  temporaryPatchUsed: boolean;
  roofHatchOpen: boolean;
  rescueSignal: RescueSignalType;
  irinaStatus: IrinaStatus;
  doorReinforced: boolean;
  reservePower: boolean;
  journalTransmitted: boolean;
  itemDurabilities: Record<string, number>;
  consumedItems: string[];
  resolvedInteractions: string[];
  activeFloorNum: number;
  cabinFloor: number;
  noisePerFloor: Record<number, number>;
  zombiesPerFloor: Record<number, number>;
  characters: Character[];
  personalGoals: Record<string, string>;
  traumas: Record<string, boolean>;
  logs: LogEntry[];
  lastActionSnapshot: ActionSnapshot | null;
  outcome: 'victory' | 'defeat' | null;
  endOfRoundStep?: number;
}
