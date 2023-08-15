const ClimbDifficulty = {
  // V grading system in the usa
  V0: 0,
  V1: 1,
  V2: 2,
  V3: 3,
  V4: 4,
  V5: 5,
  V6: 6,
  V7: 7,
  V8: 8,
  V9: 9,
  V10: 10,
  V11: 11,
  V12: 12,
  V13: 13,
  V14: 14,
  V15: 15,
  V16: 16,
  V17: 17,
}

const ClimbList = [
  {
    // copy what's been done to the PokemonList variable but with climbs
    name: 'The Nose',
    description: 'Tough climb for beginners',
    difficulty: ClimbDifficulty.V5,
  },
  {
    name: 'The Arch',
    description: 'A climb for the ages',
    difficulty: ClimbDifficulty.V10,

  },
  {
    name: 'The Slab',
    description: 'A tricky climb',
    difficulty: ClimbDifficulty.V3,
  },
  {
    name: 'The Overhang',
    description: 'Easy to start, hard to finish',
    difficulty: ClimbDifficulty.V7,
  },
  {
    name: 'The Cave',
    description: 'The hardest in town',
    difficulty: ClimbDifficulty.V12,
  }
]

const ClimbMap = ClimbList.reduce((acc, p) => {
  acc[p.name] = p;
  return acc;
}, {});

export { ClimbList, ClimbMap };
