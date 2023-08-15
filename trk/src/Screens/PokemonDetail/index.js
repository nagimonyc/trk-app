import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { Button } from 'react-native-paper';
import PokemonImage from '../../Components/PokemonImage'; // Assume this component displays climb images
import AndroidPrompt from '../../Components/AndroidPrompt';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import writePokemon from '../../NfcUtils/writePokemon'; // Modify this function accordingly
import ensurePasswordProtection from '../../NfcUtils/ensurePasswordProtection';

function PokemonDetail(props) {
  const androidPromptRef = React.useRef();
  const { navigation, route } = props;
  const { climb, allowCreate = false } = route.params;
  const [reveal, setReveal] = React.useState(allowCreate);
  const animValue = React.useRef(new Animated.Value(allowCreate ? 1 : 0))
    .current;
  const animValueLooped = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!allowCreate) {
      Animated.timing(animValue, {
        toValue: 1,
        duration: 600,
        delay: 3000,
        useNativeDriver: false,
      }).start(() => {
        setReveal(true);
      });
      Animated.loop(
        Animated.timing(animValueLooped, {
          toValue: 2,
          duration: 600,
          useNativeDriver: false,
        }),
        { iterations: 20 },
      ).start();
    }
  }, [animValue, animValueLooped, allowCreate]);

  const fadeIn = {
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 1],
        }),
      },
    ],
  };

  return (
    <View style={[styles.wrapper]}>
      <SafeAreaView />
      <View style={[styles.wrapper, styles.center]}>
        <Text style={styles.name}>{reveal ? climb.name : '???'}</Text>
        <View style={[styles.circle, styles.center]}>
          <Animated.View style={[styles.absPos, fadeIn]}>
            <PokemonImage name={climb.name} style={styles.img} resizeMode="cover" />
          </Animated.View>
        </View>
        <View style={styles.profile}>
          <Text style={styles.profileTxt}>
            Difficulty: {reveal ? climb.difficulty : '???'}
          </Text>
          {/* Include other climb attributes if desired */}
        </View>
      </View>
      {allowCreate && (
        <View style={styles.center}>
          <Button
            style={styles.btn}
            mode="contained"
            onPress={async () => {
              if (Platform.OS === 'android') {
                androidPromptRef.current.setVisible(true);
              }

              try {
                await NfcManager.requestTechnology(NfcTech.NfcA);
                await ensurePasswordProtection();
                await writePokemon(climb);
              } catch (ex) {
                console.log(ex);
                console.warn(ex);
              } finally {
                NfcManager.cancelTechnologyRequest();
              }

              if (Platform.OS === 'android') {
                androidPromptRef.current.setVisible(false);
              }
            }}>
            CREATE
          </Button>
        </View>
      )}

      <TouchableOpacity
        style={styles.close}
        onPress={() => {
          navigation.goBack();
        }}>
        <Icon name="chevron-left" size={30} />
      </TouchableOpacity>

      <AndroidPrompt
        ref={androidPromptRef}
        onCancelPress={() => NfcManager.cancelTechnologyRequest()}
      />
      <SafeAreaView />
    </View>
  );
}


const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: 'orange',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  absPos: {
    position: 'absolute',
    left: 5,
    top: 5,
  },
  img: {
    width: 220,
    height: 220,
  },
  name: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  circle: {
    width: 230,
    height: 230,
    backgroundColor: 'white',
    borderRadius: 115,
    marginVertical: 60,
  },
  profile: {
    padding: 15,
    borderRadius: 9,
    alignSelf: 'stretch',
    backgroundColor: 'white',
    marginHorizontal: 40,
  },
  profileTxt: {
    fontSize: 18,
    lineHeight: 24,
  },
  btn: {
    width: 300,
  },
  close: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 20,
    left: 10,
    width: 32,
    height: 32,
  },
});


export default PokemonDetail;
