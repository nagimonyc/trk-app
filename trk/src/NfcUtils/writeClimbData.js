import NfcManager from 'react-native-nfc-manager'; // Importing the NfcManager library

async function writeClimbData(wall) {
  let blockData; // Declaring variable to hold data for each block
  let respBytes = []; // Declaring variable to hold response bytes from NFC write operations
  let allBytes = []; // Declaring variable to collect all bytes written

  // Block 4: Writing difficulty information
  blockData = [wall.difficulty, 0, 0, 0]; // Preparing data: difficulty followed by three zeros
  respBytes = await NfcManager.nfcAHandler.transceive([0xa2, 4, ...blockData]); // Sending write command to block 4 with data
  if (respBytes[0] !== 0xa) { // Checking response byte for success (0xa)
    throw new Error('fail to write'); // Throwing error if write failed
  }
  allBytes = [...allBytes, ...blockData]; // Adding written bytes to the collection

  // Block 5-9: Writing the name of the wall
  let nameBytes = Array.from(wall.name).map((_, i) => wall.name.charCodeAt(i)); // Converting name to bytes

  // Padding nameBytes with zeros to ensure fixed length
  while (nameBytes.length < 20) {
    nameBytes.push(0); // Adding zeros to pad the name
  }

  const nameBlockIdx = 5; // Starting index for name blocks
  for (let i = 0; i < 5; i++) { // Looping through 5 blocks
    blockData = nameBytes.slice(4 * i, 4 * i + 4); // Getting the next four bytes of the name
    respBytes = await NfcManager.nfcAHandler.transceive([0xa2, nameBlockIdx + i, ...blockData]); // Sending write command with data
    if (respBytes[0] !== 0xa) { // Checking response byte for success
      throw new Error('fail to write'); // Throwing error if write failed
    }
  }
  allBytes = [...allBytes, ...nameBytes]; // Adding written name bytes to the collection

  return allBytes; // Returning all bytes written
}

export default writeClimbData; // Exporting the write function





// }
//   blockData = [0, 0, 0, 0];
//   blockData[0] = pokemon.hp;
//   blockData[1] = pokemon.atk;
//   blockData[2] = pokemon.def;
//   respBytes = await NfcManager.nfcAHandler.transceive([0xa2, 5, ...blockData]);
//   console.warn('block 5', blockData, respBytes);
//   if (respBytes[0] !== 0xa) {
//     throw new Error('fail to write');
//   }
//   allBytes = [...allBytes, ...blockData];

//   // Block 6
//   // - 0: satk
//   // - 1: sdef
//   // - 2: spd
//   // - 3: 0
//   blockData = [0, 0, 0, 0];
//   blockData[0] = pokemon.satk;
//   blockData[1] = pokemon.sdef;
//   blockData[2] = pokemon.spd;
//   respBytes = await NfcManager.nfcAHandler.transceive([0xa2, 6, ...blockData]);
//   console.warn('block 6', blockData, respBytes);
//   if (respBytes[0] !== 0xa) {
//     throw new Error('fail to write');
//   }
//   allBytes = [...allBytes, ...blockData];

//   // Block 7 ~ 11: the name of the pokemon
//   let nameBytes = Array.from(pokemon.name).map((_, i) => {
//     return pokemon.name.charCodeAt(i);
//   });

//   while (nameBytes.length < 20) {
//     nameBytes.push(0);
//   }

//   const nameBlockIdx = 7;
//   for (let i = 0; i < 5; i++) {
//     blockData = nameBytes.slice(4 * i, 4 * i + 4);
//     respBytes = await NfcManager.nfcAHandler.transceive([
//       0xa2,
//       nameBlockIdx + i,
//       ...blockData,
//     ]);
//     console.warn(`block ${nameBlockIdx + i}`, blockData);
//     if (respBytes[0] !== 0xa) {
//       throw new Error('fail to write');
//     }
//   }
//   allBytes = [...allBytes, ...nameBytes];

//   return allBytes;
// }

// export default writePokemon;
