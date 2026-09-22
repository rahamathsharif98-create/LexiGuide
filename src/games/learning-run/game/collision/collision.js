export function laneMatches(laneA, laneB) {
  return laneA === laneB;
}

export function isNear(z1, z2, threshold) {
  return Math.abs(z1 - z2) <= threshold;
}

// Given the player's current jump/slide state, decide whether an obstacle of
// a given type actually causes a hit. Obstacles are only dangerous if the
// player didn't perform the matching action.
export function obstacleWouldHit(obstacleType, playerState) {
  if (obstacleType === 'jump') {
    // low block: must jump over it
    return !playerState.isJumping || playerState.jumpProgress < 0.15;
  }
  if (obstacleType === 'slide') {
    // overhead bar: must slide under it
    return !playerState.isSliding;
  }
  return true;
}
