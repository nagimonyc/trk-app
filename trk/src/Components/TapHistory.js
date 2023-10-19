import React from 'react';
import { View, ScrollView } from 'react-native';
import ClimbItem from './ClimbItem'; // Make sure the path is correct

const TapHistory = (props) => {
    return (
        <ScrollView contentContainerStyle={{ padding: 10 }}>
            {props.climbsHistory.map((climb, index) => (
                <ClimbItem key={index} climb={climb} />
            ))}
        </ScrollView>
    );
}

export default TapHistory;