import React, { useContext } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './Navigation/AppNavigator';
import AuthNavigator from './Navigation/AuthNavigator';
import { AuthProvider, AuthContext } from './Utils/AuthContext';
import { Provider } from 'react-redux';
import store from './reduxStore';
import Toast from 'react-native-toast-message';
import OnboardingNavigator from './Navigation/OnboardingNavigator';

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

  const { currentUser, isNewUser } = useContext(AuthContext);

  // Determine which navigator to show
  let content;
  if (currentUser) {
    content = isNewUser ? <OnboardingNavigator /> : <AppNavigator />;
  } else {
    content = <AuthNavigator />;
  }

  return (
    <PaperProvider>
      {content}
      <Toast />
    </PaperProvider>
  );
}

export default AppWrapper;