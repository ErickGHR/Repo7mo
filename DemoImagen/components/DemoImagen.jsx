import {
  View,
  ImageBackground,
  StyleSheet,
  Image,
  Text,
} from "react-native";

const DemoImagen = () => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../assets/fondorana.jpg")}
        style={styles.fondo}
        resizeMode="cover"
      >
        <View style={styles.contenedorRana}>

          <View style={styles.fondoTitulo}>
            <Text style={styles.titulo}>Rana Aguacate</Text>
          </View>

          <Image
            source={require("../assets/rana.jpg")}
            style={styles.rana}
          />

        </View>
      </ImageBackground>
    </View>
  );
};

export default DemoImagen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  fondo: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },

  contenedorRana: {
    position: "absolute",
    alignSelf: "center",
    width: 470,
  },

  fondoTitulo: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.40)",
    paddingVertical: 10,
    alignItems: "center",
  },

  titulo: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },

  rana: {
    width: "100%",
    height: 150,
    resizeMode: "cover",

    borderWidth: 4,
    borderColor: "black",
  },
});