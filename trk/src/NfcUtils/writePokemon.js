

import NfcManager from 'react-native-nfc-manager';

async function writePokemon(climb) {
  let blockData;
  let respBytes = [];
  let allBytes = [];

  if (climb.name.length > 20) {
    throw new Error('Climb name exceeds the allowed length of 20 characters');
  }

  // Block 4
  blockData = [0, 0, 0, 0];
  blockData[0] = climb.name.length;
  blockData[2] = climb.difficulty >>> 8;
  blockData[3] = climb.difficulty & 0xff;
  respBytes = await NfcManager.nfcAHandler.transceive([0xa2, 4, ...blockData]);
  if (respBytes[0] !== 0xa) {
    throw new Error('fail to write');
  }
  allBytes = [...allBytes, ...blockData];

  // Block 5 ~ 9: the name of the climb (20 characters)
  let nameBytes = Array.from(climb.name).map((c) => c.charCodeAt(0));

  while (nameBytes.length < 20) {
    nameBytes.push(0);
  }

  const nameBlockIdx = 5;
  for (let i = 0; i < 5; i++) {
    blockData = nameBytes.slice(4 * i, 4 * i + 4);
    respBytes = await NfcManager.nfcAHandler.transceive([
      0xa2,
      nameBlockIdx + i,
      ...blockData,
    ]);
    if (respBytes[0] !== 0xa) {
      throw new Error('fail to write');
    }
  }
  allBytes = [...allBytes, ...nameBytes];

  return allBytes;
}

export default writePokemon;