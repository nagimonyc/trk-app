/* eslint-disable no-bitwise */
import NfcManager from 'react-native-nfc-manager';

async function writeClimb(climbID) {
  let blockData;
  let respBytes = [];

  // Block 4
  // - 0, 1: climb ID
  blockData = [0, 0];
  blockData[0] = climbID >>> 8;
  blockData[1] = climbID & 0xff;
  respBytes = await NfcManager.nfcAHandler.transceive([0xa2, 4, ...blockData]);
  console.warn('block 4', blockData, respBytes);
  if (respBytes[0] !== 0xa) {
    throw new Error('fail to write');
  }
}

export default writeClimb;