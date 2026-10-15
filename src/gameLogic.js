export function getInitialProgress() {
  return 0;
}

export function isIslandUnlocked(islandId, completedCount) {
  return islandId === 1 || completedCount >= islandId - 1;
}

export function getUnlockedIslands(islands, completedCount) {
  return islands.map((island) => ({
    ...island,
    unlocked: isIslandUnlocked(island.id, completedCount),
  }));
}
