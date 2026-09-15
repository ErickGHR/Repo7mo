import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import PedometerSensor from "./components/Pedometer";

export default function App() {
  return (
    <View style={styles.container}>
      <PedometerSensor />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});