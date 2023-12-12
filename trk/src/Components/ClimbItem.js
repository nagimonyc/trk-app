import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../Utils/AuthContext';
import storage from '@react-native-firebase/storage';
import ListItemContainer from './ListItemContainer';
import TapsApi from '../api/TapsApi';

const ClimbItem = ({ climb, tapId, isLatest }) => {
    const [imageURL, setImageURL] = useState(null);
    const [highlight, setHighlight] = useState(isLatest); // Use isLatest for initial highlight state
    const navigation = useNavigation();
    const { role } = useContext(AuthContext);
    const highlightTimeoutRef = useRef(null);

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

    useEffect(() => {
        if (isLatest) {
            setHighlight(true); // Immediately set highlight to true if isLatest is true
            highlightTimeoutRef.current = setTimeout(() => {
                setHighlight(false); // Remove highlight after 3 seconds
            }, 3000);
        }

        return () => {
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current); // Clear the timeout if the component unmounts
            }
        };
    }, [isLatest]);

    const navigateToDetail = async () => {
        try {
            const tapDocument = await TapsApi().getTap(tapId);
            const tapData = tapDocument.data();
            const climbId = tapData.climb;
            navigation.navigate('Detail', { climbData: climb, tapId: tapId, climbId: climbId, profileCheck: 1 });
        } catch (error) {
            console.error('Error fetching tap data:', error);
        }
    };

    const navigateToSet = () => {
        navigation.navigate('Set', { climbData: climb });
    };

    const containerStyle = highlight
        ? [styles.listItemContainer, styles.highlighted]
        : styles.listItemContainer;

    return (
        <TouchableOpacity onPress={role === 'climber' ? navigateToDetail : navigateToSet}>
            <ListItemContainer dotStyle={styles.climbDot} style={containerStyle}>
                <Text style={styles.climbName}>{climb.name}</Text>
                <View style={styles.setterDot}>
                    {imageURL && <Image source={{ uri: imageURL }} style={{ width: '100%', height: '100%' }} />}
                </View>
            </ListItemContainer>
        </TouchableOpacity>
    );
};

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
    highlighted: {
        borderColor: 'green',
        borderWidth: 2,
    },
});

export default ClimbItem;
