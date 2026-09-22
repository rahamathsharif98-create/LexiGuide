export const BAKERY_RECIPES = [
  {
    id: 'recipe-cupcake',
    name: 'CUPCAKE',
    emoji: '🧁',
    syllables: ['CUP', 'CAKE'],
    frostingColors: ['#fb7185', '#fef08a'],
    prompt: 'Stack the cake tiers to bake a CUP-CAKE!',
    speechText: 'Let us bake a delicious Cupcake! First find CUP, then find CAKE!',
    distractors: ['DOG', 'BAT'],
  },
  {
    id: 'recipe-rainbow',
    name: 'RAINBOW',
    emoji: '🌈',
    syllables: ['RAIN', 'BOW'],
    frostingColors: ['#60a5fa', '#a855f7'],
    prompt: 'Stack the cake tiers to bake a RAIN-BOW cake!',
    speechText: 'Bake a magical Rainbow cake! First find RAIN, then find BOW!',
    distractors: ['CAR', 'SUN'],
  },
  {
    id: 'recipe-pancake',
    name: 'PANCAKE',
    emoji: '🥞',
    syllables: ['PAN', 'CAKE'],
    frostingColors: ['#f59e0b', '#fbbf24'],
    prompt: 'Stack the cake tiers to bake a PAN-CAKE!',
    speechText: 'Bake a warm Pancake stack! First find PAN, then find CAKE!',
    distractors: ['CAT', 'PIG'],
  },
  {
    id: 'recipe-sunflower',
    name: 'SUNSHINE',
    emoji: '☀️',
    syllables: ['SUN', 'SHINE'],
    frostingColors: ['#facc15', '#f97316'],
    prompt: 'Stack the cake tiers to bake a SUN-SHINE cake!',
    speechText: 'Bake a bright Sunshine cake! First find SUN, then find SHINE!',
    distractors: ['BED', 'RUN'],
  },
  {
    id: 'recipe-butterfly',
    name: 'BUTTERFLY',
    emoji: '🦋',
    syllables: ['BUT', 'TER', 'FLY'],
    frostingColors: ['#f472b6', '#38bdf8', '#c084fc'],
    prompt: 'Stack the 3 cake tiers to bake a BUT-TER-FLY cake!',
    speechText: 'Triple tier bake! First find BUT, then find TER, then find FLY!',
    distractors: ['HOP', 'PEN'],
  },
];

export function getBakeryRecipe(index = 0) {
  return BAKERY_RECIPES[index % BAKERY_RECIPES.length];
}
