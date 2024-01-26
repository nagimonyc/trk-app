import React from 'react';
import { ScrollView, Text, Image, Button, View, SafeAreaView } from 'react-native';

function ShareView() {
    return (
        <SafeAreaView>
            <View style={{ display: 'flex', width: '100%', height: '100%' }}>
                <View style={{ width: '20%' }}><Text>hello</Text></View>
                <View style={{ width: '60' }}><Text>nagimo</Text></View>
                <View style={{ width: '20%' }}><Text>🚀</Text></View>
            </View>
        </SafeAreaView>
    );
}

export default ShareView;