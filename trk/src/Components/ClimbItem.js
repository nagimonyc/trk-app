import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../Utils/AuthContext';
import storage from '@react-native-firebase/storage';
import ListItemContainer from './ListItemContainer';
const ClimbItem = ({ climb, tapId }) => {
    const [imageURL, setImageURL] = useState(null);
    const navigation = useNavigation();
    const { role } = React.useContext(AuthContext);

    useEffect(() => {
        const fetchImageURL = async () => {
            try {
                const url = await storage().ref('profile photos/marcial.png').getDownloadURL();
                setImageURL(url);
            } catch (error) {
                console.error('Failed to fetch image URL:', error);
            }
        };

        fetchImageURL();
    }, []);

    const navigateToDetail = () => {
        navigation.navigate('Detail', { climbData: climb, tapId: tapId, profileCheck: 1 });
    };
    const navigateToSet = () => {
        navigation.navigate('Set', {climbData: climb});
    };

    return (
        <TouchableOpacity onPress={role === 'climber' ? navigateToDetail : navigateToSet}>
            <ListItemContainer dotStyle={styles.climbDot}>
                <Image source={{ uri: climb.image }} style={styles.climbImage} />
                <Text style={styles.climbName}>{climb.name}</Text>
                <View style={styles.setterDot}>
                {imageURL && <Image source={{ uri: imageURL }} style={{ width: '100%', height: '100%' }} />}
                </View>
            </ListItemContainer>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    climbDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#C73B3B',
        marginRight: 1,
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
        marginRight: 1,
    },
    setterDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#CBB092',
        marginRight: 5,
        marginLeft: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ClimbItem;
