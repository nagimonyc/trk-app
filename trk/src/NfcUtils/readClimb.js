import NfcManager from 'react-native-nfc-manager';

async function readClimb() {
  let climbIdBytes = [];

  // Read 16 bytes starting from block 4
  let respBytes = await NfcManager.nfcAHandler.transceive([0x30, 4]);
  if (respBytes.length !== 16) {
    throw new Error('Fail to read starting block 4');
  }
  climbIdBytes = [...climbIdBytes, ...respBytes.slice(0, 16)];

  // Read 4 bytes starting from block 8
  respBytes = await NfcManager.nfcAHandler.transceive([0x30, 8]);
  if (respBytes.length !== 16) {
    throw new Error('Fail to read starting block 8');
  }
  climbIdBytes = [...climbIdBytes, ...respBytes.slice(0, 4)];

  // Reconstruct Firestore Document ID
  const climbId = String.fromCharCode.apply(null, climbIdBytes).trim();

  return [climbId, climbIdBytes];
}

export default readClimb;