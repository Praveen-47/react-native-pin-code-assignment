/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable jsx-quotes */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable comma-dangle */
/* eslint-disable prettier/prettier */
import React, { useEffect } from 'react';
import * as Keychain from 'react-native-keychain';
import { View, StyleSheet, AppState, AppStateStatus, Text, Button } from 'react-native';
import { RecoilRoot, useRecoilState, atom } from 'recoil';
import { NavigationContainer, } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PinCode, PinCodeT, clearPIN, hasSetPIN } from '@anhnch/react-native-pincode';

const MainStack = createStackNavigator();

const PinState = atom({
    key: 'common.pinState',
    default: {
        mode: PinCodeT.Modes.Enter,
        show: false,
        hasPin: false
    }
})

const HomeScreen = () => {
    const [pinState, setPinState] = useRecoilState(PinState);

    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 30, marginBottom: 30, fontWeight: 'bold' }}>React Native Pin Code</Text>
        {pinState.hasPin && <Button title='Show PinCode Enter'
            onPress={() => setPinState({ ...pinState, mode: PinCodeT.Modes.Enter, show: true })} />}
        <Button title='Set a new PIN'
            onPress={() => setPinState({ ...pinState, mode: PinCodeT.Modes.Set, show: true })} />
        {pinState.hasPin && <Button title='Remove PIN' onPress={() => {
            clearPIN();
            setPinState({ ...pinState, hasPin: false });
        }} />}
    </View>
}

const App = () => {
    const [pinState, setPinState] = useRecoilState(PinState);

    /** Show the Pin Enter screen on app load if user has set a PIN */
    useEffect(() => {
        Keychain.getGenericPassword().then(credential => {
            setPinState({ ...pinState, hasPin: credential ? true : false, show: credential ? true : false });
        });
    }, [])

    useEffect(() => {
        AppState.addEventListener("change", appStateChanged);
        return () => AppState.removeEventListener("change", appStateChanged);
    })

    /** You may want to protect the content when the app goes to inactivity or background */
    function appStateChanged(nextAppState) {
        if ((nextAppState == 'inactive' || nextAppState == 'background')
            && pinState.hasPin
            && pinState.mode != PinCodeT.Modes.Locked) {
            setPinState({ ...pinState, show: true, mode: PinCodeT.Modes.Enter });
        }
    }

    return <>
        <NavigationContainer fallback={<Text>Loading</Text>}>
            <MainStack.Navigator initialRouteName="Home">
                <MainStack.Screen name="Home" component={HomeScreen} />
            </MainStack.Navigator>
        </NavigationContainer>

        <PinCode mode={pinState.mode} visible={pinState.show}
            onSetCancel={() => setPinState({ ...pinState, show: false })}
            onSetSuccess={async (pin) => {
                await Keychain.setGenericPassword('pin', pin);
                setPinState({ show: false, mode: PinCodeT.Modes.Enter, hasPin: true });
            }}
            onEnterSuccess={() => setPinState({ ...pinState, mode: PinCodeT.Modes.Enter, show: false })}
            onResetSuccess={async () => {
                /** @todo implement your business logic before removing pin */
                // ...
                await Keychain.resetGenericPassword();
                setPinState({ mode: PinCodeT.Modes.Enter, show: false, hasPin: false });
            }}
            checkPin={async (pin) => {
                const credential = await Keychain.getGenericPassword();
                return (credential && credential.password == pin);
            }}
            styles={{ main: styles.pincode }} />
    </>;
}

const styles = StyleSheet.create({
    pincode: { position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, zIndex: 99, backgroundColor: '#006FB3' }
})

export default () => <RecoilRoot><App /></RecoilRoot>;