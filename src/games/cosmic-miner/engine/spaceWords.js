export const SPACE_MISSIONS = [
  {
    id: 'mission-star',
    word: 'STAR',
    emoji: '⭐',
    prompt: 'Collect the crystals to spell STAR!',
    meaning: 'A glowing ball of cosmic gas in the night sky!',
    speechText: 'Spell the word STAR! Find S, then T, then A, then R!',
  },
  {
    id: 'mission-moon',
    word: 'MOON',
    emoji: '🌙',
    prompt: 'Collect the crystals to spell MOON!',
    meaning: 'Our natural satellite orbiting Earth!',
    speechText: 'Spell the word MOON! Find M, then O, then O, then N!',
  },
  {
    id: 'mission-sun',
    word: 'SUN',
    emoji: '☀️',
    prompt: 'Collect the crystals to spell SUN!',
    meaning: 'The bright star at the center of our solar system!',
    speechText: 'Spell the word SUN! Find S, then U, then N!',
  },
  {
    id: 'mission-mars',
    word: 'MARS',
    emoji: '🔴',
    prompt: 'Collect the crystals to spell MARS!',
    meaning: 'The red fourth planet from the sun!',
    speechText: 'Spell the word MARS! Find M, then A, then R, then S!',
  },
  {
    id: 'mission-ship',
    word: 'SHIP',
    emoji: '🚀',
    prompt: 'Collect the crystals to spell SHIP!',
    meaning: 'Our cosmic spacecraft exploring the galaxy!',
    speechText: 'Spell the word SHIP! Find S, then H, then I, then P!',
  },
  {
    id: 'mission-orbit',
    word: 'ORBIT',
    emoji: '🪐',
    prompt: 'Collect the crystals to spell ORBIT!',
    meaning: 'A circular curved path around a celestial body!',
    speechText: 'Spell the word ORBIT! Find O, then R, then B, then I, then T!',
  },
];

export function getSpaceMission(index = 0) {
  return SPACE_MISSIONS[index % SPACE_MISSIONS.length];
}