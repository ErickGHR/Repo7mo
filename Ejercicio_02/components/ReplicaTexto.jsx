import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    ScrollView,
    Dimensions
} from "react-native";

export default function RepText() {
    const [text, setText] = useState("");
    const [enviar, setEnviar] = useState("");

    return (
        <ScrollView style={misEstilos.scroll}>
            <View style={misEstilos.container}>
                <View style={misEstilos.contenido}>

                    <Text style={misEstilos.titulo}>
                        Ejercicio_02
                    </Text>

                    <Text style={misEstilos.resultado}>
                        {enviar}
                    </Text>

                    <TextInput
                        style={misEstilos.input}
                        placeholder="Escribe aquí..."
                        value={text}
                        onChangeText={(t) => setText(t)}
                    />

                    <View style={misEstilos.boton}>
                        <Button
                            title="Enviar"
                            onPress={() => {
                                setEnviar(text);
                                alert("Texto enviado con éxito");
                            }}
                        />
                    </View>

                    <Text style={misEstilos.textoPrueba}>Texto de prueba 1</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 2</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 3</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 4</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 5</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 6</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 7</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 8</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 9</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 10</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 11</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 12</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 13</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 14</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 15</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 16</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 17</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 18</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 19</Text>
                    <Text style={misEstilos.textoPrueba}>Texto de prueba 20</Text>

                </View>
            </View>
        </ScrollView>
    );
}

const misEstilos = StyleSheet.create({
    scroll: {
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
        backgroundColor: "#f2f2f2",
    },

    container: {
        width: "100%",
        alignItems: "center",
        padding: 20,
    },

    contenido: {
        width: "100%",
        maxWidth: 400,
        backgroundColor: "white",
        padding: 20,
        borderRadius: 12,
    },

    titulo: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
    },

    resultado: {
        fontSize: 18,
        textAlign: "center",
        marginBottom: 15,
    },

    input: {
        width: "100%",
        height: 45,
        backgroundColor: "#eee",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        marginBottom: 15,
    },

    boton: {
        width: "100%",
        marginBottom: 25,
    },

    textoPrueba: {
        fontSize: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
});