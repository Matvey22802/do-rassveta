import {
  GameState,
  InteractionRecipe,
  CardItem,
  InteractionId
} from '../types/game';
import { OFFICIAL_INTERACTIONS } from '../data/officialInteractions';
import {
  OFFICIAL_ITEMS,
  OFFICIAL_DATA_CARDS,
  OFFICIAL_EVENTS
} from '../data/officialScenario';

export interface PreFlightCheckResult {
  isValid: boolean;
  isPartial?: boolean;
  isUnknownCard?: boolean;
  recipe?: InteractionRecipe;
  errorMessage?: string;
  actionCost: number;
  consumedCards: CardItem[];
  durabilitySpent: { card: CardItem; remainingUses: number }[];
  calculatedNoise: number;
  tabletopRequirements: string[];
  resultPreviewText: string;
  futureCostSummary?: {
    actionText: string;
    materialsText: string;
    durabilityText: string;
    skillsAndSupportText: string;
    noiseText: string;
    consequencesPreviewText: string;
  };
}

// Map each interactive hotspot target to its valid official recipe IDs
export const TARGET_RECIPE_MAP: Record<string, string[]> = {
  'obj_cooling_pipeline': ['P1', 'P2', 'P3', 'P4', 'P5'],
  'obj_generator_relay': ['G1', 'G2'],
  'obj_irina': ['M1', 'M2', 'M3', 'M4'],
  'obj_wing_door': ['D1', 'D2'],
  'obj_roof_hatch': ['H1', 'H2', 'H3', 'H4', 'H5'],
  'obj_radio_station': ['R1', 'R2', 'R3', 'E1'],
  'obj_light_beacon': ['O1', 'O2'],
  'obj_siren_reserve': ['B1', 'B2'],
};

// Target human-readable names for error messages
export const TARGET_NAMES: Record<string, string> = {
  'obj_cooling_pipeline': 'Охлаждающая магистраль',
  'obj_generator_relay': 'Защитное реле генератора',
  'obj_irina': 'Диспетчер Ирина',
  'obj_wing_door': 'Дверь закрытого крыла',
  'obj_roof_hatch': 'Люк на крышу',
  'obj_radio_station': 'Радиостанция',
  'obj_light_beacon': 'Световой маяк крыши',
  'obj_siren_reserve': 'Резервный пульт сирен',
};

// Clean and extract 3-digit card code (handles manual entry "103" or QR "DAWN|DEMO01|103")
export function parseCardCode(rawInput: string): string | null {
  if (!rawInput) return null;
  const trimmed = rawInput.trim();
  const match = trimmed.match(/(?:DAWN\|DEMO\d+\|)?(\d{3})/i);
  if (match) return match[1];
  return null;
}

export function getCardByCode(code: string): CardItem | undefined {
  return (
    OFFICIAL_ITEMS.find((c) => c.code === code) ||
    OFFICIAL_DATA_CARDS.find((c) => c.code === code) ||
    OFFICIAL_EVENTS.find((c) => c.code === code)
  );
}

// Validate and calculate preliminary cost for selected cards and target interaction
export function evaluateInteraction(
  rawCodes: string[],
  targetFloor: number,
  gameState: GameState,
  options: {
    targetId?: string | null;
    isWorkingUnderThreat?: boolean;
    isCautionOverload?: boolean;
    isHeavyTech?: boolean;
    specificRecipeId?: InteractionId;
  } = {}
): PreFlightCheckResult {
  const parsedCodes = rawCodes
    .map(parseCardCode)
    .filter((c): c is string => c !== null);

  // Check for duplicates in input
  if (parsedCodes.length === 2 && parsedCodes[0] === parsedCodes[1]) {
    return {
      isValid: false,
      errorMessage: 'Нельзя дважды использовать одну и ту же карту в одном рецепте.',
      actionCost: 0,
      consumedCards: [],
      durabilitySpent: [],
      calculatedNoise: 0,
      tabletopRequirements: [],
      resultPreviewText: ''
    };
  }

  // Check if any card code is invalid / unknown in scenario
  for (const raw of rawCodes) {
    const code = parseCardCode(raw);
    if (!code || !getCardByCode(code)) {
      return {
        isValid: false,
        isUnknownCard: true,
        errorMessage: `Карта #${raw} не найдена в сценарии. Проверьте номер на физической карте.`,
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }
  }

  // Check if any card has already been consumed
  for (const code of parsedCodes) {
    if (gameState.consumedItems.includes(code)) {
      const card = getCardByCode(code);
      return {
        isValid: false,
        errorMessage: `Карта #${code} «${card?.name || ''}» уже была израсходована ранее и находится в сбросе!`,
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }

    // Check durability if tool
    if (gameState.itemDurabilities[code] !== undefined && gameState.itemDurabilities[code] <= 0) {
      const card = getCardByCode(code);
      return {
        isValid: false,
        errorMessage: `Инструмент #${code} «${card?.name || ''}» полностью исчерпал свой ресурс (0 применений)!`,
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }
  }

  // Find matching recipe from OFFICIAL_INTERACTIONS
  const sortedInput = [...parsedCodes].sort();

  // If targetId is provided, enforce that the recipe belongs to this exact target!
  const allowedRecipeIds = options.targetId ? TARGET_RECIPE_MAP[options.targetId] : undefined;

  const matchingRecipes = OFFICIAL_INTERACTIONS.filter((r) => {
    if (options.specificRecipeId && r.id !== options.specificRecipeId) {
      return false;
    }

    // Target check: recipe must match selected target object if target is specified
    if (allowedRecipeIds && !allowedRecipeIds.includes(r.id)) {
      return false;
    }

    // Floor matching: exact floor or anywhere (0)
    if (r.targetFloor !== 0 && targetFloor !== 0 && r.targetFloor !== targetFloor) {
      return false;
    }

    // Cards matching: must match exactly
    const sortedRequired = [...r.requiredCards].sort();
    if (sortedInput.length !== sortedRequired.length) return false;
    return sortedInput.every((code, idx) => code === sortedRequired[idx]);
  });

  if (matchingRecipes.length === 0) {
    // Check if sortedInput is a partial subset of a valid recipe for this target
    const candidateRecipes = OFFICIAL_INTERACTIONS.filter((r) => {
      if (options.specificRecipeId && r.id !== options.specificRecipeId) return false;
      if (allowedRecipeIds && !allowedRecipeIds.includes(r.id)) return false;
      if (r.targetFloor !== 0 && targetFloor !== 0 && r.targetFloor !== targetFloor) return false;
      return true;
    });

    if (sortedInput.length > 0) {
      const partialMatch = candidateRecipes.find((r) =>
        sortedInput.every((c) => r.requiredCards.includes(c)) &&
        r.requiredCards.length > sortedInput.length
      );

      if (partialMatch) {
        const missingCards = partialMatch.requiredCards
          .filter((c) => !sortedInput.includes(c))
          .map((c) => {
            const card = getCardByCode(c);
            return card ? `#${card.code} «${card.name}»` : `#${c}`;
          });

        return {
          isValid: false,
          isPartial: true,
          errorMessage: `Этого предмета пока недостаточно для завершения действия. Добавьте: ${missingCards.join(' или ')}.`,
          actionCost: 0,
          consumedCards: [],
          durabilitySpent: [],
          calculatedNoise: 0,
          tabletopRequirements: [],
          resultPreviewText: ''
        };
      }
    }

    // If cards matched a DIFFERENT object on the floor, provide a helpful and clear explanation
    let crossObjectHint = '';
    if (options.targetId && parsedCodes.length > 0) {
      const otherMatching = OFFICIAL_INTERACTIONS.find((r) => {
        if (r.targetFloor !== 0 && targetFloor !== 0 && r.targetFloor !== targetFloor) return false;
        const sReq = [...r.requiredCards].sort();
        return sortedInput.length === sReq.length && sortedInput.every((c, i) => c === sReq[i]);
      });
      if (otherMatching) {
        const targetName = TARGET_NAMES[options.targetId] || 'выбранного объекта';
        crossObjectHint = `Карта не подходит для объекта «${targetName}». Она относится к объекту «${otherMatching.objectName}».`;
      }
    }

    const targetName = options.targetId ? TARGET_NAMES[options.targetId] : undefined;
    const defaultMsg = crossObjectHint || (
      parsedCodes.length > 0
        ? `Сочетание карт [${parsedCodes.join(', ')}] не подходит для ${targetName ? `объекта «${targetName}»` : 'этой задачи'}. Ошибочный ввод ничего не тратит.`
        : 'Выберите или отсканируйте необходимые карты предметов.'
    );

    return {
      isValid: false,
      errorMessage: defaultMsg,
      actionCost: 0,
      consumedCards: [],
      durabilitySpent: [],
      calculatedNoise: 0,
      tabletopRequirements: [],
      resultPreviewText: ''
    };
  }

  const recipe = matchingRecipes[0];

  // Specific Game State Precondition Checks
  // P1, P2 (Полный ремонт)
  if ((recipe.id === 'P1' || recipe.id === 'P2') && gameState.leakStatus === 'repaired') {
    return {
      isValid: false,
      errorMessage: 'Охлаждающая магистраль уже полностью отремонтирована.',
      actionCost: 0,
      consumedCards: [],
      durabilitySpent: [],
      calculatedNoise: 0,
      tabletopRequirements: [],
      resultPreviewText: ''
    };
  }

  // P3, P4 (Временная заплата)
  if (recipe.id === 'P3' || recipe.id === 'P4') {
    if (gameState.temporaryPatchUsed) {
      return {
        isValid: false,
        errorMessage: 'Временная заплата уже применялась в этой партии. Повторная заплата невозможна (требуется полный ремонт).',
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }
    if (gameState.leakStatus === 'repaired' || gameState.leakStatus === 'shutoff') {
      return {
        isValid: false,
        errorMessage: 'Заплата неприменима в текущем состоянии магистрали.',
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }
  }

  // P5 (Перекрыть контур)
  if (recipe.id === 'P5' && (gameState.leakStatus === 'repaired' || gameState.leakStatus === 'shutoff')) {
    return {
      isValid: false,
      errorMessage: 'Контур уже перекрыт или магистраль полностью отремонтирована.',
      actionCost: 0,
      consumedCards: [],
      durabilitySpent: [],
      calculatedNoise: 0,
      tabletopRequirements: [],
      resultPreviewText: ''
    };
  }

  // G1, G2 (Реле генератора)
  if (recipe.id === 'G1' || recipe.id === 'G2') {
    if (gameState.power) {
      return {
        isValid: false,
        errorMessage: 'Питание здания уже включено (220V). Ремонт реле не требуется.',
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }
    if (gameState.leakStatus !== 'repaired' && gameState.leakStatus !== 'shutoff') {
      return {
        isValid: false,
        errorMessage: 'Опасно: сначала нужно устранить свищ охлаждения на 11-м этаже, иначе реле сразу сгорит повторно!',
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }
  }

  // R1, R2 (Сетевой вызов)
  if ((recipe.id === 'R1' || recipe.id === 'R2') && !gameState.power) {
    return {
      isValid: false,
      errorMessage: 'Здание обесточено! Сетевой радиовызов невозможен без электросети 220V (используйте автономный комплект R3: #108+#107).',
      actionCost: 0,
      consumedCards: [],
      durabilitySpent: [],
      calculatedNoise: 0,
      tabletopRequirements: [],
      resultPreviewText: ''
    };
  }

  // R1, R2, R3 (Повторный вызов)
  if ((recipe.id === 'R1' || recipe.id === 'R2' || recipe.id === 'R3') && gameState.rescueSignal !== 'none') {
    return {
      isValid: false,
      errorMessage: 'Сигнал спасателям уже успешно передан и принят!',
      actionCost: 0,
      consumedCards: [],
      durabilitySpent: [],
      calculatedNoise: 0,
      tabletopRequirements: [],
      resultPreviewText: ''
    };
  }

  // H1..H5 (Люк на крышу)
  if (['H1', 'H2', 'H3', 'H4', 'H5'].includes(recipe.id) && gameState.roofHatchOpen) {
    return {
      isValid: false,
      errorMessage: 'Люк на вертолетную площадку крыши уже открыт.',
      actionCost: 0,
      consumedCards: [],
      durabilitySpent: [],
      calculatedNoise: 0,
      tabletopRequirements: [],
      resultPreviewText: ''
    };
  }

  // O1, O2 (Световой сигнал)
  if (recipe.id === 'O1' || recipe.id === 'O2') {
    if (gameState.currentRound < 7) {
      return {
        isValid: false,
        errorMessage: `Световой патруль спасателей появится только в раундах 7–8! Сейчас идет раунд ${gameState.currentRound}.`,
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }
    if (!gameState.roofHatchOpen) {
      return {
        isValid: false,
        errorMessage: 'Люк на крышу закрыт! Сначала откройте люк, чтобы подать световой сигнал спасателям.',
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }
    if (gameState.rescueSignal !== 'none') {
      return {
        isValid: false,
        errorMessage: 'Сигнал спасателям уже подтвержден.',
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }
  }

  // M1..M4 (Ирина)
  if (['M1', 'M2', 'M3', 'M4'].includes(recipe.id)) {
    if (gameState.irinaStatus === 'prepared') {
      return {
        isValid: false,
        errorMessage: 'Ирина уже стабилизирована и готова к эвакуации.',
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }
    if (gameState.irinaStatus === 'lost' || gameState.currentRound > 5) {
      return {
        isValid: false,
        errorMessage: 'Срок спасения Ирины истек в конце 5-го раунда. Возможность помочь ей потеряна.',
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }
  }

  // D1, D2 (Дверь закрытого крыла)
  if (recipe.id === 'D1' || recipe.id === 'D2') {
    if (gameState.doorReinforced) {
      return {
        isValid: false,
        errorMessage: 'Дверь закрытого крыла уже надежно укреплена.',
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }
    if (gameState.currentRound > 3) {
      return {
        isValid: false,
        errorMessage: 'Прорыв закрытого крыла уже произошел в начале 4-го раунда.',
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }
  }

  // B1, B2 (Резервный пульт сирен)
  if ((recipe.id === 'B1' || recipe.id === 'B2') && gameState.reservePower) {
    return {
      isValid: false,
      errorMessage: 'Резервный пульт диспетчерской уже подключен и активен.',
      actionCost: 0,
      consumedCards: [],
      durabilitySpent: [],
      calculatedNoise: 0,
      tabletopRequirements: [],
      resultPreviewText: ''
    };
  }

  // E1 (Журнал 206)
  if (recipe.id === 'E1') {
    if (gameState.rescueSignal !== 'radio') {
      return {
        isValid: false,
        errorMessage: 'Для передачи журнала требуется установленная двусторонняя РАДИОСВЯЗЬ со спасателями (световой сигнал не подходит).',
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }
    if (gameState.journalTransmitted) {
      return {
        isValid: false,
        errorMessage: 'Журнал закрытого крыла уже успешно передан спасателям.',
        actionCost: 0,
        consumedCards: [],
        durabilitySpent: [],
        calculatedNoise: 0,
        tabletopRequirements: [],
        resultPreviewText: ''
      };
    }
  }

  // Calculate costs and noise
  const consumedCards = recipe.consumedCards
    .map((c) => getCardByCode(c))
    .filter((c): c is CardItem => c !== undefined);

  const durabilitySpent: { card: CardItem; remainingUses: number }[] = [];
  if (recipe.durabilityCost && !options.isHeavyTech) {
    const card = getCardByCode(recipe.durabilityCost.cardCode);
    if (card) {
      const currentUses = gameState.itemDurabilities[card.code] ?? card.maxDurability ?? 2;
      durabilitySpent.push({
        card,
        remainingUses: Math.max(0, currentUses - recipe.durabilityCost.cost)
      });
    }
  }

  // Noise calculation: base + (threat ? 1 : 0) - (caution ? 2 : 0)
  let noise = recipe.baseNoise;
  if (options.isWorkingUnderThreat) {
    noise += 1;
  }
  if (options.isCautionOverload) {
    noise = Math.max(0, noise - 2);
  }

  const tabletopRequirements: string[] = [];
  if (recipe.tabletopCheckText) {
    tabletopRequirements.push(recipe.tabletopCheckText);
  }
  if (options.isWorkingUnderThreat) {
    tabletopRequirements.push('⚠️ Работа под угрозой (на этаже есть зомби): +1 шум на этаж.');
  }
  if (options.isCautionOverload) {
    tabletopRequirements.push('🤫 Усиленная Осторожность: карта Осторожности в Глубокий откат (шум снижен на 2).');
  }
  if (options.isHeavyTech && recipe.durabilityCost) {
    tabletopRequirements.push(`🔧 Усиленная техника: карта Техники в Глубокий откат. Ресурс инструмента #${recipe.durabilityCost.cardCode} сохранен (без износа)!`);
  }

  // Future cost summary breakdown
  const futureCostSummary = {
    actionText: `${recipe.actionCost} действие активного персонажа`,
    materialsText: consumedCards.length > 0
      ? `Будет израсходовано: ${consumedCards.map((c) => `#${c.code} ${c.name}`).join(', ')}`
      : 'Расходные материалы не требуются',
    durabilityText: options.isHeavyTech && recipe.durabilityCost
      ? `Износ предотвращен Усиленной техникой (сохранено +1 применение #${recipe.durabilityCost.cardCode})`
      : recipe.durabilityCost
      ? `Будет потрачено 1 применение инструмента #${recipe.durabilityCost.cardCode}`
      : 'Износ инструмента отсутствует',
    skillsAndSupportText: tabletopRequirements.length > 0
      ? tabletopRequirements.join(' • ')
      : 'Специальные навыки на столе не требуются',
    noiseText: noise > 0 ? `+${noise} шума на этаж` : '0 шума (тихо)',
    consequencesPreviewText: recipe.resultText
  };

  return {
    isValid: true,
    recipe,
    actionCost: recipe.actionCost,
    consumedCards,
    durabilitySpent,
    calculatedNoise: noise,
    tabletopRequirements,
    resultPreviewText: recipe.resultText,
    futureCostSummary
  };
}

// Apply confirmed interaction recipe to GameState
export function applyInteraction(
  recipe: InteractionRecipe,
  gameState: GameState,
  options: {
    calculatedNoise: number;
    targetFloor: number;
    isHeavyTech?: boolean;
  }
): GameState {
  const next = { ...gameState };

  // 1. Mark as resolved
  if (!next.resolvedInteractions.includes(recipe.id)) {
    next.resolvedInteractions = [...next.resolvedInteractions, recipe.id];
  }

  // 2. Consume items
  if (recipe.consumedCards.length > 0) {
    next.consumedItems = [...next.consumedItems, ...recipe.consumedCards];
  }

  // 3. Decrease durability (unless protected by isHeavyTech)
  if (recipe.durabilityCost && !options.isHeavyTech) {
    const code = recipe.durabilityCost.cardCode;
    const current = next.itemDurabilities[code] ?? 2;
    const updated = Math.max(0, current - recipe.durabilityCost.cost);
    next.itemDurabilities = {
      ...next.itemDurabilities,
      [code]: updated
    };
  }

  // 4. Update specific state variables based on recipe ID
  // P1, P2: Полный ремонт трубы
  if (recipe.id === 'P1' || recipe.id === 'P2') {
    next.leakStatus = 'repaired';
  }

  // P3, P4: Временная заплата (+2 раунда отсрочки)
  if (recipe.id === 'P3' || recipe.id === 'P4') {
    next.leakStatus = 'temporary_patch';
    next.temporaryPatchUsed = true;
    next.leakDeadlineRound = Math.min(8, next.currentRound + 2);
  }

  // P5: Перекрыть контур (вода остановлена, но генератор обесточен!)
  if (recipe.id === 'P5') {
    next.leakStatus = 'shutoff';
    next.power = false;
  }

  // G1, G2: Запуск генератора
  if (recipe.id === 'G1' || recipe.id === 'G2') {
    next.power = true;
  }

  // R1, R2, R3: Радиовызов спасателей
  if (recipe.id === 'R1' || recipe.id === 'R2' || recipe.id === 'R3') {
    next.rescueSignal = 'radio';
  }

  // H1..H5: Люк на крышу открыт
  if (['H1', 'H2', 'H3', 'H4', 'H5'].includes(recipe.id)) {
    next.roofHatchOpen = true;
  }

  // O1, O2: Световой сигнал спасателям
  if (recipe.id === 'O1' || recipe.id === 'O2') {
    next.rescueSignal = 'light';
  }

  // M1..M4: Ирина подготовлена к эвакуации
  if (['M1', 'M2', 'M3', 'M4'].includes(recipe.id)) {
    next.irinaStatus = 'prepared';
  }

  // D1, D2: Дверь закрытого крыла укреплена
  if (recipe.id === 'D1' || recipe.id === 'D2') {
    next.doorReinforced = true;
  }

  // B1, B2: Резервный пульт диспетчерской
  if (recipe.id === 'B1' || recipe.id === 'B2') {
    next.reservePower = true;
  }

  // E1: Журнал закрытого крыла передан
  if (recipe.id === 'E1') {
    next.journalTransmitted = true;
  }

  // 5. Apply noise to target floor
  const fl = recipe.targetFloor !== 0 ? recipe.targetFloor : options.targetFloor;
  if (fl && options.calculatedNoise > 0) {
    const currentNoise = next.noisePerFloor[fl] ?? 0;
    next.noisePerFloor = {
      ...next.noisePerFloor,
      [fl]: Math.min(3, currentNoise + options.calculatedNoise)
    };
  }

  return next;
}
