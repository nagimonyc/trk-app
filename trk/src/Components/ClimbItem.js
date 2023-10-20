import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ClimbItem = ({ climb, tapId }) => {
    const navigation = useNavigation();

    const navigateToDetail = () => {
        navigation.navigate('Detail', { climbData: climb, tapId: tapId, profileCheck: 1 });
    };

    return (
        <TouchableOpacity onPress={navigateToDetail}>
            <View style={styles.climbContainer}>
                <View style={styles.climbDot}></View>
                <Image source={{ uri: climb.image }} style={styles.climbImage} />
                <Text>{climb.name}</Text>
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
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'grey', // Change to desired color
        marginRight: 10,
    },
    climbImage: {
        width: 30, // Adjust as needed
        height: 30, // Adjust as needed
        borderRadius: 15,
        marginRight: 10,
    }
});

export default ClimbItem;
