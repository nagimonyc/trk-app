import NfcManager from 'react-native-nfc-manager';

async function readClimb() {
  let climbIdBytes = [];

  const respBytes1 = await NfcManager.nfcAHandler.transceive([0x30, 4]);
  const respBytes2 = await NfcManager.nfcAHandler.transceive([0x30, 5]);

  if (respBytes1.length !== 10 || respBytes2.length !== 10) {
    throw new Error('Failed to read climb ID');
  }

  climbIdBytes = [...climbIdBytes, ...respBytes1, ...respBytes2];
  const climbId = climbIdBytes.map(byte => String.fromCharCode(byte)).join('').trim();
  return climbId;
}

export default readClimb;
