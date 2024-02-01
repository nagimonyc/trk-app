import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image
} from 'react-native';

function AndroidPrompt(props, ref) {
  console.log('[TEST] AndroidPrompt called');
  const { onCancelPress } = props;
  const [_visible, _setVisible] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [hintText, setHintText] = React.useState('');
  const animValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    console.log('[TEST] AndroidPrompt called');
    if (ref) {
      ref.current = {
        setVisible: _setVisible,
        setHintText,
      };
    }
  }, [ref]);

  React.useEffect(() => {
    console.log('[TEST] AndroidPrompt useEffect called');
    if (_visible) {
      setVisible(true);
      Animated.timing(animValue, {
        duration: 300,
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animValue, {
        duration: 300,
        toValue: 0,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        setHintText('');
      });
    }
  }, [_visible, animValue]);

  const backdropAnimStyle = {
    opacity: animValue,
  };

  const promptAnimStyle = {
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [500, 0],
        }),
      },
    ],
  };

  return (
    <Modal visible={visible} transparent={true}>
      <View style={styles.content}>
        <Animated.View
          style={[styles.backdrop, StyleSheet.absoluteFill, backdropAnimStyle]}
        />

        <Animated.View style={[styles.prompt, promptAnimStyle]}>
          <Text style={styles.hint}>{hintText || 'Ready to Scan NFC'}</Text>
          <Image source={require('../../assets/nfc.gif')} style={{width: 100, height: 100, marginBottom: 20}}/>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              onCancelPress();
              _setVisible(false);
            }}>
            <Text style={{color: '#fe8100'}}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  prompt: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    width: Dimensions.get('window').width - 2 * 20,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 20,
    marginBottom: 20,
    color: 'black',
  },
  btn: {
    borderWidth: 1.5,
    borderColor: '#fe8100',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '40%',
    display:'flex',
    justifyContent:'center',
    alignItems:'center'  
  },
});

export default React.forwardRef(AndroidPrompt);
