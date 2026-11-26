package com.pulso.sensorlab;

import android.hardware.Sensor;

public class GyroscopeActivity extends SensorDemoActivity {
    @Override protected int sensorType() { return Sensor.TYPE_GYROSCOPE; }
    @Override protected String sensorTitle() { return "Giroscopio"; }
    @Override protected String sensorDescription() {
        return "Registra qué tan rápido gira el dispositivo alrededor de cada eje. La lectura se acerca a cero cuando deja de rotar.";
    }
    @Override protected String unit() { return "rad/s"; }
    @Override protected int accentColor() { return Ui.PINK; }
    @Override protected float displayDivisor() { return 1f; }
    @Override protected float barRange() { return 3f; }
    @Override protected int screenNumber() { return 3; }
}
