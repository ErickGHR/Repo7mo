import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";

export default function CurrencyScreen() {
  const [usd, setUsd] = useState("");
  const [mxn, setMxn] = useState(null);

  const convertir = () => {
    if (!usd) return;

    setMxn((parseFloat(usd) * 18).toFixed(2));
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text>Cantidad en dólares:</Text>

      <TextInput
        keyboardType="numeric"
        value={usd}
        onChangeText={setUsd}
        style={{
          borderWidth: 1,
          marginBottom: 10,
          padding: 5,
        }}
      />

      <Button title="Convertir a MXN" onPress={convertir} />

      {mxn && (
        <Text style={{ marginTop: 20, fontSize: 18 }}>
          {usd} USD = {mxn} MXN
        </Text>
      )}
    </View>
  );
}
