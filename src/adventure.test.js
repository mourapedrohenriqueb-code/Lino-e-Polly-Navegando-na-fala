import { describe, expect, test } from 'vitest';
import { dailyMissionGoal, getDailyMission, getStoryChapter, recordDailyAttempt } from './adventure';

describe('extras da aventura', () => {
  test('reinicia a missão diária quando muda o dia local', () => {
    const yesterday = new Date(2026, 10, 5);
    const today = new Date(2026, 10, 6);
    const mission = getDailyMission({ date: '2026-11-05', attempts: 2 }, today);

    expect(getDailyMission({ date: '2026-11-05', attempts: 2 }, yesterday).attempts).toBe(2);
    expect(mission).toEqual({ date: '2026-11-06', attempts: 0 });
  });

  test('conta tentativas até concluir a missão sem ultrapassar a meta', () => {
    const date = new Date(2026, 10, 6);
    const mission = { date: '2026-11-06', attempts: 2 };

    expect(recordDailyAttempt(mission, date).attempts).toBe(dailyMissionGoal);
    expect(recordDailyAttempt({ ...mission, attempts: 3 }, date).attempts).toBe(3);
  });

  test('mostra o próximo capítulo sem ultrapassar a última ilha', () => {
    expect(getStoryChapter(0)).toBe(1);
    expect(getStoryChapter(2)).toBe(3);
    expect(getStoryChapter(8)).toBe(6);
  });
});
