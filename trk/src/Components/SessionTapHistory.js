import React, { useContext, useCallback } from 'react';
import { useState, useRef, useEffect} from 'react';
import ListHistory from './ListHistory';
import ClimbItem from './ClimbItem';
import { ScrollView, Text, View, TouchableOpacity, Image } from 'react-native';
import moment from 'moment-timezone';
import { StyleSheet } from 'react-native';
import SessionItem from './SessionItem';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Or any other icon family you prefer
import { Camera, useCameraDevice, useCodeScanner } from "react-native-vision-camera";
import UserSearch from './UserSearch';
import {Modal, Portal} from "react-native-paper";
import UsersApi from '../api/UsersApi';
import { Alert } from 'react-native';
import { AuthContext } from '../Utils/AuthContext';
import TapsApi from '../api/TapsApi';
import SessionsApi from '../api/SessionsApi';

//Removed all session creation code, moving it to ClimberProfile's backend. This allows for calculation of number of sessions, and future session tasks.
//ONLY DISPLAYING IS DONE HERE NOW
//Tagging for Active Session is Handled.
const SessionTapHistory = (props) => {
    console.log('[TEST] SessionTapHistory called');

    const {currentUser, role} = useContext(AuthContext);
    const data = (props.isCurrent && props.currentSessionObject? props.currentSessionObject.data() : null);
    const sessionId = (props.isCurrent && props.currentSessionObject? props.currentSessionObject.id : null)

    const device = useCameraDevice('back');
    // State for modal visibility
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isModalVisibleText, setIsModalVisibleText] = useState(false);


    const [activeQR, setActiveQR] = useState(null);
    const lastScannedCodeRef = useRef(null);


    const [tagged, updateTagged]  = useState([]);

    useEffect(() => {
        if (data && data.taggedUsers) {
            updateTagged(data.taggedUsers);
            //console.log('Tagged Users Updated!');
        }
    }, [data]);
    
    //Time stamp formatting like Home Page for clarity (Altered ClimbItem to match)
    const timeStampFormatting = (timestamp) => {
        let tempTimestamp = null;
        if (timestamp.toDate) { // Convert Firebase Timestamp to JavaScript Date
            tempTimestamp = timestamp.toDate().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/New_York' // NEW YORK TIME
            });
        }
        return tempTimestamp;
    };

    const styles = StyleSheet.create({
        firstItemShadow: {
            shadowColor: 'blue',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.8,
            shadowRadius: 2,  
            elevation: 5 // for Android
        },
    });


    const TagButton = ({onPress}) => {
        return (
            <TouchableOpacity style={{width: '100%', backgroundColor: '#3498db', borderRadius: 10, display: 'flex', flexDirection: 'row', padding: 10, justifyContent: 'center', alignItems: 'center'}} onPress={onPress}>
                <Image source={require('./../../assets/camera.png')} style={{ width: 20, height: 20 }}   resizeMode="contain" />
            </TouchableOpacity>
        );
    };

    const TagButtonType = ({onPress}) => {
        return (
            <TouchableOpacity style={{width: '100%', backgroundColor: '#3498db', borderRadius: 10, display: 'flex', flexDirection: 'row', padding: 10, justifyContent: 'center', alignItems: 'center'}} onPress={onPress}>
                <Image source={require('./../../assets/short-text.png')} style={{ width: 20, height: 20 }}   resizeMode="contain" />
            </TouchableOpacity>
        );
    };

        const handleTag = useCallback((code_read) => {
            if (code_read && lastScannedCodeRef.current !== code_read) {
                lastScannedCodeRef.current = code_read; // Update the ref with the new code
                setActiveQR(code_read.trim());
            }
        }, []); // Dependencies array is empty if there are no external dependencies

        const removeTag = useCallback((index) => {
            updateTagged(currentTagged => currentTagged.filter((_, i) => i !== index));
            setActiveQR(null);
            lastScannedCodeRef.current = null;
        }, []);

        const openModal = useCallback(() => {
            //console.log('Modal Opened!');
            setIsModalVisible(true);
        }, []);

        const closeModal = useCallback(() => {
            setIsModalVisible(false);
        }, []);

        const openModalText = useCallback(() => {
            setIsModalVisibleText(true);
        }, []);

        const closeModalText = useCallback(() => {
            setIsModalVisibleText(false);
        }, []);
        
        const codeScanner = useCodeScanner({
            codeTypes: ['qr', 'ean-13'],
            onCodeScanned: (codes) => {
                if (codes.length > 0) {
                    let code_read = codes[0].value;
                    //console.log('QR Value Read: ', code_read);
                    // Check if the new code is different from the last scanned code
                    if (code_read && lastScannedCodeRef.current !== code_read) {
                        lastScannedCodeRef.current = code_read; // Update the ref with the new code
                        setActiveQR(code_read.trim());
                    }
                }
            }
        });

        useEffect(() => {
            const fetchData = async () => {
                if (activeQR !== null && !activeQR.startsWith('http://') && !activeQR.startsWith('https://')) {
                    try {
                        const { getUsersBySomeField } = UsersApi();
                        const snapshot = await getUsersBySomeField('uid', activeQR);
                        if (snapshot && snapshot.docs) {
                            if (snapshot.docs.length === 0) {
                                //console.log(snapshot.docs);
                                throw new Error("No user found!");
                            } else if (snapshot.docs.length > 1) {
                                throw new Error("Multiple users found!");
                            } else {
                                let user = snapshot.docs[0].data(); // Assuming you want the first document
                                //console.log('User: ', user);
                                if (currentUser.uid === user.uid.trim()) {
                                    throw new Error("Cannot tag yourself!");
                                }
                                let check_val = (user.username?user.username.trim(): user.email.split('@')[0].trim());
                                // Add to local tagged variable
                                if (!tagged.includes(check_val)) {
                                    // Add user.uid to the top of the array
                                    const newTagged = [check_val, ...tagged];
                                    updateTagged(newTagged);
                                    //console.log('User tagged!: ', newTagged); 
                                } else {
                                    throw new Error("User already added!");
                                }
                            }
                        } else {
                            throw new Error("Invalid snapshot data!");
                        }
                    } catch (error) {
                        //console.log('Could not tag user: ', error);
                        Alert.alert("Error", error.message);
                    } finally {
                        closeModal();
                    }
                }
            };
            fetchData();
        }, [activeQR]); 

        useEffect(() => {
            const updateTaggedDatabase = async () => {
                if (sessionId) {
                    try {
                        await SessionsApi().updateSession(sessionId, {taggedUsers: tagged});
                        //console.log('Tagged users updated!');
                    } catch (error) {
                        //console.log('Could not tag users: ', error);
                        Alert.alert("Error", error.message);
                    }
                }
            };
            updateTaggedDatabase();
        }, [tagged]); 

    const groupedClimbs = props.currentSession;
    //Changes in display for active session (not empty), active session (empty), and the remaining sessions (Session class created in next PR).
    //Minor changes to ordering
    return (
        <ScrollView>
            {Object.entries(groupedClimbs).map(([key, climbs]) => (
                <View key={key}>
                    <View style={{paddingVertical: 5, paddingHorizontal: 20}}>
                        {(props.isCurrent && climbs && climbs.length > 0) && (
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                                <Text style={{color: 'black', fontWeight: 'bold'}}>Climbs in Current Session</Text>
                                <View style={{padding: 5, borderRadius: 5, borderWidth: 1, borderColor: '#fe8100'}}>
                                    <Text style={{color: '#fe8100'}}>LIVE</Text>
                                </View>
                            </View>
                        )}
                        {false && (props.isCurrent && climbs && climbs.length == 0) && (
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                                <Text style={{color: 'black', fontWeight: 'bold'}}>No active session</Text>
                                <View style={{padding: 5, borderRadius: 5, borderWidth: 1, borderColor: '#fe8100'}}>
                                    <Text style={{color: '#fe8100'}}>LIVE</Text>
                                </View>
                            </View>
                        )}
                    </View>
                    {(props.isCurrent && climbs && climbs.length > 0) && 
                        (<View style={{display:'flex', flexDirection: 'column', width: '100%'}}>
                        {false && (
                        <View style={{width: '100%', justifyContent:'center', display:'flex', alignItems: 'center', flexDirection: 'row', padding: 10}}>
                            <View style={{display:'flex', width:'20%', paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{color: 'black', fontWeight: '400'}}>{tagged.length} Tag{tagged.length!=1? 's': ''}</Text>
                            </View>
                            <View style={{display:'flex', width:'40%', paddingHorizontal: 10}}>
                            <TagButtonType onPress={openModalText} />
                            </View>
                            <View style={{display:'flex', width:'40%', paddingHorizontal: 10}}>
                            <TagButton onPress={openModal} />
                            </View>
                        </View>)}
                        
                        <ListHistory
                        data={climbs}
                        renderItem={(item, index, isHighlighted) => <ClimbItem climb={item} tapId={item.tapId} tapTimestamp={timeStampFormatting(item.tapTimestamp)} fromHome={props.fromHome} isHighlighted={(index == 0 && isHighlighted)}/>}
                        //highlighted variable passed for index 0, only if it is an active session
                        keyExtractor={(item, index) => index.toString()}
                        isHighlighted = {props.isCurrent}
                        /></View>)
                    }
                    {!props.isCurrent && 
                        (<SessionItem
                        data={climbs}
                        />)
                    }
                </View>
            ))}
            <Portal>
                <Modal visible={isModalVisible} onDismiss={closeModal} contentContainerStyle={{width: '90%', height: '40%', alignSelf:'center', display: 'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
                    <View style={{width: '100%', height:'100%', overflow:'hidden', borderRadius: 20}}>
                    {device == undefined || device == null?<></>: <Camera
                        style={{width:'100%', height:'100%'}}
                        device={device}
                        isActive={isModalVisible}
                        codeScanner={codeScanner}
                    />
                    }
                    </View>
                
                </Modal>
                <Modal visible={isModalVisibleText} onDismiss={closeModalText} contentContainerStyle={{width: '90%', height: '80%', alignSelf:'center', display: 'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
                    <View style={{width: '100%', height:'100%', borderRadius: 20, backgroundColor: '#F2F2F2', display:'flex', flexDirection:'column', justifyContent:'flex-start', alignItems:'center', padding: 10}}>
                        <ScrollView style={{flexGrow: 0,
                            flexShrink: 1,
                            maxHeight: '30%',
                            width: '100%',
                            paddingHorizontal: 10,
                            paddingTop: 10,
                            marginBottom: 10}}>
                                {tagged.map((tag, index) => (
                                    <View key={index} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 8, borderRadius: 10, marginBottom: 10, width:'100%'}}>
                                        <Text style={{color: 'black'}}>{tag}</Text>
                                        <TouchableOpacity onPress={() => removeTag(index)}>
                                        <Image source={require('./../../assets/cancel.png')} style={{ width: 24, height: 24 }}   resizeMode="contain" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                        </ScrollView>
                        <View style={{flex: 1, width: '100%', borderTopWidth: 0.5, borderTopColor: 'black', paddingTop: 10}}>
                            <UserSearch onTag={handleTag}/>
                        </View>
                    </View>
                </Modal>
            </Portal>
        </ScrollView>
    );
}

export default SessionTapHistory;
