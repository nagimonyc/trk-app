import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const ListItemSessions = ({ children, showDot = true, dotStyle = {}, grade, isHighlighted = true}) => {
    //CSS changes to highlight the first item of the list (most recent tap)
    return (
        <View style={(isHighlighted? styles.firstItemShadow: styles.container)}> 
            {showDot && <Text style={[styles.defaultDot, dotStyle]}>{grade}</Text>}
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 5,
    },
    defaultDot: {
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#fe8100',
        marginRight: 5,
    },
    firstItemShadow: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 5,
        borderColor: '#fe8100',
        borderWidth: 1,
        padding: 5,
        
    },
});

export default ListItemSessions;
