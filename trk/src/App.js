import React, { useContext } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './Navigation/AppNavigator';
import AuthScreen from './Navigation/AuthScreen';
import { AuthProvider, AuthContext } from './Utils/AuthContext';
import { Provider } from 'react-redux';
import store from './reduxStore';
import Toast from 'react-native-toast-message';

function AppWrapper() {
  //console.log('[TEST] AppWrapper called');
  return (
    <AuthProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </AuthProvider>
  );
}


function App(props) {
  //console.log('[TEST] App called');

  const { currentUser } = useContext(AuthContext);

  // Determine which navigator to show
  return (
    <PaperProvider>
      {currentUser ? <AppNavigator /> : <AuthScreen />}
      <Toast />
    </PaperProvider>
  );
}

export default AppWrapper;