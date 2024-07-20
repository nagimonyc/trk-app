import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Alert, TouchableWithoutFeedback, Keyboard, SafeAreaView, Switch, TouchableOpacity, Image } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';

GoogleSignin.configure({
  webClientId: '786555738802-pisnqupfbs7oqfqvba5vb5b83dvf8jfn.apps.googleusercontent.com',
});

const SignInUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email and password must not be empty');
      return;
    }
    auth().signInWithEmailAndPassword(email, password)
      .then(() => {
        console.log('User signed in with email and password!');
      })
      .catch(error => {
        Alert.alert('Invalid email or password. Passwords are case sensitive');
      });
  };

  const handleSignUp = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email and password must not be empty');
      return;
    }
    auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('User signed up:', user);
        firestore().collection('users').doc(user.uid).set({
          email: user.email,
          uid: user.uid,
          timestamp: new Date(),
          username: user.email.split('@')[0],
          isNewUser: true,
          origin: 'app - signup',
        })
          .then(() => {
            console.log('User added to Firestore');
          })
          .catch((error) => {
            console.error('Error adding user to Firestore:', error);
          });
      })
      .catch(error => {
        if (error.code === 'auth/email-already-in-use') {
          Alert.alert('Email already in use')
        } else if (password.length < 6) {
          Alert.alert('Password must be at least 6 characters')
        } else if (error.code === 'auth/invalid-email') {
          Alert.alert('Must use a valid email')
        }
        else {
          Alert.alert('Something went wrong with signup')
        }
      });
  };

  const onGoogleButtonPress = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const data = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(data.idToken, data.accessToken);

      auth()
        .signInWithCredential(googleCredential)
        .then(userCredential => {
          console.log('Signed in with Google!', userCredential);
          manageFirestoreUserData(userCredential);
        })
        .catch(async error => {
          if (error.code === 'auth/account-exists-with-different-credential') {
            // Handle account linking
            const email = error.email;
            const pendingCred = googleCredential;
            console.log('Account exists with different credential:', email);

            const methods = await auth().fetchSignInMethodsForEmail(email);
            console.log('Sign-in methods for email:', methods);

            if (methods.includes(auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD)) {
              const password = prompt('Please provide the password for ' + email);

              auth()
                .signInWithEmailAndPassword(email, password)
                .then(userCredential => {
                  return userCredential.user.linkWithCredential(pendingCred);
                })
                .then(userCredential => {
                  console.log('Accounts successfully linked', userCredential);
                  manageFirestoreUserData(userCredential);
                })
                .catch(linkError => {
                  console.error('Error linking accounts', linkError);
                  Alert.alert('Error linking accounts', linkError.message);
                });
            } else {
              Alert.alert('Sign in using the method you originally registered with');
            }
          } else {
            console.error('Google Sign-In Error', error);
            Alert.alert('Google Sign-In Error', error.message);
          }
        });
    } catch (error) {
      console.error('Google Sign-In Error', error);
      Alert.alert('Google Sign-In Error', error.message);
    }
  };


  // Separate function to manage Firestore user data
  const manageFirestoreUserData = (userCredential) => {
    try {
      if (!userCredential) {
        console.error('User credential is undefined');
        return;
      }

      // useful logs. Google holds lots of info on the user, could be used later on.
      // console.log('User signed in:', userCredential);
      // console.log('User details:', userCredential.user);
      // console.log('Additional user info:', userCredential.additionalUserInfo);

      const userRef = firestore().collection('users').doc(userCredential.user.uid);

      if (userCredential.additionalUserInfo.isNewUser) {
        console.log('User is new');
        userRef.set({
          email: userCredential.user.email,
          uid: userCredential.user.uid,
          origin: 'app - Google',
          timestamp: new Date(),
          username: userCredential.user.email.split('@')[0],
          isNewUser: true,
        })
          .then(() => console.log('New user added to Firestore'))
          .catch((error) => console.error('Error adding new user to Firestore:', error));
      } else {
        console.log('User is existing');
        userRef.update({
          isNewUser: false,
          origin: 'web then app',
        })
          .then(() => console.log('Existing user updated in Firestore'))
          .catch((error) => console.error('Error updating existing user in Firestore:', error));
      }
    } catch (error) {
      console.error('Error in manageFirestoreUserData:', error);
    }
  };


  async function onAppleButtonPress() {
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });

    if (!appleAuthRequestResponse.identityToken) {
      throw new Error('Apple Sign-In failed - no identity token returned');
    }

    const { identityToken, nonce } = appleAuthRequestResponse;
    const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

    const userCredential = await auth().signInWithCredential(appleCredential);
    // To handle user object creation
    manageFirestoreUserData(userCredential);
  }

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    auth().sendPasswordResetEmail(email)
      .then(() => {
        Alert.alert("Password Reset", "Check your email to reset your password.");
      })
      .catch(error => {
        Alert.alert("Reset Password Error", error.message);
      });
  };

  const onGoogleButtonPressAndroidOnly = Platform.OS === 'android' ? onGoogleButtonPress : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoView}>
        <Image source={require('../../assets/long-logo.png')} style={styles.logo} />
      </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.formContainer}>
          <Text style={styles.fieldTitle}>Email</Text>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#c4c4c4"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <Text style={styles.fieldTitle}>Password</Text>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#c4c4c4"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          <Text style={[{ color: '#7c7c7c', alignSelf: 'flex-start', }]}>Password must contain at least 6 characters.</Text>
          <View style={styles.authButtonsContainer}>
            <TouchableOpacity onPress={handleSignIn} style={[styles.enterButton, { backgroundColor: 'white', borderColor: '#C3C3C3', marginLeft: 7 }]}>
              <Text style={[styles.enterText, { color: 'black' }]}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSignUp} style={[styles.enterButton, { backgroundColor: '#ff8100', borderColor: '#ff8100', marginRight: 7 }]}>
              <Text style={[styles.enterText, { color: 'white' }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
            <View style={styles.lineStyle} />
            <Text style={styles.orTextStyle}>or</Text>
            <View style={styles.lineStyle} />
          </View>
          <View>
            <TouchableOpacity
              onPress={onGoogleButtonPress}
              style={styles.alternateSignInButton}
            >
              <Image source={require('../../assets/google.png')} style={styles.googleIcon} />
              <Text style={styles.alternateSignInButtonText}>Continue with Google</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                onPress={onAppleButtonPress} // Ensure you have implemented onAppleButtonPress for handling the sign-in process
                style={styles.alternateSignInButton}
              >
                <Image source={require('../../assets/apple.png')} style={styles.appleIcon} />
                <Text style={styles.alternateSignInButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text onPress={handleForgotPassword} style={styles.forgotPasswordText}>
            Reset your password
          </Text>
          {/* <View style={styles.switchContainer}>
            <Text>Setter?</Text>
            <Switch onValueChange={toggleSwitchSetter} value={setterIsEnabled} />
            <Text>NYU Comp?</Text>
            <Switch onValueChange={toggleSwitchNyu} value={nyuCompIsEnabled} />
          </View> */}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

// Adjust styles accordingly
const styles = StyleSheet.create({
  // Your styles here
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingTop: '15%',
  },
  formContainer: {
    width: '90%',
    alignItems: 'center',
    marginTop: 20,
  },
  input: {
    width: '100%',
    height: 45,
    marginVertical: 8,
    borderWidth: 1.2,
    borderColor: '#C3C3C3',
    padding: 10,
    borderRadius: 5,
    color: 'black',
  },
  authButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    marginBottom: 10,
  },
  fieldTitle: {
    alignSelf: 'flex-start',
    marginTop: 12,
    color: 'black'
  },
  alternateSignInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f8f4',
    padding: 10,
    borderRadius: 4,
    marginTop: 15,
    width: 345,
    height: 50,
    borderWidth: 1,
    borderColor: 'black'
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  appleIcon: {
    width: 25,
    height: 25,
  },
  alternateSignInButtonText: {
    color: 'black',
    marginLeft: -10,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  forgotPasswordText: {
    color: '#7B7B7B',
    marginTop: 40,
  },
  switchContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  enterButton: {
    width: 151,
    height: 47,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 2.5,
  },
  logo: {
    width: 241,
    height: 66,
    resizeMode: 'contain',
  },
  logoView: {
    marginTop: 58,
  },
  enterText: {
    fontWeight: '700'
  },
  lineStyle: {
    flex: 1,
    height: 1,
    backgroundColor: '#7B7B7B',
    marginTop: 17,
  },

  orTextStyle: {
    textAlign: 'center',
    color: '#7B7B7B',
    paddingHorizontal: 15,
    marginTop: 15,
  },
});

export default SignInUp;
