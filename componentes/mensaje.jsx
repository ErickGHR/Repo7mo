import { View, Text } from "react-native";

export default function Mensaje() {
    const variableMensaje="Esto es mi mensaje";
    const num=1000;
    const double= n => n*2;
  return (
    <View>
      <Text>{variableMensaje+" "+double(num)}</Text>
    </View>
  );
}