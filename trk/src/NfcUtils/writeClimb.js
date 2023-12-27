import NfcManager from 'react-native-nfc-manager';

async function writeClimb(climbID, grade, color) {
  if (typeof climbID !== 'string' || climbID.length !== 20) {
    throw new Error('climbID must be a string of exactly 20 characters.');
  }
  //Following U.S convention (<=5 chars)
  if (typeof grade !== 'string' || grade.length > 5) {
    throw new Error('grade must be a string of less than or equal to 5 characters, by U.S convention.');
  }

  if (typeof color !== 'string' || color.length > 10) {
    throw new Error('color must be a string of less than or equal to 10 characters.');
  }



  console.warn('The grade is: ', grade);
  console.warn('The color is: ', color);
  
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
  //Grade will occupy exactly 2 blocks
  // Totally blocks 4-10 (6 blocks) store data UPTO NOW, 15 onwards is the signature
  let block = [];
  let j = 0;
  for (; j < 4; j++) {
    if (j<grade.length) {
      block.push(grade.charCodeAt(j));
    }
    else {
      block.push(32);
    }
  }
  blocks.push(block);
  allBytes = [...allBytes, ...block];
  block = [];
  while (j < 8) {
    if (j<grade.length) {
      block.push(grade.charCodeAt(j));
    }
    else {
      block.push(32);
    }
    j=j+1;
  }
  blocks.push(block);
  //not adding it to returned bytes 
  allBytes = [...allBytes, ...block];

  //Now adding color (3 blocks)
  for (let i = 0; i < 12; i += 4) {
    if (i+4 <= color.length) {
      let subStr = color.substring(i, i + 4);
      let block = [];
      for (let j = 0; j < subStr.length; j++) {
        block.push(subStr.charCodeAt(j));
      }
      blocks.push(block);
      allBytes = [...allBytes, ...block];
    }
    else {
      let subStr = color.substring(i);
      let block = [];
      for (let j = 0; j < 4; j++) {
        if (j<subStr.length) {
          block.push(subStr.charCodeAt(j));
        }
        else {
          block.push(32);
        }
      }
      blocks.push(block);
      allBytes = [...allBytes, ...block];
    }
  }

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
