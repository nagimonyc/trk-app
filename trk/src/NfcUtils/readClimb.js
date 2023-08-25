import NfcManager from 'react-native-nfc-manager';

async function readClimb() {
  let climbIdBytes = [];
  const respBytes = await NfcManager.nfcAHandler.transceive([0x30, 4]);
  if (respBytes.length !== 16) {
    throw new Error('Failed to read climb ID');
  }
  climbIdBytes = [...climbIdBytes, ...respBytes];
  const climbId = climbIdBytes.map(byte => String.fromCharCode(byte)).join('').trim();
  return climbId;
}

export default readClimb;
