import React from 'react';
import { View, Image } from 'react-native';
import { Marquee } from '@animatereactnative/marquee';

const Banner = () => {
    return (
        <View style={{ width: '100%', height: 100, backgroundColor: 'blue' }}>
            <Marquee spacing={20} speed={1}>
                <Image
                    source={require('../../assets/long-logo.png')}
                    style={{ width: 200, height: undefined, aspectRatio: 5 }}
                    resizeMode="contain"
                />
            </Marquee>
        </View>
    );
}

export default Banner;