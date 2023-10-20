import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import UsersApi from "../../api/UsersApi";
import RankHistory from "../../Components/RankHistory";

const CompRanking = () => {
    const [rankingHistory, setRankingHistory] = React.useState([]);


    const handleRankingHistory = async () => {
        const { getUsersBySomeField } = UsersApi();
        try {
            const userSnapshot = await getUsersBySomeField('nyuComp', true);
            console.log('this is user snapshot: ', userSnapshot);

            const rankPromises = [];
            userSnapshot.docs.forEach(doc => {
                // const climbId = doc.data().climb;
                // const climbPromise = getClimb(climbId);
                rankPromises.push(doc.data());
            });
            console.log('this is rank promises: ', rankPromises);

            setRankingHistory(rankPromises);
        } catch (error) {
            console.error("Error fetching climbs for user:", error);
        }
    };
    console.log(rankingHistory);



    return (
        <View style={styles.container}>
            <View style={{ width: '100%', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', backgroundColor: 'red', flex: 0.5 }}>
                <View style={{ flex: 1 }}></View>
                <Text style={{ fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
                    List
                </Text>
                <TouchableOpacity style={[styles.pillButton]} onPress={handleRankingHistory}>
                    <Text style={styles.buttonText}>Reload</Text>
                </TouchableOpacity>
            </View>
            <View style={{ flex: 6, width: '100 %', backgroundColor: 'green' }}>
                <RankHistory rankingHistory={rankingHistory} />
            </View>
        </View>
    );
}

export default CompRanking;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'blue',
        margin: 20,
    },
    pillButton: {
        backgroundColor: '#3498db', // or any color of your choice
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 50,  // This will give it a pill shape
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        color: 'white',
        fontSize: 16
    },
});