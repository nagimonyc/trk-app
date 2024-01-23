import React from 'react';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native';

const ListHistory = ({ data, renderItem, keyExtractor, isHighlighted}) => {
    console.log('[TEST] ListHistory called');
    if (!data || (data && data.length == 0)) {
        return;
    }
    const styles = StyleSheet.create({
        firstItemShadow: {
            backgroundColor: 'yellow',
        },
    });    
    return (
        <ScrollView contentContainerStyle={{ padding: 10 }}>
            {data.reverse().map((item, index) => React.cloneElement(renderItem(item, index, isHighlighted), { key: keyExtractor(item, index)}))}
        </ScrollView>
    );
}
//Just passing the highlighted variable for rendering in ClimbItem
export default ListHistory;