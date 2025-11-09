import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

import LoginScreen from './src/screens/LoginScreen';
import JobsScreen from './src/screens/JobsScreen';
import JobDetailScreen from './src/screens/JobDetailScreen';
import MapScreen from './src/screens/MapScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TimeEntryScreen from './src/screens/TimeEntryScreen';
import InventoryUsageScreen from './src/screens/InventoryUsageScreen';
import ExpenseScreen from './src/screens/ExpenseScreen';

import { useAuthStore } from './src/store/auth-store';
import { syncJobs } from './src/services/sync';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const BACKGROUND_SYNC_TASK = 'background-sync';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Define background sync task
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    await syncJobs();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background sync failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register background sync on app start
async function registerBackgroundSync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background sync registered');
    }
  } catch (error) {
    console.error('Failed to register background sync:', error);
  }
}

function JobsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="JobsList" component={JobsScreen} options={{ title: 'My Jobs' }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Detail' }} />
      <Stack.Screen name="TimeEntry" component={TimeEntryScreen} options={{ title: 'Time Tracking' }} />
      <Stack.Screen name="InventoryUsage" component={InventoryUsageScreen} options={{ title: 'Inventory Usage' }} />
      <Stack.Screen name="Expense" component={ExpenseScreen} options={{ title: 'Expenses' }} />
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
      <Tab.Screen
        name="Jobs"
        component={JobsStack}
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: () => null, // Can add icons later
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
          headerShown: true,
          title: 'Job Map',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          headerShown: true,
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      registerBackgroundSync();
    }
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="auto" />
        {isAuthenticated ? <MainTabs /> : <LoginScreen />}
      </NavigationContainer>
    </QueryClientProvider>
  );
}
