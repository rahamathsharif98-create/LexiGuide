export const DINO_TARGETS = [
  {
    id: 'fossil-rex',
    name: 'T-REX',
    emoji: '🦖',
    onset: 'T',
    rime: 'REX',
    prompt: 'Excavate the fossil blocks for T-REX!',
    speechText: 'Young paleontologist, excavate T-REX! Find the onset T, then rime REX!',
    distractors: ['M', 'PIG'],
  },
  {
    id: 'fossil-bone',
    name: 'BONE',
    emoji: '🦴',
    onset: 'B',
    rime: 'ONE',
    prompt: 'Excavate the fossil blocks for B-ONE!',
    speechText: 'Dig up ancient BONE! Find B, then ONE!',
    distractors: ['S', 'HAT'],
  },
  {
    id: 'fossil-roar',
    name: 'ROAR',
    emoji: '🦕',
    onset: 'R',
    rime: 'OAR',
    prompt: 'Excavate the fossil blocks for R-OAR!',
    speechText: 'Hear the fossil ROAR! Find R, then OAR!',
    distractors: ['L', 'CAT'],
  },
  {
    id: 'fossil-claw',
    name: 'CLAW',
    emoji: '🐾',
    onset: 'CL',
    rime: 'AW',
    prompt: 'Excavate the fossil blocks for CL-AW!',
    speechText: 'Excavate the sharp CLAW! Find blend CL, then AW!',
    distractors: ['D', 'SUN'],
  },
  {
    id: 'fossil-tail',
    name: 'TAIL',
    emoji: '🦎',
    onset: 'T',
    rime: 'AIL',
    prompt: 'Excavate the fossil blocks for T-AIL!',
    speechText: 'Excavate the mighty TAIL! Find T, then AIL!',
    distractors: ['F', 'BED'],
  },
];

export function getDinoTarget(index = 0) {
  return DINO_TARGETS[index % DINO_TARGETS.length];
}
