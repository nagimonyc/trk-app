import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const ListItemContainer = ({ children, showDot = true, dotStyle = {}, grade, isHighlighted = false}) => {
    return (
        <View style={(isHighlighted? styles.firstItemShadow: styles.container)}>
            {showDot && <Text style={[styles.defaultDot, dotStyle]}>{grade}</Text>}
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
        borderWidth: 1,
        borderColor: '#fe8100',
        marginRight: 10,
    },
    firstItemShadow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        borderColor: '#fe8100',
        borderWidth: 1,
    },
});

export default ListItemContainer;
