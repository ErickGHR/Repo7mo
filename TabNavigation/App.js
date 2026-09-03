import {Text,View} from 'react-native';
import{NavigationContainer}from'@react-navigation/native';
import{createBottomTabNavigator}from'@react-navigation/bottom-tabs';
import HomeScreen from './components/HomeScreen';
import SearchScreen from './components/SearchScreen';
import ProfileScreen from './components/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'blue',
        tabBarInactiveTintColor: 'gray',
      }}>

        <Tab.Screen name="Home" component={HomeScreen}/>
        <Tab.Screen name="Search" component={SearchScreen}/>
        <Tab.Screen name="Profile" component={ProfileScreen}/>
      
      </Tab.Navigator>
    </NavigationContainer>
  );
}
