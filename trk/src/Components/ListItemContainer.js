import React from 'react';
import { View, StyleSheet } from 'react-native';

const ListItemContainer = ({ children, showDot = true, dotStyle = {} }) => {
    return (
        <View style={styles.container}>
            {showDot && <View style={[styles.defaultDot, dotStyle]} />}
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10, 
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
    },
    defaultDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'grey', 
        marginRight: 10,
    }
});

export default ListItemContainer;
