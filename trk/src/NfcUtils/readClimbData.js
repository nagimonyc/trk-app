import NfcManager from 'react-native-nfc-manager';

async function readClimbData() {
  const climbData = {};
  let tagData = [];
  let respBytes = [];

  // Read difficulty from block 4
  respBytes = await NfcManager.nfcAHandler.transceive([0x30, 4]);
  if (respBytes.length !== 16) {
    throw new Error('fail to read');
  }
  tagData = [...tagData, ...respBytes];
  climbData.difficulty = respBytes[0];

  // Read name from blocks 5-9
  let nameBytes = [];
  for (let i = 5; i <= 9; i++) {
    respBytes = await NfcManager.nfcAHandler.transceive([0x30, i]);
    if (respBytes.length !== 16) {
      throw new Error('fail to read');
    }
    tagData = [...tagData, ...respBytes];
    nameBytes.push(...respBytes.slice(0, 4)); // Extracting first four bytes and adding to nameBytes
  }

  // Converting bytes to string and removing null characters
  climbData.name = nameBytes.reduce((acc, c) => {
    return acc + String.fromCharCode(c);
  }, '').replace(/\0/g, '');

  return [climbData, tagData];
}

export default readClimbData;

// /* eslint-disable no-bitwise */
// import NfcManager from 'react-native-nfc-manager';

// async function readPokemon() {
//   const pokemon = {};
//   let tagData = [];
//   let respBytes = [];

//   respBytes = await NfcManager.nfcAHandler.transceive([0x30, 4]);
//   if (respBytes.length !== 16) {
//     throw new Error('fail to read');
//   }
//   tagData = [...tagData, ...respBytes];
//   respBytes = await NfcManager.nfcAHandler.transceive([0x30, 8]);
//   if (respBytes.length !== 16) {
//     throw new Error('fail to read');
//   }
//   tagData = [...tagData, ...respBytes];

//   pokemon.no = (tagData[0] << 8) + tagData[1];
//   pokemon.type = [tagData[2], tagData[3]];
//   pokemon.hp = tagData[4];
//   pokemon.atk = tagData[5];
//   pokemon.def = tagData[6];
//   pokemon.satk = tagData[8];
//   pokemon.sdef = tagData[9];
//   pokemon.spd = tagData[10];

//   let nameBytes = [];
//   let idx = 12;
//   while (idx >= nameBytes.length) {
//     const c = tagData[idx];
//     if (c === 0) {
//       break;
//     }

//     nameBytes.push(c);
//     idx += 1;
//   }

//   pokemon.name = nameBytes.reduce((acc, c) => {
//     return acc + String.fromCharCode(c);
//   }, '');

//   return [pokemon, tagData];
// }

// export default readPokemon;
