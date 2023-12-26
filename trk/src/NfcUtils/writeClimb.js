import NfcManager from 'react-native-nfc-manager';

async function writeClimb(climbID, grade) {
  if (typeof climbID !== 'string' || climbID.length !== 20) {
    throw new Error('climbID must be a string of exactly 20 characters.');
  }
  //Following French convention (<=3 chars)
  if (typeof grade !== 'string' || grade.length > 3) {
    throw new Error('grade must be a string of less than or equal to 3 characters, by French convention.');
  }
  console.warn('The grade is: ', grade);

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

  //Now adding the grade right after
  //Grade will occupy exactly 1 block
  // Totally blocks 4-9 (6 blocks) store data, 15 onwards is the signature
  let block = [];
  let j = 0;
  for (; j < grade.length; j++) {
    block.push(grade.charCodeAt(j));
  }
  while (j < 4) {
    block.push(32);
    j=j+1;
  }
  blocks.push(block);
  //not adding it to returned bytes 
  allBytes = [...allBytes, ...block];

  // Assuming starting from block 4, change as necessary
  let startBlock = 4;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const respBytes = await NfcManager.nfcAHandler.transceive([0xa2, startBlock + i, ...block]);

    if (respBytes[0] !== 0xa) {
      throw new Error(`Failed to write block ${startBlock + i}`);
    }
  }
  console.log('Write successful! The last used block was: ' , (startBlock + blocks.length - 1));

  return allBytes;
}

export default writeClimb;
