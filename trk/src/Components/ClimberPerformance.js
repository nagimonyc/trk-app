import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import TapsApi from '../api/TapsApi';
import ClimbsApi from '../api/ClimbsApi';

const ClimberPerformance = () => {
    const route = useRoute();
    const { userData } = route.params;
    const [climbData, setClimbData] = React.useState([]);

    const fetchData = async () => {
        const { getTapsBySomeField } = TapsApi();
        const { getClimb } = ClimbsApi();
        console.log("userData.userId:", userData.userId);

        try {
            const tapsSnapshot = await getTapsBySomeField('user', userData.userId);
            const climbsPromises = tapsSnapshot.docs.map(async (tapDoc) => {
                const climbSnapshot = await getClimb(tapDoc.data().climb);

                console.log("climbSnapshot.data():", climbSnapshot.data());
                console.log("tapDoc.data():", tapDoc.data());

                return {
                    id: climbSnapshot.id,
                    ...climbSnapshot.data(),
                    ...tapDoc.data()
                };
            });

            const climbsData = await Promise.all(climbsPromises);
            setClimbData(climbsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    // Header for the table
    const renderHeader = () => (
        <View style={styles.headerRow}>
            <Text style={styles.headerText}>Climb</Text>
            <Text style={styles.headerText}>IFSC</Text>
            <Text style={styles.headerText}>%</Text>
            <Text style={styles.headerText}>#</Text>
            <Text style={styles.headerText}>Pts</Text>
            <Text style={styles.headerText}>W1&W2</Text>
        </View>
    );

    // Render each row of data
    const renderItem = ({ item }) => (
        <View style={styles.row}>
            <Text style={styles.text}>{item.name}</Text>
            <Text style={styles.text}>{item.ifsc}</Text>
            <Text style={styles.text}>{item.completion}</Text>
            <Text style={styles.text}>{item.attempts}</Text>
            <Text style={styles.text}>{item.ifsc * item.completion}</Text>
            <Text style={styles.text}>{item.witness1}, {item.witness2}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{`Climber: ${userData.email}`}</Text>
            <FlatList
                data={climbData}
                ListHeaderComponent={renderHeader}
                renderItem={renderItem}
                keyExtractor={item => item?.id ? item.id.toString() : 'undefined-id'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: 'lightgray',
    },
    headerText: {
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'lightgray',
    },
    text: {
        flex: 1,
        textAlign: 'center',
    },
});

export default ClimberPerformance;
