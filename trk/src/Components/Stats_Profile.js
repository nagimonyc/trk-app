import React, { useContext } from 'react';
import { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { AuthContext } from '../Utils/AuthContext';
import UsersApi from '../api/UsersApi';
import analytics from '@react-native-firebase/analytics';
import Icon from 'react-native-vector-icons/FontAwesome'; // Make sure to import Icon
import LineGraphComponent from './LineGraphComponent';

const API_URL = 'https://us-central1-trk-app-505a1.cloudfunctions.net/createPaymentSheet';

const Stats = ({route}) => {
    const {tapCount, commentsLeft, sessionsThisWeek, highestVGrade, climbsThisWeek} = route.params;
    const { currentUser, role } = useContext(AuthContext);

    const MoreSection = () => {
        const [showProgress, setShowProgress] = useState(false);

        // Helper function to toggle the progress graph
        const toggleProgress = () => {
            setShowProgress(!showProgress);
        };

        return (
            <View style={{ marginTop: 20 }}>
                <Text style={{ paddingHorizontal: 15, color: 'black', fontSize: 16, fontWeight: '700' }}>More</Text>
                <TouchableOpacity
                    style={{
                        paddingHorizontal: 15,
                        paddingVertical: 10,
                        backgroundColor: 'white',
                        alignItems: 'center',
                        justifyContent: 'space-between', // Use space-between to align Text and Icon
                        flexDirection: 'row', // Set direction of children to row
                        marginTop: 10,
                    }}
                    onPress={toggleProgress}
                >
                    <View></View>
                    <Text style={{ color: 'black', fontWeight: '500', fontSize: 14 }}>Weekly Graph</Text>
                    <Icon name={showProgress ? 'chevron-up' : 'chevron-down'} size={14} color="#525252" />
                </TouchableOpacity>
                {showProgress && <ProgressContent />}
            </View>
        );
    };


    //Display for the Progress Tab
    const ProgressContent = () => (
        <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
            {/* <Text style={{ color: 'black', paddingHorizontal: 20, paddingTop: 10, fontWeight: 'bold' }}>This Week</Text> */}
            <View style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
                <LineGraphComponent data={climbsThisWeek} />
            </View>
        </View>
    );

  return (
    <View style={{ flex: 1}}>
                        <Text style={{ paddingHorizontal: 15, color: 'black', fontSize: 16, fontWeight: '700', paddingTop: 15}}>Fun Stats</Text>
                        <View style={{ width: '100%', backgroundColor: 'white', marginTop: 10 }}>
                            <View style={{ paddingHorizontal: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 7 }}>
                                    <Text style={{ color: 'black' }}>Climbs Found</Text>
                                    <Text style={{ color: 'black' }}>{tapCount}</Text>
                                </View>
                                <View style={{ height: 1, backgroundColor: '#e0e0e0' }} />
                            </View>
                            <View style={{ paddingHorizontal: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 7 }}>
                                    <Text style={{ color: 'black' }}>Route Setters Smiling (Reviews Left)</Text>
                                    <Text style={{ color: 'black' }}>{commentsLeft}</Text>
                                </View>
                                <View style={{ height: 1, backgroundColor: '#e0e0e0' }} />
                            </View>
                            <View style={{ paddingHorizontal: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 7 }}>
                                    <Text style={{ color: 'black' }}>Climbing Sessions per Week</Text>
                                    <Text style={{ color: 'black' }}>{sessionsThisWeek.length}</Text>
                                </View>
                                <View style={{ height: 1, backgroundColor: '#e0e0e0' }} />
                            </View>
                            <View style={{ paddingHorizontal: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 7 }}>
                                    <Text style={{ color: 'black' }}>Best Effort</Text>
                                    <Text style={{ color: 'black' }}>{highestVGrade}</Text>
                                </View>
                                <View style={{ height: 1, backgroundColor: '#e0e0e0' }} />
                            </View>
                            <View style={{
                                paddingHorizontal: 15,
                                backgroundColor: 'white', // Ensure there's a background color
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.25,
                                shadowRadius: 2,
                                elevation: 5, // for Android
                            }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 7 }}>
                                    <Text style={{ color: 'black' }}>Friends made along the way</Text>
                                    <Text style={{ color: 'black' }}>∞</Text>
                                </View>
                            </View>
                        </View>
                    <MoreSection />
    </View>
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

export default Stats;