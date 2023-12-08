import NfcManager from 'react-native-nfc-manager';
import * as HexUtils from '../Utils/HexUtils';
import * as Signer from '../Utils/Signer';

async function writeSignature(climbBytes) {
  const tag = await NfcManager.getTag();
  const msgHex = HexUtils.bytesToHex(climbBytes) + tag.id;
  console.warn('msg', msgHex);

  const sig = Signer.sign(msgHex);
  console.warn('sig', sig);
  const sigBytes = HexUtils.hexToBytes(sig.r + sig.s);

  const sigPageIdx = 12;
  for (let i = 0; i < sigBytes.length; i += 4) {
    console.log("sigBytes.length is ", sigBytes.length);
    const pageIdx = sigPageIdx + i / 4;
    const pageData = sigBytes.slice(i, i + 4);
    const respBytes = await NfcManager.nfcAHandler.transceive([
      0xa2,
      pageIdx,
      ...pageData,
    ]);
    console.warn(`page ${pageIdx}`, pageData, respBytes);
  }
  console.log('done');
}

export default writeSignature;
