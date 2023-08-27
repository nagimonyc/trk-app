import NfcManager from 'react-native-nfc-manager';

async function writeClimb(climbID) {
  if (typeof climbID !== 'string' || climbID.length > 16) {
    throw new Error('climbID must be a string of 16 characters or less.');
  }

  const firstBlock = climbID.slice(0, 8).split('').map(c => c.charCodeAt(0));
  const secondBlock = climbID.slice(8).split('').map(c => c.charCodeAt(0));

  while (firstBlock.length < 8) firstBlock.push(0);
  while (secondBlock.length < 8) secondBlock.push(0);

  const respBytes1 = await NfcManager.nfcAHandler.transceive([0xa2, 4, ...firstBlock]);
  console.warn('block 4', firstBlock, respBytes1);
  if (respBytes1[0] !== 0xa) {
    throw new Error('fail to write block 4');
  }

  const respBytes2 = await NfcManager.nfcAHandler.transceive([0xa2, 5, ...secondBlock]);
  console.warn('block 5', secondBlock, respBytes2);
  if (respBytes2[0] !== 0xa) {
    throw new Error('fail to write block 5');
  }
}

export default writeClimb;


