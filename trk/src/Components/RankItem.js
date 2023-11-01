import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ListItemContainer from './ListItemContainer';

const RankItem = ({ user }) => {
    const navigation = useNavigation();

    const navigateToClimberPerformance = () => {
        navigation.navigate('Climber Performance', { userData: user });
    };

    return (
        <TouchableOpacity onPress={navigateToClimberPerformance}>
            <ListItemContainer>
                <Text>{user.email} - Points: {user.totalIFSC}</Text>
            </ListItemContainer>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    climbImage: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 10,
    }
});

export default RankItem;
