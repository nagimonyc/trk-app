import NfcManager from 'react-native-nfc-manager';

async function writeClimb(climbID) {
  console.log(climbID);
  if (typeof climbID !== 'string' || climbID.length !== 20) {
    throw new Error('climbID must be a string of exactly 20 characters.');
  }

  const blocks = [];
  let allBytes = [];

  // Break the string down into 4-character pieces
  for (let i = 0; i < climbID.length; i += 4) {
    let subStr = climbID.substring(i, i + 4);
    let block = [];
    for (let j = 0; j < subStr.length; j++) {
      block.push(subStr.charCodeAt(j));
    }
    blocks.push(block);
    allBytes = [...allBytes, ...block];
  }

  console.log('Blocks:', blocks);

  // Assuming starting from block 4, change as necessary
  let startBlock = 4;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    console.log(`Writing to block ${startBlock + i}:`, block);
    const respBytes = await NfcManager.nfcAHandler.transceive([0xa2, startBlock + i, ...block]);

    if (respBytes[0] !== 0xa) {
      throw new Error(`Failed to write block ${startBlock + i}`);
    }
  }
  console.log('Write successful');

  return allBytes;
}

export default writeClimb;