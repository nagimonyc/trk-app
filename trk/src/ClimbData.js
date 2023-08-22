const Difficulty = {
  // usa indoor climbing grading system
  // https://en.wikipedia.org/wiki/Grade_(climbing)#Bouldering
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
};

const WallList = [
  {
    name: 'a',
    description: 'Wall with a low angle',
    difficulty: Difficulty.V0,
  },
  {
    name: 'b',
    description: 'Wall with a 90 degree angle',
    difficulty: Difficulty.V4,
  },
  {
    name: 'c',
    description: 'Wall with an angle greater than 90 degrees',
    difficulty: Difficulty.V8,
  },
  {
    name: 'd',
    description: 'Wall with an angle greater than 90 degrees',
    difficulty: Difficulty.V12,
  },
  {
    name: 'e',
    description: 'Wall with an angle greater than 90 degrees',
    difficulty: Difficulty.V16,
  },
];

const WallMap = WallList.reduce((acc, w) => {
  acc[w.name] = w;
  return acc;
}, {});

export { WallList, WallMap };


// const Type = {
//   Grass: 1,
//   Fire: 2,
//   Wather: 3,
//   Electric: 4,
//   Ground: 5,
//   Bug: 6,
//   Rock: 7,
//   Poison: 8,
// };

// const PokemonList = [
//   {
//     name: 'Bulbasaur',
//     description: 'Awesome pokemon',
//     no: 1,
//     type: [Type.Grass, Type.Poison],
//     hp: 3,
//     atk: 3,
//     def: 3,
//     satk: 4,
//     sdef: 4,
//     spd: 3,
//   },
//   {
//     name: 'Charmander',
//     description: 'Awesome pokemon',
//     no: 4,
//     type: [Type.Fire],
//     hp: 3,
//     atk: 4,
//     def: 3,
//     satk: 4,
//     sdef: 3,
//     spd: 4,
//   },
//   {
//     name: 'Squirtle',
//     description: 'Awesome pokemon',
//     no: 7,
//     type: [Type.Wather],
//     hp: 3,
//     atk: 3,
//     def: 4,
//     satk: 3,
//     sdef: 4,
//     spd: 3,
//   },
//   {
//     name: 'Pikachu',
//     description: 'Awesome pokemon',
//     no: 25,
//     type: [Type.Electric],
//     hp: 3,
//     atk: 4,
//     def: 3,
//     satk: 3,
//     sdef: 3,
//     spd: 6,
//   },
//   {
//     name: 'Geodude',
//     description: 'Awesome pokemon',
//     no: 74,
//     type: [Type.Ground, Type.Rock],
//     hp: 3,
//     atk: 5,
//     def: 6,
//     satk: 2,
//     sdef: 2,
//     spd: 2,
//   },
// ];

// const PokemonMap = PokemonList.reduce((acc, p) => {
//   acc[p.name] = p;
//   return acc;
// }, {});

// export {PokemonList, PokemonMap};
