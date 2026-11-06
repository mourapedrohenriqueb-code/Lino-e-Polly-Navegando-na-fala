import { describe, expect, test } from 'vitest';
import {
  alphabetLetters,
  addCompletedExample,
  areAllExamplesComplete,
  getDiagnosticQuestions,
  getDiagnosticSummary,
  getFirstUncompletedExampleIndex,
  getInitialProgress,
  getNextUncompletedExampleIndex,
  getSyllableGuide,
  getUnlockedIslands,
  phraseBank,
  portugueseSyllables,
  speechMatches,
  textBank,
  wordBank
} from './gameLogic';

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

  test('a sugestão do questionário não pula a ordem obrigatória das ilhas', () => {
    const islands = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = getUnlockedIslands(islands, 0, 3);
    expect(result.map((island) => island.unlocked)).toEqual([true, false, false]);
    expect(getInitialProgress()).toBe(0);
  });
});

describe('progresso dos exemplos', () => {
  test('registra cada exemplo sem duplicar índices', () => {
    expect(addCompletedExample([0, 2], 2)).toEqual([0, 2]);
    expect(addCompletedExample([0, 2], 1)).toEqual([0, 1, 2]);
  });

  test('avança para o próximo exemplo ainda não concluído', () => {
    expect(getNextUncompletedExampleIndex([0, 1], 1, 4)).toBe(2);
    expect(getNextUncompletedExampleIndex([0, 2, 3], 3, 4)).toBe(1);
    expect(getNextUncompletedExampleIndex([0, 1], 1, 2)).toBeNull();
    expect(getFirstUncompletedExampleIndex([0, 2], 4)).toBe(1);
  });

  test('exige a letra exata no exercício de alfabeto', () => {
    expect(speechMatches('A', 'a')).toBe(true);
    expect(speechMatches('A', 'B')).toBe(false);
    expect(speechMatches('A', 'casa')).toBe(false);
  });

  test('reconhece o nome falado de uma letra isolada em português', () => {
    expect(speechMatches('B', 'bê')).toBe(true);
    expect(speechMatches('C', 'cê')).toBe(true);
    expect(speechMatches('H', 'agá')).toBe(true);
    expect(speechMatches('X', 'xis')).toBe(true);
    expect(speechMatches('A', 'a letra a')).toBe(true);
  });

  test('não considera o alfabeto inteiro como resposta para uma letra', () => {
    expect(speechMatches('A', 'a bê cê')).toBe(false);
    expect(speechMatches('B', 'a bê cê')).toBe(false);
    expect(speechMatches('B', 'be', 'en-US')).toBe(false);
  });

  test('a ilha seguinte só libera quando todas as atividades da ilha atual acabam', () => {
    const islands = [{ id: 1 }, { id: 2 }];

    expect(getUnlockedIslands(islands, 0).map((island) => island.unlocked)).toEqual([true, false]);
    expect(getUnlockedIslands(islands, 1).map((island) => island.unlocked)).toEqual([true, true]);
  });

  test('o alfabeto deve ser concluído em sequência, uma letra por vez', () => {
    let completed = [];

    alphabetLetters.forEach((letter, index) => {
      expect(getFirstUncompletedExampleIndex(completed, alphabetLetters.length)).toBe(index);
      expect(areAllExamplesComplete(completed, alphabetLetters.length)).toBe(false);
      completed = addCompletedExample(completed, index);
    });

    expect(getFirstUncompletedExampleIndex(completed, alphabetLetters.length)).toBeNull();
    expect(areAllExamplesComplete(completed, alphabetLetters.length)).toBe(true);
    expect(areAllExamplesComplete(completed.slice(1), alphabetLetters.length)).toBe(false);
  });
});

describe('conteúdo das ilhas', () => {
  test('o guia da loja separa palavras em sílabas e preserva pontuação', () => {
    expect(getSyllableGuide('BOLA, casa!')).toBe('BO·LA, CA·SA!');
  });

  test('a ilha do alfabeto contém todas as letras do alfabeto latino', () => {
    expect(alphabetLetters).toHaveLength(26);
    expect(new Set(alphabetLetters).size).toBe(26);
  });

  test('a ilha de sílabas oferece mais de 300 exemplos distintos', () => {
    expect(new Set(portugueseSyllables).size).toBeGreaterThan(300);
  });

  test('as ilhas de palavras, frases e textos atingem suas quantidades sem repetir itens', () => {
    expect(new Set(wordBank).size).toBeGreaterThan(300);
    expect(new Set(phraseBank).size).toBeGreaterThan(400);
    expect(textBank).toHaveLength(500);
    expect(new Set(textBank).size).toBe(500);
  });
});

describe('questionário de observação', () => {
  test('apresenta 20 perguntas sem chamar o resultado de diagnóstico clínico', () => {
    expect(getDiagnosticQuestions()).toHaveLength(20);
    expect(getDiagnosticSummary(20).title).toBe('Sugestão para começar');
    expect(getDiagnosticSummary(20).startingIslandId).toBe(1);
    expect(getDiagnosticSummary(80).startingIslandId).toBe(6);
    expect(getDiagnosticSummary(40).disclaimer).toContain('não é um diagnóstico');
  });
});
