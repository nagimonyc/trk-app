import React from "react";
import { SafeAreaView, Text, StyleSheet, View, Image } from "react-native";
import { AuthContext } from "../../Utils/AuthContext";

const UserProfile = () => {
    const { tapCount } = React.useContext(AuthContext);
    console.log(tapCount);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.innerContainer}>
                <View style={styles.title}><Text style={styles.titleText}>Activity</Text></View>
                <View style={styles.effortRecap}>
                    <View style={[styles.effortRecapChild, { backgroundColor: 'blue' }]}>
                        <Text>{tapCount}</Text>
                        <Text>Total Climbs</Text>
                    </View>
                    <View style={[styles.effortRecapChild, { backgroundColor: 'orange' }]}>
                        <Text>CLIMB</Text>
                        <Text>Best Effort</Text>
                    </View>
                </View>
                <View style={styles.effortRecapGraph}>
                    <Image
                        source={require('../../../assets/recapGraph.png')}
                        resizeMode="contain"
                        style={styles.effortRecapImage}
                    >
                    </Image>
                </View>
                <View style={styles.effortHistory}><Text>Hello</Text></View>
            </View>
        </SafeAreaView >
    );
}


const styles = StyleSheet.create({
    container: {
        backgroundColor: 'blue',
        flex: 1,
        paddingHorizontal: 20,
    },
    innerContainer: {
        flex: 1,
    },
    title: {
        backgroundColor: 'red',
        flex: 1,
        justifyContent: 'center',
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    effortRecap: {
        backgroundColor: 'green',
        flex: 2,
        flexDirection: 'row',
        paddingHorizontal: 20,
    },
    effortRecapChild: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    effortRecapGraph: {
        backgroundColor: 'purple',
        flex: 3,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    effortRecapImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        paddingHorizontal: 20,
    },
    effortHistory: {
        backgroundColor: 'yellow',
        flex: 4,
        paddingHorizontal: 20,
    },
});

export default UserProfile;