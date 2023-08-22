import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Button } from 'react-native-paper';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import readClimbData from '../../NfcUtils/readClimbData';
import verifySignature from '../../NfcUtils/verifySignature';
import Image from '../../Components/Image';
import AndroidPrompt from '../../Components/AndroidPrompt';

function HomeScreen(props) {
  const { navigation } = props;
  const androidPromptRef = React.useRef();

  const [hasNfc, setHasNfc] = React.useState(null);
  const [enabled, setEnabled] = React.useState(null);

  React.useEffect(() => {
    async function checkNfc() {
      const supported = await NfcManager.isSupported();
      if (supported) {
        await NfcManager.start();
        setEnabled(await NfcManager.isEnabled());
      }
      setHasNfc(supported);
    }

    checkNfc();
  }, []);

  function renderNfcButtons() {
    if (hasNfc === null) {
      return null;
    } else if (!hasNfc) {
      return <Text>Your device doesn't support NFC</Text>;
    } else if (!enabled) {
      return (
        <>
          <Text>Your NFC is not enabled!</Text>
          <TouchableOpacity onPress={() => NfcManager.goToNfcSetting()}>
            <Text>GO TO NFC SETTINGS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              setEnabled(await NfcManager.isEnabled());
            }}>
            <Text>CHECK AGAIN</Text>
          </TouchableOpacity>
        </>
      );
    } else {
      return (
        <>
          <Button
            mode="contained"
            style={styles.btn}
            onPress={() => {
              navigation.navigate('List');
            }}>
            Create climb
          </Button>
          <Button
            mode="contained"
            style={styles.btn}
            onPress={async () => {
              if (Platform.OS === 'android') {
                androidPromptRef.current.setVisible(true);
              }
              try {
                await NfcManager.requestTechnology(NfcTech.NfcA);
                const [climbName, climbDifficulty] = await readClimbData(); // Destructuring the array to get name and difficulty
                const result = await verifySignature(climbDifficulty);
                if (result) {
                  console.log("all good");
                  console.log(`Climb Name: ${climbName}`);
                  console.log(`Climb Difficulty: ${climbDifficulty}`);
                } else {
                  Alert.alert('Error', 'Signature Validation Fail!', [{ text: 'OK' }]);
                }
              } catch (ex) {
                console.warn(ex);
              } finally {
                NfcManager.cancelTechnologyRequest();
              }
              if (Platform.OS === 'android') {
                androidPromptRef.current.setVisible(false);
              }
            }}>
            Identify climb
          </Button>
        </>
      );
    }
  }

  return (
    <>
      <View style={[styles.wrapper, styles.center]}>
        <Image source={require('../../../images/pokeball.png')} style={styles.banner} resizeMode="contain" />
        {renderNfcButtons()}
      </View>
      <AndroidPrompt
        ref={androidPromptRef}
        onCancelPress={() => NfcManager.cancelTechnologyRequest()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    width: 240,
    marginBottom: 20,
  },
  banner: {
    width: 240,
    height: 240,
    marginBottom: 60,
  },
});

export default HomeScreen;





// import React from 'react';
// import {
//   Text,
//   View,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   Platform,
// } from 'react-native';
// import { Button } from 'react-native-paper';
// import NfcManager, { NfcTech } from 'react-native-nfc-manager';
// import readClimbData from '../../NfcUtils/readClimbData';
// import verifySignature from '../../NfcUtils/verifySignature';
// import Image from '../../Components/Image';
// import AndroidPrompt from '../../Components/AndroidPrompt';

// function HomeScreen(props) {
//   const { navigation } = props;
//   const androidPromptRef = React.useRef();

//   const [hasNfc, setHasNfc] = React.useState(null);
//   const [enabled, setEnabled] = React.useState(null);

//   React.useEffect(() => {
//     async function checkNfc() {
//       const supported = await NfcManager.isSupported();
//       if (supported) {
//         await NfcManager.start();
//         setEnabled(await NfcManager.isEnabled());
//       }
//       setHasNfc(supported);
//     }

//     checkNfc();
//   }, []);

//   function renderNfcButtons() {
//     if (hasNfc === null) {
//       return null;
//     } else if (!hasNfc) {
//       return <Text>You device doesn't support NFC</Text>;
//     } else if (!enabled) {
//       return (
//         <>
//           <Text>Your NFC is not enabled!</Text>

//           <TouchableOpacity
//             onPress={() => {
//               NfcManager.goToNfcSetting();
//             }}>
//             <Text>GO TO NFC SETTINGS</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={async () => {
//               setEnabled(await NfcManager.isEnabled());
//             }}>
//             <Text>CHECK AGAIN</Text>
//           </TouchableOpacity>
//         </>
//       );
//     } else {
//       return (
//         <>
//           <Button
//             mode="contained"
//             style={styles.btn}
//             onPress={() => {
//               navigation.navigate('List');
//             }}>
//             Create climb
//           </Button>
//           <Button
//             mode="contained"
//             style={styles.btn}
//             onPress={async () => {
//               if (Platform.OS === 'android') {
//                 androidPromptRef.current.setVisible(true);
//               }

//               try {
//                 await NfcManager.requestTechnology(NfcTech.NfcA);
//                 const [climb, climbBytes] = await readClimbData();
//                 const result = await verifySignature(climbBytes);
//                 if (result) {
//                   console.log("all good");
//                   console.log(climb);
//                   console.log(climbBytes);
//                 } else {
//                   Alert.alert('Error', 'Signature Validation Fail!', [
//                     { text: 'OK' },
//                   ]);
//                 }
//               } catch (ex) {
//                 console.warn(ex);
//               } finally {
//                 NfcManager.cancelTechnologyRequest();
//               }

//               if (Platform.OS === 'android') {
//                 androidPromptRef.current.setVisible(false);
//               }
//             }}>
//             Identify climb
//           </Button>
//         </>
//       );
//     }
//   }

//   return (
//     <>
//       <View style={[styles.wrapper, styles.center]}>
//         <Image
//           source={require('../../../images/pokeball.png')}
//           style={styles.banner}
//           resizeMode="contain"
//         />
//         {renderNfcButtons()}
//       </View>
//       <AndroidPrompt
//         ref={androidPromptRef}
//         onCancelPress={() => NfcManager.cancelTechnologyRequest()}
//       />
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   wrapper: {
//     flex: 1,
//   },
//   center: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   btn: {
//     width: 240,
//     marginBottom: 20,
//   },
//   banner: {
//     width: 240,
//     height: 240,
//     marginBottom: 60,
//   },
// });

// export default HomeScreen;
