export const dailyMissionGoal = 3;

export function rotateItems(items, offset = 0) {
  if (!items.length) return [];
  const start = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

export function getDailyMission(savedMission, date = new Date()) {
  const dateKey = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');

  const attempts = savedMission?.date === dateKey && Number.isInteger(savedMission.attempts)
    ? Math.max(0, Math.min(dailyMissionGoal, savedMission.attempts))
    : 0;

  return { date: dateKey, attempts };
}

export function recordDailyAttempt(mission, date = new Date()) {
  const currentMission = getDailyMission(mission, date);
  return {
    ...currentMission,
    attempts: Math.min(dailyMissionGoal, currentMission.attempts + 1)
  };
}

export function getStoryChapter(completedIslands, totalChapters = 6) {
  return Math.min(totalChapters, Math.max(1, completedIslands + 1));
}
