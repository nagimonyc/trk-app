import { Text, View, StyleSheet, Alert } from 'react-native';
import FollowPage from './Backend/FollowPage';

function FollowScreen(props) {
    console.log('[TEST] FollowScreen called');

    return (
    <View style={styles.center}>
        <FollowPage/>
    </View>
    );
}

const styles = StyleSheet.create({
    //Simplified CSS logic (one style variable)
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0,
        padding: 0,
        marginTop: 20,
    },
});

export default FollowScreen;