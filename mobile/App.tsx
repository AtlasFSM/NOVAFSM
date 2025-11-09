import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/LoginScreen';
import JobsScreen from './src/screens/JobsScreen';
import JobDetailScreen from './src/screens/JobDetailScreen';
import MapScreen from './src/screens/MapScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FormsScreen from './src/screens/FormsScreen';
import FormResponseDetailScreen from './src/screens/FormResponseDetailScreen';
import AssetsScreen from './src/screens/AssetsScreen';
import AssetDetailScreen from './src/screens/AssetDetailScreen';
import DocumentsScreen from './src/screens/DocumentsScreen';
import DocumentDetailScreen from './src/screens/DocumentDetailScreen';

import { useAuthStore } from './src/store/auth-store';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function JobsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="JobsList" component={JobsScreen} options={{ title: 'My Jobs' }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Detail' }} />
    </Stack.Navigator>
  );
}

function FormsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="FormsList" component={FormsScreen} options={{ title: 'Forms' }} />
      <Stack.Screen name="FormResponseDetail" component={FormResponseDetailScreen} options={{ title: 'Form Response' }} />
    </Stack.Navigator>
  );
}

function AssetsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AssetsList" component={AssetsScreen} options={{ title: 'Assets' }} />
      <Stack.Screen name="AssetDetail" component={AssetDetailScreen} options={{ title: 'Asset Detail' }} />
    </Stack.Navigator>
  );
}

function DocumentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DocumentsList" component={DocumentsScreen} options={{ title: 'Documents' }} />
      <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} options={{ title: 'Document Detail' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
      }}
    >
      <Tab.Screen name="Jobs" component={JobsStack} />
      <Tab.Screen name="Forms" component={FormsStack} />
      <Tab.Screen name="Assets" component={AssetsStack} />
      <Tab.Screen name="Documents" component={DocumentsStack} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="auto" />
        {isAuthenticated ? <MainTabs /> : <LoginScreen />}
      </NavigationContainer>
    </QueryClientProvider>
  );
}
