import React, { useContext } from 'react';
import { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { AuthContext } from '../../../../Utils/AuthContext';
import UsersApi from '../../../../api/UsersApi';

const API_URL = 'https://us-central1-trk-app-505a1.cloudfunctions.net/createPaymentSheet';

const PayUI = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const {currentUser, role} = useContext(AuthContext);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        const { getUsersBySomeField } = UsersApi();
        let user = await getUsersBySomeField('uid', currentUser.uid);
        if (!user.empty) {
          let userObj = user.docs[0].data();
          if (userObj.isPaid) {
            setUser(userObj);
          } else {
            setUser({ ...userObj, isPaid: false });
          }
        }
      }
    };
    fetchData();
    initializePaymentSheet();
  }, [currentUser]);  

  const fetchPaymentSheetParams = async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Example amount and currency - adjust according to your needs
        amount: 299, // $2.99 (IN CENTS)
        currency: 'usd',
        email: String(currentUser.email),
      }),
    });
    console.log(response);
    const data = await response.json();
    return data;
  };

  const initializePaymentSheet = async () => {
    const {
      paymentIntent,
      ephemeralKey,
      customer,
      publishableKey,
    } = await fetchPaymentSheetParams();

    const { error, paymentOption } = await initPaymentSheet({
      merchantDisplayName: 'Nagimo Corp.',
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: paymentIntent,
      publishableKey,
      googlePay: {
        merchantCountryCode: 'US',
        testsEnv: true, // use test environment
      },
    });

    if (!error) {
      setLoading(true);
    } else {
      console.error(`Error initializing payment sheet: ${error.message}`);
      Alert.alert('Error', 'Unable to initialize payment sheet.');
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert('Payment failed', error.message);
    } else {
      Alert.alert('Success', 'Payment successful!');
      // Handle post-payment logic here (e.g., navigate to a confirmation screen)
      //HERE WE NEED TO ADD "PAID USER" to firebase
      setUser(prev => ({ ...prev, isPaid: true }));
      await UsersApi().updateUser(currentUser.uid, {isPaid: true});
    }
  };

  return (
   <StripeProvider
        publishableKey="pk_live_51OaSWnEQO3gNE6xrKK1pHZXzWux71xpxXpA3nQNtNK30Vz43sCQeJzO7QuMk708tOGvGstsLbBS1jtMCIWZ14UCR00j1Bt80cF"
    >
        
    <View style={styles.container}>
      {/* Title and other content */}
      <Text style={styles.title}>Try Nagimo+</Text>
      <View style={styles.imageContainer}>
        <Image
          source={require('../../../../../assets/Frame-11.png')}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      <View style={styles.bandeau}>
        <Text style={styles.bandeauText}>WITH YOUR PURCHASE YOU GET:</Text>
      </View>
      <View style={styles.benefits}>
        {/* Benefits content */}
        <View style={{ flexDirection: 'row', marginTop: 30, alignItems: 'center' }}>
          <Text style={{ fontSize: 24 }}>♾️</Text>
          <Text style={{ fontSize: 16, color: 'black', marginLeft: 10, flexShrink: 1 }}>
            Get <Text style={{ fontWeight: '700' }}>Unlimited Uploads</Text> to capture all that matters
          </Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 30, alignItems: 'center' }}>
          <Text style={{ fontSize: 24 }}>✨</Text>
          <Text style={{ fontSize: 16, color: 'black', marginLeft: 10 }}>
            All your videos, in highest quality
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 30 }}>
          <Text style={{ fontSize: 24 }}>🏷️</Text>
          <Text style={{ fontSize: 16, color: 'black', marginLeft: 10 }}>
            Get an exclusive label on community videos
          </Text>
        </View>
      </View>
      {/* Join Now Button */}
      <TouchableOpacity
          style={[
            styles.joinNow,
            (!user || user.isPaid) && styles.disabledJoinNow
          ]}
          onPress={openPaymentSheet}
          disabled={(!user || user.isPaid)}
        >
        <Text style={styles.joinNowText}>
          JOIN NOW <Text style={{ fontWeight: '300' }}>– $2.99 per month</Text>
        </Text>
      </TouchableOpacity>
    </View>
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensure the container fills the screen
    justifyContent: 'space-between' // Distributes space between items and pushes the button to the bottom
  },
  title: {
    fontSize: 32,
    color: 'black',
    fontWeight: '700',
    marginVertical: 10,
    marginLeft: 15,
  },
  imageContainer: {
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bandeau: {
    height: 40,
    backgroundColor: 'white',
    marginHorizontal: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FC5200',
    borderRadius: 5,
    marginTop: -10,
  },
  bandeauText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'black',
  },
  benefits: {
    marginHorizontal: 15,
  },
  joinNow: {
    height: 50,
    backgroundColor: '#FC5200',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    marginHorizontal: 20, // Ensures some spacing from the screen edge
  },
  joinNowText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  disabledJoinNow: {
    backgroundColor: '#cccccc', // Greyed out color when the button is disabled
  },
});

export default PayUI;