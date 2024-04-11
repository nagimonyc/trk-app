import React, { useState, useEffect } from "react";
import { SafeAreaView, View, Text, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import GymsApi from "../../../../api/GymsApi";
import AsyncStorage from '@react-native-async-storage/async-storage';

const Membership = () => {
    const [gyms, setGyms] = useState([]);
    const [selectedGymId, setSelectedGymId] = useState(null);
    const [openGymsDropdown, setOpenGymsDropdown] = useState(false);

    useEffect(() => {
        const fetchGyms = async () => {
            try {
                const gymSnapshot = await GymsApi().fetchGyms();
                const gymOptions = gymSnapshot.map(doc => ({
                    label: doc.data().Name,
                    value: doc.id
                }));
                const cachedGym = await AsyncStorage.getItem('gymId');
                const defaultGym = gymOptions.find(gym => gym.label === "Movement Gowanus");

                setGyms(gymOptions);

                if (cachedGym) {
                    let gymId = String(JSON.parse(cachedGym)).trim();
                    setSelectedGymId(gymId);
                } else if (defaultGym) {
                    setSelectedGymId(defaultGym.value);
                }
            } catch (error) {
                console.error('Failed to fetch gyms:', error);
            }
        };

        fetchGyms();
    }, []);

    const closeDropdown = () => {
        setOpenGymsDropdown(false);
    };

    return (
        <TouchableWithoutFeedback onPress={closeDropdown}>
            <SafeAreaView style={{ flex: 1, marginHorizontal: 15 }}>
                <View style={{ marginTop: 30 }}>
                    <Text style={{ fontWeight: '700', fontSize: 28 }}>
                        Select a gym
                    </Text>
                </View>
                <DropDownPicker
                    open={openGymsDropdown}
                    value={selectedGymId}
                    items={gyms}
                    setOpen={setOpenGymsDropdown}
                    setValue={setSelectedGymId}
                    setItems={setGyms}
                    zIndex={3000}
                    zIndexInverse={1000}
                    containerStyle={{ height: 40, marginTop: 10 }}
                    style={{ backgroundColor: '#fafafa' }}
                    dropDownContainerStyle={{ backgroundColor: '#fafafa' }}
                />
                <View style={{ flex: 1 }}>
                    {/* Spacer View */}
                </View>
                <TouchableOpacity style={{ backgroundColor: '#FF8100', height: 70, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 60, marginHorizontal: 25 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 20 }}>ACTIVATE TAG</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

export default Membership;
