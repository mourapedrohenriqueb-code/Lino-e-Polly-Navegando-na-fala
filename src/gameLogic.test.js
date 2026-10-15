import { describe, expect, test } from 'vitest';
import { getInitialProgress, getUnlockedIslands } from './gameLogic';

function computeUnlocked(islands, completed) {
  return islands.map((island) => ({
    ...island,
    unlocked: island.id === 1 || completed >= island.id - 1,
  }));
}

describe('sistema de ilhas', () => {
  test('o progresso inicial deve começar zerado', () => {
    expect(getInitialProgress()).toBe(0);
  });
  test('a ilha 1 deve iniciar liberada', () => {
    const islands = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = computeUnlocked(islands, 0);
    expect(result[0].unlocked).toBe(true);
  });

  test('o início do jogo deve manter a ilha 2 bloqueada', () => {
    const islands = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = getUnlockedIslands(islands, getInitialProgress());
    expect(result[0].unlocked).toBe(true);
    expect(result[1].unlocked).toBe(false);
  });

  test('a ilha 2 deve liberar somente após concluir a ilha 1', () => {
    const islands = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(computeUnlocked(islands, 1)[1].unlocked).toBe(true);
    expect(computeUnlocked(islands, 0)[1].unlocked).toBe(false);
  });

  test('a ilha 3 deve ficar bloqueada até completar a anterior', () => {
    const islands = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(computeUnlocked(islands, 2)[2].unlocked).toBe(true);
    expect(computeUnlocked(islands, 1)[2].unlocked).toBe(false);
  });
});
