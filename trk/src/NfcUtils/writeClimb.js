import NfcManager from 'react-native-nfc-manager';

async function writeClimb(climbID) {
  console.log(climbID);
  if (typeof climbID !== 'string' || climbID.length !== 20) {
    throw new Error('climbID must be a string of exactly 20 characters.');
  }

  const blocks = [];

  // Break the string down into 4-character pieces
  for (let i = 0; i < climbID.length; i += 4) {
    let subStr = climbID.substring(i, i + 4);
    let block = [];
    for (let j = 0; j < subStr.length; j++) {
      block.push(subStr.charCodeAt(j));
    }
    blocks.push(block);
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
}

export default writeClimb;

// import NfcManager from 'react-native-nfc-manager';

// async function writeClimb(climbID) {
//   console.log(climbID);
//   if (typeof climbID !== 'string') {
//     throw new Error('climbID must be a string of 16 characters or less.');
//   }
//   console.log('about to slice climbID');
//   const firstBlock = climbID.slice(0, 8).split('').map(c => c.charCodeAt(0));
//   if (firstBlock.length === 4) {
//     console.log("firstBlock is 4 bytes long.");
//   } else {
//     console.log(`firstBlock is ${firstBlock.length} bytes long.`);
//   }
//   const secondBlock = climbID.slice(8).split('').map(c => c.charCodeAt(0));
//   if (secondBlock.length === 4) {
//     console.log("secondBlock is 4 bytes long.");
//   } else {
//     console.log(`secondBlock is ${firstBlock.length} bytes long.`);
//   }

//   console.log('firstBlock', firstBlock);
//   while (firstBlock.length < 8) firstBlock.push(0);
//   console.log('secondBlock', secondBlock);
//   while (secondBlock.length < 8) secondBlock.push(0);

//   console.log('about to write transceive');
//   try {
//     const respBytes1 = await NfcManager.nfcAHandler.transceive([0xa2, 4, ...firstBlock]);
//     console.log('respBytes1', respBytes1);
//   } catch (ex) {
//     console.log("Error during first transceive: " + JSON.stringify(error));
//     console.error("Error during first transceive: ", JSON.stringify(error));
//   }

//   console.warn('block 4', firstBlock, respBytes1);
//   if (respBytes1[0] !== 0xa) {
//     throw new Error('fail to write block 4');
//   }

//   const respBytes2 = await NfcManager.nfcAHandler.transceive([0xa2, 5, ...secondBlock]);
//   console.warn('block 5', secondBlock, respBytes2);
//   if (respBytes2[0] !== 0xa) {
//     throw new Error('fail to write block 5');
//   }
//   console.log('about to return');
// }

// export default writeClimb;