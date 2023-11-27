import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { firebase } from '@react-native-firebase/firestore';

const FeedbackChat = () => {

    const [message, setMessage] = useState('');

    const handleMessageSubmit = () => {
        console.log('handleMessageSubmit called');

    }

    return (
        <View style={styles.container}>
            <Text>Feedback Chat</Text>
            <View style={{ backgroundColor: 'blue', flex: 1 }}>
                <Button title='SEND' onPress={handleMessageSubmit} ></Button>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'gray',
    },
}
);
export default FeedbackChat;
