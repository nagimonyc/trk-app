import NfcManager from 'react-native-nfc-manager';

async function writeClimb(climbID) {
  if (climbID.length > 16) {
    throw new Error('climbID is too long, it must be 16 characters or less.');
  }

  // Convert the climbID string to an array of ASCII values
  const blockData = climbID.split('').map(c => c.charCodeAt(0));

  // If the climbID is less than 16 characters, fill the rest of the block with 0
  while (blockData.length < 16) {
    blockData.push(0);
  }

  const respBytes = await NfcManager.nfcAHandler.transceive([0xa2, 4, ...blockData]);
  console.warn('block 4', blockData, respBytes);

  if (respBytes[0] !== 0xa) {
    throw new Error('fail to write');
  }
}

export default writeClimb;