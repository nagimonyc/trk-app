import React, { useRef } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { PermissionsAndroid} from "react-native";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";

function ShareView({ route }) {
    // Destructure climbData from route.params
    const { climbData } = route.params;
    const { imageUrl, climbCount, grade, duration } = climbData;
    const viewRef = useRef();

    //Permission Check for Android
    async function hasAndroidPermission() {
        const getCheckPermissionPromise = () => {
          if (Platform.Version >= 33) {
            return Promise.all([
              PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES),
              PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO),
            ]).then(
              ([hasReadMediaImagesPermission, hasReadMediaVideoPermission]) =>
                hasReadMediaImagesPermission && hasReadMediaVideoPermission,
            );
          } else {
            return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
          }
        };
      
        const hasPermission = await getCheckPermissionPromise();
        if (hasPermission) {
          return true;
        }
        const getRequestPermissionPromise = () => {
          if (Platform.Version >= 33) {
            return PermissionsAndroid.requestMultiple([
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            ]).then(
              (statuses) =>
                statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
                  PermissionsAndroid.RESULTS.GRANTED &&
                statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] ===
                  PermissionsAndroid.RESULTS.GRANTED,
            );
          } else {
            return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE).then((status) => status === PermissionsAndroid.RESULTS.GRANTED);
          }
        };
      
        return await getRequestPermissionPromise();
      }
      
      async function savePicture(tag) {
        if (Platform.OS === "android" && !(await hasAndroidPermission())) {
          return;
        }
        CameraRoll.save(tag, {type: 'photo'});
      };

    const saveView = async () => {
        try {
            const uri = await captureRef(viewRef, {
                format: 'jpg',
                quality: 0.8,
            });

            const fileName = `climb-share-${Date.now()}.jpg`.replace(':','-');
            let filePath;
            if (Platform.OS === 'android') {
                filePath = `${RNFS.ExternalDirectoryPath}/${fileName}`;
            } else {
                filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
            }
            //console.log(uri);
            await RNFS.copyFile(uri, filePath);
            return filePath;
        } catch (error) {
            console.error('Error saving the image: ', error);
        }
    };

    const shareView = async () => {
        try {
            const filePath = await saveView();
            if (filePath) {
                await Share.open({
                    url: `file://${filePath}`,
                    type: 'image/jpeg',
                });
                Toast.show({ type: 'success', text1: 'Image loaded successfully!' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to load image!' });
            console.error('Error sharing the image: ', error);
        }
    };

    const saveImageLocally = async () => {
        try {
            const filePath = await saveView();
            if (filePath) {
                await savePicture(filePath);
                Toast.show({ type: 'success', text1: 'Image saved successfully!' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to save image!' });
            console.error('Error sharing the image: ', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.captureArea} ref={viewRef} collapsable={false}>
                <Image source={{ uri: imageUrl }} style={styles.image} />
                <Image
                    source={require('../../../../../assets/Nagimo-Logotype.png')}
                    style={styles.logo}
                />
                <LinearGradient
                    style={styles.textOverlay}
                    colors={['transparent', '#505050']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}>
                    <View style={{ flex: 1, alignSelf: 'flex-end', marginLeft: 10 }}>
                        <Text style={styles.overlayText}>Climbs</Text>
                        <Text style={styles.overlayTextBig}>{climbCount}</Text>
                    </View>
                    <View style={{ flex: 1, alignSelf: 'flex-end' }}>
                        <Text style={styles.overlayText}>Time</Text>
                        <Text style={styles.overlayTextBig}>{duration}</Text>
                    </View>
                    <View style={{ flex: 1, alignSelf: 'flex-end', marginRight: 10 }}>
                        <Text style={styles.overlayText}>Last Climb</Text>
                        <Text style={styles.overlayTextBig}>{grade}</Text>
                    </View>
                </LinearGradient>
            </View>
            <View style={{display:'flex', flexDirection:'row', justifyContent: 'space-around', width: '90%'}}>
                <TouchableOpacity style={styles.shareButton} onPress={saveImageLocally}>
                    <Text style={styles.shareButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton} onPress={shareView}>
                    <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    captureArea: {
        width: '80%',
        height: '60%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    logo: {
        position: 'absolute',
        top: -5,
        right: 0,
        width: 125,
        height: 50,
        resizeMode: 'contain',
    },
    textOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingBottom: 10,
    },
    overlayText: {
        color: '#FFFEFF',
        fontSize: 14,
        marginBottom: 5,
    },
    overlayTextBig: {
        color: '#FFFEFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    shareButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#3498db',
        borderRadius: 20,
        width: '40%',
    },
    shareButtonText: {
        color: 'white',
        textAlign: 'center'
    },
});

export default ShareView;