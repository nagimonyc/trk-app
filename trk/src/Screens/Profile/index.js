import React from "react";
import { SafeAreaView, Text, StyleSheet, View, Image } from "react-native";
import { AuthContext } from "../../Utils/AuthContext";

const UserProfile = () => {
    console.log('[TEST] UserProfile called');
    const { tapCount } = React.useContext(AuthContext);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.innerContainer}>
                <View style={styles.title}><Text style={styles.titleText}>Activity</Text></View>
                <View style={styles.effortRecap}>
                    <View style={[styles.effortRecapChild, {}]}>
                        <Text>{tapCount}</Text>
                        <Text>Total Climbs</Text>
                    </View>
                    <View style={[styles.effortRecapChild, {}]}>
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
                <View style={[styles.effortHistory, { alignItems: 'center' }]}><Text style={{ fontWeight: 'bold', }}>Recap</Text></View>
            </View>
        </SafeAreaView >
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    innerContainer: {
        flex: 1,
    },
    title: {
        flex: 1,
        justifyContent: 'center',
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    effortRecap: {
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
        flex: 4,
        paddingHorizontal: 20,
    },
});

export default UserProfile;