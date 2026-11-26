package com.pulso.sensorlab;

import android.hardware.Sensor;
import android.hardware.SensorManager;

public class AccelerometerActivity extends SensorDemoActivity {
    @Override protected int sensorType() { return Sensor.TYPE_ACCELEROMETER; }
    @Override protected String sensorTitle() { return "Acelerómetro"; }
    @Override protected String sensorDescription() {
        return "Mide la aceleración del teléfono en los ejes X, Y y Z. Incluye la gravedad cuando el dispositivo está quieto.";
    }
    @Override protected String unit() { return "g"; }
    @Override protected int accentColor() { return Ui.BLUE; }
    @Override protected float displayDivisor() { return SensorManager.GRAVITY_EARTH; }
    @Override protected float barRange() { return 2f; }
    @Override protected int screenNumber() { return 2; }
}
