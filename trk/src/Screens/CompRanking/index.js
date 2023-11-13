import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import UsersApi from "../../api/UsersApi";
import ClimbsApi from "../../api/ClimbsApi";
import TapsApi from "../../api/TapsApi";
import RankHistory from "../../Components/RankHistory";

const CompRanking = () => {
    const [rankingHistory, setRankingHistory] = React.useState([]);
    console.log("rankingHistory:", rankingHistory);

    const handleRankingHistory = async () => {
        const { getUsersBySomeField } = UsersApi();
        const { getTapsBySomeField } = TapsApi();
        const { getClimb } = ClimbsApi();
        try {
            const userSnapshot = await getUsersBySomeField('nyuComp', true);

            const allUserData = await Promise.all(
                userSnapshot.docs.map(async doc => {
                    const userId = doc.id;
                    const userData = doc.data();

                    const tapsSnapshot = await getTapsBySomeField('user', userId);
                    const climbsPromises = tapsSnapshot.docs.map(tapDoc => getClimb(tapDoc.data().climb));
                    const climbsSnapshots = await Promise.all(climbsPromises);

                    let totalIFSC = 0;
                    let totalAttempts = 0;
                    climbsSnapshots.forEach((climbSnapshot, index) => {
                        if (climbSnapshot.exists) {
                            const climb = climbSnapshot.data();
                            const tap = tapsSnapshot.docs[index].data();
                            let adjustedScore = parseInt(climb.ifsc, 10) * tap.completion;
                            totalIFSC += adjustedScore;

                            totalAttempts += tap.attempts;  // Add the number of attempts from the tap data
                        }
                    });

                    return {
                        ...userData,
                        userId,
                        totalIFSC,
                        totalAttempts
                    };
                })
            );
            const sortedUserData = allUserData.sort((a, b) => {
                const aScore = isNaN(a.totalIFSC) ? -Infinity : a.totalIFSC;
                const bScore = isNaN(b.totalIFSC) ? -Infinity : b.totalIFSC;

                if (bScore === aScore) {
                    return a.totalAttempts - b.totalAttempts;  // Fewer attempts come first
                }
                return bScore - aScore;
            });

            console.log("Sorted data:", sortedUserData);

            setRankingHistory(sortedUserData);

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={{ width: '100%', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', flex: 0.5 }}>
                <View style={{ flex: 1 }}></View>
                <Text style={{ fontWeight: 'bold', flex: 1, textAlign: 'center', color: 'black'}}>
                    List
                </Text>
                <TouchableOpacity style={[styles.pillButton]} onPress={handleRankingHistory}>
                    <Text style={styles.buttonText}>Reload</Text>
                </TouchableOpacity>
            </View>
            <View style={{ flex: 6, width: '100 %', backgroundColor: '#F2E5D6' }}>
                <RankHistory rankingHistory={rankingHistory} />
            </View>
        </View>
    );
}

export default CompRanking;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 20,
    },
    pillButton: {
        backgroundColor: '#3498db',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        color: 'white',
        fontSize: 16
    },
});
