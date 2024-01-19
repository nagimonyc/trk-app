import React from 'react';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native';

const ListHistory = ({ data, renderItem, keyExtractor, isHighlighted}) => {
    console.log('[TEST] ListHistory called');
    if (!data) {
        return;
    }
    const styles = StyleSheet.create({
        firstItemShadow: {
            backgroundColor: 'yellow',
        },
    });    
    return (
        <ScrollView contentContainerStyle={{ padding: 10 }}>
            {data.map((item, index) => React.cloneElement(renderItem(item, index, isHighlighted), { key: keyExtractor(item, index)}))}
        </ScrollView>
    );
}

export default ListHistory;