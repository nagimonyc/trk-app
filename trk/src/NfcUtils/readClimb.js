import NfcManager from 'react-native-nfc-manager';

async function readClimb() {
  let climbIdBytes = [];
  let gradeBytes = [];
  let colorBytes = [];

  // Read 16 bytes starting from block 4 (default)
  let respBytes = await NfcManager.nfcAHandler.transceive([0x30, 4]);
  if (respBytes.length !== 16) {
    throw new Error('Fail to read starting block 4');
  }
  climbIdBytes = [...climbIdBytes, ...respBytes.slice(0, 16)];

  // Read 16 bytes starting from block 8 (default)
  respBytes = await NfcManager.nfcAHandler.transceive([0x30, 8]);
  if (respBytes.length !== 16) {
    throw new Error('Fail to read starting block 8');
  }
  climbIdBytes = [...climbIdBytes, ...respBytes.slice(0, 4)];
  gradeBytes = [...gradeBytes, ...respBytes.slice(4, 12)];
  colorBytes = [...colorBytes, ...respBytes.slice(12, 16)]

  respBytes = await NfcManager.nfcAHandler.transceive([0x30, 12]);
  if (respBytes.length !== 16) {
    throw new Error('Fail to read starting block 8');
  }
  colorBytes = [...colorBytes, ...respBytes.slice(0, 8)]

  // Reconstruct Firestore Document ID
  const climbId = String.fromCharCode.apply(null, climbIdBytes).trim();
  //Reconstructed climb grade string
  const grade = String.fromCharCode.apply(null, gradeBytes).trim();
  //Reconstructed color string
  const color = String.fromCharCode.apply(null, colorBytes).trim();

  console.log('The grade is: ', grade);
  console.log('The color is: ', color);
  console.log('Proceeding...');
  return [climbId, climbIdBytes, grade, color];
}

export default readClimb;