import React, { useEffect, useState, useContext } from 'react';
import { Text, View, ScrollView, SafeAreaView, StyleSheet} from "react-native";
import { AuthContext } from '../Utils/AuthContext';
import DropDownPicker from 'react-native-dropdown-picker';
import {
  fetchSetClimbs,
  fetchSets
} from '../Screens/TabScreens/GymAnalytics/GymDaily/Backend/analyticsCalculations';


const VideoGrid = () => {

  const [yourClimbs, setYourClimbs] = useState([]);
  const { currentUser } = useContext(AuthContext);
  const userId = currentUser?.uid;

  useEffect(() => {
    const initializeSetClimbs = async () => {
      const climbs = await fetchSetClimbs(userId, 'Corner Wall');
      if (climbs && climbs.length > 0) {
        setYourClimbs(prev => climbs);
      }
      const { uniqueSets, defaultSelected } = await fetchSets();
      console.log(`the default selected is: ${defaultSelected}`)
      if (uniqueSets && uniqueSets.length > 0) {
        setSets(uniqueSets);
      }
      if (defaultSelected) {
        setSelectedSetId(0);
      }
    };
    initializeSetClimbs();
  }, [userId, currentUser]);


  //For the DropDown
  const [openSetPicker, setOpenSetPicker] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [sets, setSets] = useState([]);


  useEffect(() => {
    const getSetClimbs = async () => {
      //console.log('Here for sets');
      const climbs = await fetchSetClimbs(userId, sets[selectedSetId]);
      //console.log('Climbs fetched: ', climbs);
      if (climbs && climbs.length > 0) {
        setYourClimbs(prev => climbs);
        setTotalClimbs(climbs ? climbs.length.toString() : '0')
      } else {
        setYourClimbs([]);
        setTotalClimbs('0');

      }
    };
    if (selectedSetId != null) {
      getSetClimbs();
    }
  }, [selectedSetId]);

  return (
    <ScrollView>
      <SafeAreaView>

        {sets && sets.length > 0 && <DropDownPicker
          listMode="SCROLLVIEW"
          open={openSetPicker}
          maxHeight={2000}
          dropDownDirection="BOTTOM"
          nestedScrollEnabled={true}
          setOpen={setOpenSetPicker}
          value={selectedSetId}
          items={sets}
          setValue={setSelectedSetId}
          containerStyle={{ marginTop: 20, height: 50, zIndex: 1000, width: 340, alignSelf: 'center', }}
          dropDownContainerStyle={{
            backgroundColor: '#e0e0e0',
            borderColor: 'black',
            borderWidth: 1,
          }}
          labelStyle={{

            fontWeight: 'bold' // Make the text a little bolder
          }}
          placeholder="Corner Wall"
          style={{ backgroundColor: '#e0e0e0', borderColor: '#e0e0e0', }}

          zIndex={2000}

        />}

        <View style={styles.videoGrid}>
          <Text>Videos go here</Text>
        </View>

      </SafeAreaView>
    </ScrollView>
  )
};

const styles = StyleSheet.create({
  videoGrid: {
    marginTop: 10,
  },

});

export default VideoGrid;
