import React, {useState, useEffect} from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../Utils/AuthContext';
import storage from '@react-native-firebase/storage';

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
        navigation.navigate('Set', {climbData: climb})
    };

    return (
        <TouchableOpacity onPress={role === 'climber' ? navigateToDetail : navigateToSet}>
            <View style={styles.climbContainer}>
                <View style={styles.climbDot}>
                    <Text style={styles.grade}>{climb.grade}</Text>
                </View>
                <Image source={{ uri: climb.image }} style={styles.climbImage} />
                <Text style={styles.climbName}>{climb.name}</Text>
                <View style={styles.setterDot}>
                <Image source={{ uri: imageURL }} style={{ width: '100%', height: '100%' }} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    climbContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10, // space between items
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
    },
    climbDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'grey', // Change to desired color
        marginRight: 1,
        marginLeft: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#C73B3B',
    },
    grade: {
        color: 'white',
    },
    climbName: {
        fontWeight: '700',
        flex: 1,
    },
    climbImage: {
        width: 30, // Adjust as needed
        height: 30, // Adjust as needed
        borderRadius: 15,
        marginRight: 1,
    },
    setterDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'grey', // Change to desired color
        marginRight: 5,
        marginLeft: 60,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#CBB092',
    },
});

export default ClimbItem;
