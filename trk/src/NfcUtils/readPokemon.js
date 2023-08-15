import NfcManager from 'react-native-nfc-manager';

async function readPokemon() {
  const climb = {};
  let tagData = [];
  let respBytes = [];

  respBytes = await NfcManager.nfcAHandler.transceive([0x30, 4]);
  if (respBytes.length !== 16) {
    throw new Error('fail to read');
  }
  tagData = [...tagData, ...respBytes];

  // Read blocks for the name (blocks 5-9)
  for (let i = 5; i <= 9; i++) {
    respBytes = await NfcManager.nfcAHandler.transceive([0x30, i]);
    if (respBytes.length !== 4) {
      throw new Error('fail to read');
    }
    tagData = [...tagData, ...respBytes];
  }

  climb.nameLength = (tagData[0] << 8) + tagData[1];
  climb.difficulty = (tagData[2] << 8) + tagData[3];

  let nameBytes = [];
  for (let i = 0; i < climb.nameLength; i++) {
    nameBytes.push(tagData[4 + i]);
  }

  climb.name = nameBytes.reduce((acc, c) => {
    return acc + String.fromCharCode(c);
  }, '');

  return [climb, tagData];
}

export default readPokemon;