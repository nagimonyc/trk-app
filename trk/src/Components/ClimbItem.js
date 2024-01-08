import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../Utils/AuthContext';
import storage from '@react-native-firebase/storage';
import ListItemContainer from './ListItemContainer';
import TapsApi from '../api/TapsApi';
import Svg, { Path } from 'react-native-svg';

const RightArrow = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <Path d="M9 18l6-6-6-6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ClimbItem = ({ climb, tapId, fromHome = false, tapTimestamp }) => {
    console.log('[TEST] ClimbItem called');
    const [imageURL, setImageURL] = useState(null);
    const navigation = useNavigation();
    const { role } = React.useContext(AuthContext);

    useEffect(() => {
        const fetchImageURL = async () => {
            try {
                const url = await storage().ref('profile photos/epset.png').getDownloadURL();
                setImageURL(url);
            } catch (error) {
                console.error('Failed to fetch image URL:', error);
            }
        };

        fetchImageURL();
    }, []);



    const navigateToDetail = async () => {
        try {
            const tapDocument = await TapsApi().getTap(tapId);
            const tapData = tapDocument.data();

            const climbId = tapData.climb;
            console.log(`This is: ${climbId}`);

            navigation.navigate('Detail', { climbData: climb, tapId: tapId, climbId: climbId, profileCheck: 1 });
        }
        catch (error) {
            console.error('Error fetching tap data:', error);
        }
    };
    const navigateToSet = () => {
        navigation.navigate('Set', { climbData: climb });
    };


    if (fromHome) {
        return (
            <View>
                <ListItemContainer dotStyle={styles.climbDot}>
                    <Text style={styles.climbName}>{climb.name}</Text>
                    <View style={styles.timerInfo}>
                        <Text>{tapTimestamp}</Text>
                    </View>
                </ListItemContainer>
            </View>
        );
    }
    else {
        return (
            <TouchableOpacity onPress={role === 'climber' ? navigateToDetail : navigateToSet}>
                <ListItemContainer dotStyle={styles.climbDot}>
                    <Text style={styles.climbName}>{climb.name}</Text>
                    <View style={styles.setterDot}>
                        <RightArrow style={{ width: '100%', height: '100%' }} />
                    </View>
                </ListItemContainer>
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    climbDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#C73B3B',
        marginRight: 8,
        marginLeft: 10,
    },
    climbName: {
        fontWeight: '700',
        flex: 1,
        color: 'black'
    },
    climbImage: {
        width: 30,
        height: 30,
        borderRadius: 15,

    },
    setterDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'white',
        marginRight: 5,
        marginLeft: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerInfo: {
        borderRadius: 15,
        backgroundColor: 'white',
        marginRight: 5,
        marginLeft: 60,
        alignItems: 'center',
        justifyContent: 'center',
        color: 'black'
    }
});

export default ClimbItem;