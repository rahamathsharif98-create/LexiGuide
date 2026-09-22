export const CRAFT_RECIPES = [
  {
    id: 'craft-fort',
    word: 'FORT',
    emoji: '🏰',
    reward: 'Stone Fortress',
    prompt: 'Craft the FORT by placing voxel letter blocks!',
    speechText: 'Welcome voxel builder! Craft a mighty FORT! Find F, then O, then R, then T!',
    blockColor: '#64748b',
    distractors: ['P', 'B'],
  },
  {
    id: 'craft-gold',
    word: 'GOLD',
    emoji: '🪙',
    reward: 'Golden Ingots',
    prompt: 'Craft shiny GOLD by placing voxel letter blocks!',
    speechText: 'Craft shiny GOLD! Find G, then O, then L, then D!',
    blockColor: '#eab308',
    distractors: ['M', 'T'],
  },
  {
    id: 'craft-tree',
    word: 'TREE',
    emoji: '🌲',
    reward: 'Voxel Pine Tree',
    prompt: 'Craft a tall TREE by placing voxel letter blocks!',
    speechText: 'Craft a forest TREE! Find T, then R, then E, then E!',
    blockColor: '#22c55e',
    distractors: ['S', 'K'],
  },
  {
    id: 'craft-ship',
    word: 'SHIP',
    emoji: '⛵',
    reward: 'Voxel Pirate Boat',
    prompt: 'Craft a wooden SHIP by placing voxel letter blocks!',
    speechText: 'Craft a sailing SHIP! Find S, then H, then I, then P!',
    blockColor: '#92400e',
    distractors: ['W', 'D'],
  },
  {
    id: 'craft-gem',
    word: 'GEMS',
    emoji: '💎',
    reward: 'Diamond Voxel Cluster',
    prompt: 'Craft sparkling GEMS by placing voxel letter blocks!',
    speechText: 'Craft sparkling GEMS! Find G, then E, then M, then S!',
    blockColor: '#06b6d4',
    distractors: ['L', 'C'],
  },
];

export function getCraftRecipe(index = 0) {
  return CRAFT_RECIPES[index % CRAFT_RECIPES.length];
}
