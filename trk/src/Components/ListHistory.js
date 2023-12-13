import React from 'react';
import { ScrollView } from 'react-native';

const ListHistory = ({ data, renderItem, keyExtractor }) => {
    console.log('[TEST] ListHistory called');
    return (
        <ScrollView contentContainerStyle={{ padding: 10 }}>
            {data.map((item, index) => React.cloneElement(renderItem(item), { key: keyExtractor(item, index) }))}
        </ScrollView>
    );
}

export default ListHistory;