import { describe, expect, test } from 'vitest';
import {
  alphabetPairs,
  alphabetLetters,
  addCompletedExample,
  areAllExamplesComplete,
  getCompletedIslandCount,
  getDiagnosticQuestions,
  getDiagnosticSummary,
  getFirstUncompletedExampleIndex,
  getInitialProgress,
  getNextUncompletedExampleIndex,
  getResumeExampleIndex,
  getSyllableGuide,
  getUnlockedIslands,
  migrateAlphabetProgress,
  migrateSavedProgress,
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

  test('a sugestão do questionário libera o ponto de partida correspondente à pontuação', () => {
    const islands = [
      { id: 1, examples: ['A B'] },
      { id: 2, examples: ['PA'] },
      { id: 3, examples: ['CASA'] },
      { id: 4, examples: ['OI'] }
    ];
    const result = getUnlockedIslands(islands, 0, 3, {});
    expect(result.map((island) => island.unlocked)).toEqual([false, false, true, false]);
    expect(getInitialProgress()).toBe(0);
  });

  test('concluir todos os exemplos da ilha recomendada libera a próxima', () => {
    const islands = [
      { id: 1, examples: ['A B'] },
      { id: 2, examples: ['PA'] },
      { id: 3, examples: ['CASA', 'CARRO'] },
      { id: 4, examples: ['OI'] },
      { id: 5, examples: ['TEXTO'] }
    ];
    expect(getUnlockedIslands(islands, 0, 3, { 3: [0] })
      .map((island) => island.unlocked)).toEqual([false, false, true, false, false]);
    expect(getUnlockedIslands(islands, 0, 3, { 3: [0, 1] })
      .map((island) => island.unlocked)).toEqual([false, false, true, true, false]);
  });

  test('uma ilha posterior não libera outras sem a conclusão de cada lição intermediária', () => {
    const islands = [
      { id: 1, examples: ['A B'] },
      { id: 2, examples: ['PA'] },
      { id: 3, examples: ['CASA'] },
      { id: 4, examples: ['OI'] }
    ];
    const result = getUnlockedIslands(islands, 3, 1, { 1: [0] });
    expect(result.map((island) => island.unlocked)).toEqual([true, true, false, false]);
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

  test('retoma o exemplo exato salvo e usa o próximo pendente se a seleção for inválida', () => {
    expect(getResumeExampleIndex(5, [0, 1], 13)).toBe(5);
    expect(getResumeExampleIndex(13, [0, 1], 13)).toBe(2);
    expect(getResumeExampleIndex(undefined, [0, 1], 13)).toBe(2);
    expect(getResumeExampleIndex(undefined, undefined, 13)).toBe(0);
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

  test('reconhece somente o par de letras solicitado, na ordem correta', () => {
    expect(speechMatches('A B', 'A B')).toBe(true);
    expect(speechMatches('A B', 'a bê')).toBe(true);
    expect(speechMatches('A B', 'letra a e letra bê')).toBe(true);
    expect(speechMatches('A B', 'bê a')).toBe(false);
    expect(speechMatches('A B', 'a bê cê')).toBe(false);
  });

  test('a ilha seguinte só libera quando todas as atividades da ilha atual acabam', () => {
    const islands = [{ id: 1 }, { id: 2 }];

    expect(getUnlockedIslands(islands, 0).map((island) => island.unlocked)).toEqual([true, false]);
    expect(getUnlockedIslands(islands, 1).map((island) => island.unlocked)).toEqual([true, true]);
  });

  test('o alfabeto é apresentado em 13 pares consecutivos', () => {
    expect(alphabetPairs).toHaveLength(13);
    expect(alphabetPairs[0]).toBe('A B');
    expect(alphabetPairs[12]).toBe('Y Z');
    expect(alphabetPairs.join(' ')).toBe(alphabetLetters.join(' '));
  });

  test('os pares do alfabeto devem ser concluídos em sequência', () => {
    let completed = [];

    alphabetPairs.forEach((pair, index) => {
      expect(getFirstUncompletedExampleIndex(completed, alphabetPairs.length)).toBe(index);
      expect(areAllExamplesComplete(completed, alphabetPairs.length)).toBe(false);
      completed = addCompletedExample(completed, index);
    });

    expect(getFirstUncompletedExampleIndex(completed, alphabetPairs.length)).toBeNull();
    expect(areAllExamplesComplete(completed, alphabetPairs.length)).toBe(true);
    expect(areAllExamplesComplete(completed.slice(1), alphabetPairs.length)).toBe(false);
  });

  test('migra letras já concluídas sem perder o par ou o exemplo selecionado', () => {
    const migrated = migrateAlphabetProgress({
      selectedIslandId: 1,
      selectedExampleIndex: 5,
      completed: 0,
      completedExamples: { 1: [0, 1, 2, 4], 2: [0] }
    });

    expect(migrated.selectedExampleIndex).toBe(2);
    expect(migrated.completedExamples).toEqual({ 1: [0], 2: [0] });
    expect(migrated.alphabetPairsVersion).toBe(1);
    expect(migrateAlphabetProgress(migrated)).toEqual(migrated);
  });

  test('migra progresso antigo que já concluiu a ilha do alfabeto', () => {
    const migrated = migrateAlphabetProgress({ selectedIslandId: 2, completed: 1 });
    expect(migrated.completedExamples[1]).toEqual(alphabetPairs.map((_, index) => index));
  });

  test('não cria progresso de exemplos para um perfil antigo sem atividade concluída', () => {
    const migrated = migrateAlphabetProgress({ selectedIslandId: 1, selectedExampleIndex: 8, completed: 0 });
    expect(migrated.selectedExampleIndex).toBe(4);
    expect(migrated.completedExamples).toBeUndefined();
  });

  test('migra as ilhas antigas concluídas para o formato de progresso por exemplo', () => {
    const islands = [
      { id: 1, examples: ['A B', 'C D'] },
      { id: 2, examples: ['PA', 'PE'] },
      { id: 3, examples: ['CASA'] }
    ];
    const migrated = migrateSavedProgress({
      selectedIslandId: 3,
      selectedExampleIndex: 0,
      completed: 2
    }, islands);

    expect(migrated.completedExamples).toEqual({ 1: [0, 1], 2: [0, 1] });
  });

  test('conta ilhas completas mesmo quando a sugestão de início pula etapas', () => {
    const islands = [
      { id: 1, examples: ['A B', 'C D'] },
      { id: 2, examples: ['PA'] },
      { id: 3, examples: ['CASA'] }
    ];

    expect(getCompletedIslandCount({ 1: [0], 2: [0], 3: [0] }, islands)).toBe(2);
    expect(getCompletedIslandCount({ 1: [0, 1], 2: [0], 3: [0] }, islands)).toBe(3);
  });
});

describe('conteúdo das ilhas', () => {
  test('o guia da loja separa palavras em sílabas e preserva pontuação', () => {
    expect(getSyllableGuide('BOLA, casa!')).toBe('BO·LA, CA·SA!');
  });

  test('a ilha do alfabeto contém todas as letras do alfabeto latino', () => {
    expect(alphabetLetters).toHaveLength(26);
    expect(new Set(alphabetLetters).size).toBe(26);
    expect(alphabetPairs.flatMap((pair) => pair.split(' '))).toEqual(alphabetLetters);
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
    expect(getDiagnosticSummary(60).startingIslandId).toBe(4);
    expect(getDiagnosticSummary(80).startingIslandId).toBe(6);
    expect(getDiagnosticSummary(60).message).toContain('Ilha das Frases');
    expect(getDiagnosticSummary(40).disclaimer).toContain('não é um diagnóstico');
  });
});
