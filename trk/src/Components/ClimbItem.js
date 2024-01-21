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

const ClimbItem = ({climb, tapId, fromHome = false, tapTimestamp, isHighlighted = false, sessionPick = false, tapIdRef = null, setSelectedTapId = null}) => {
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


    //To hanndle selection of the item within Edit Session (change in useRef variable)
    const handleSelection = (id) => {
        if (tapIdRef === null) {
            console.log('No selection made!');
        } else {
            tapIdRef.current = id;
            setSelectedTapId(tapIdRef.current);
            console.log('Selection made: ', tapIdRef.current);
        }
    }

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
                <ListItemContainer dotStyle={styles.climbDot} grade={climb.grade}>
                    <Text style={styles.climbName}>{climb.name}</Text>
                    <View style={styles.timerInfo}>
                        <Text style={{color: 'black'}}>{tapTimestamp}</Text>
                    </View>
                </ListItemContainer>
            </View>
        );
    } else if (sessionPick) {
        //Different formatting for SessionDetailLook
        return (
            <TouchableOpacity onPress={() => {handleSelection(climb.tapId)}}>
                <ListItemContainer dotStyle={styles.climbDot} grade={climb.grade} isHighlighted={isHighlighted}> 
                    <Text style={styles.climbName}>{climb.name}</Text>
                    <View style={styles.setterDot}>
                        <Text style={{color: 'black', paddingRight: 10}}>{tapTimestamp}</Text>
                    </View>
                </ListItemContainer>
            </TouchableOpacity>
        );
    } else {
        //Added the timestamp to the Profile ClimbItem for better understanding of which tap was logged. Current pattern makes it difficult to find the most recent tap on navigation.
        //Highlighted the first climb of the active session (for clarity on which climb was logged)
        return (
            <TouchableOpacity onPress={role === 'climber' ? navigateToDetail : navigateToSet}>
                <ListItemContainer dotStyle={styles.climbDot} grade={climb.grade} isHighlighted={isHighlighted}> 
                    <Text style={styles.climbName}>{climb.name}</Text>
                    <View style={styles.setterDot}>
                        <Text style={{color: 'black', paddingRight: 10}}>{tapTimestamp}</Text>
                        <RightArrow style={{ width: '100%', height: '100%' }} />
                    </View>
                </ListItemContainer>
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    climbDot: {
        width: 'auto',
        height: 'auto',
        borderRadius: 15,
        backgroundColor: 'white',
        color: 'black',
        borderColor: '#fe8100',
        borderWidth: 1,
        marginRight: 8,
        marginLeft: 10,
        padding: 8
    },
    climbName: {
        flex: 1,
        color: 'black'
    },
    climbImage: {
        width: 30,
        height: 30,
        borderRadius: 15,

    },
    setterDot: {
        borderRadius: 15,
        backgroundColor: 'white',
        marginRight: 5,
        marginLeft: 60,
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex', //Some CSS changes for the time addition
        flexDirection: 'row',
    },
    timerInfo: {
        borderRadius: 15,
        backgroundColor: 'white',
        marginRight: 5,
        marginLeft: 60,
        alignItems: 'center',
        justifyContent: 'center',
        color: 'black'
    },
});

export default ClimbItem;