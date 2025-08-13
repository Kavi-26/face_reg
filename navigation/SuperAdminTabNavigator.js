import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import SuperAdminDashboard from '../screens/SuperAdminDashboard';
import SuperAdminCapture from '../screens/SuperAdminCapture';
import SuperAdminProfile from '../screens/SuperAdminProfile';
import AddEmployee from '../screens/AddEmployee';
import EditProfile from '../screens/EditProfile';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SuperAdminStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboard} />
      <Stack.Screen name="AddEmployee" component={AddEmployee} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
    </Stack.Navigator>
  );
}

export default function SuperAdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'speedometer';
          else if (route.name === 'SuperAdminCapture') iconName = 'camera';
          else if (route.name === 'SuperAdminProfile') iconName = 'person-circle';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e0e0e0',
          borderTopWidth: 1,
          paddingTop: 5,
          paddingBottom: 5,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={SuperAdminStackNavigator}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="SuperAdminCapture" 
        component={SuperAdminCapture}
        options={{ title: 'Capture' }}
      />
      <Tab.Screen 
        name="SuperAdminProfile" 
        component={SuperAdminProfile}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}