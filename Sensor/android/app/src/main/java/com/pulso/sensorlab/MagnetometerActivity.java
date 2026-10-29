package com.pulso.sensorlab;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.view.Gravity;
import android.view.Surface;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.Locale;

public class MagnetometerActivity extends BaseActivity implements SensorEventListener {
    private SensorManager sensorManager;
    private Sensor magneticSensor;
    private Sensor accelerometer;
    private TextView status;
    private TextView[] axes;
    private TextView magnitude;
    private TextView headingLabel;
    private CompassView compass;
    private float[] magneticValues;
    private float[] gravityValues;
    private final float[] rotationMatrix = new float[9];
    private final float[] remappedMatrix = new float[9];
    private final float[] orientation = new float[3];

    @Override protected String pageTitle() { return "Magnetómetro"; }
    @Override protected int pageNumber() { return 5; }

    @Override
    protected View createContent() {
        ScrollView scroll = new ScrollView(this);
        LinearLayout page = Ui.column(this);
        page.setPadding(Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 28));
        scroll.addView(page);

        LinearLayout intro = Ui.column(this);
        intro.setPadding(Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 20));
        intro.setBackground(Ui.rounded(Ui.PANEL, 24, Ui.LINE, 1, this));
        intro.addView(Ui.eyebrow(this, "Campo magnético  ·  microteslas", Ui.CYAN));
        TextView description = Ui.text(this,
                "Lee el campo magnético en los tres ejes y calcula un rumbo compensado con la gravedad.",
                14, Ui.MUTED, false);
        description.setLineSpacing(Ui.dp(this, 4), 1f);
        LinearLayout.LayoutParams descParams = Ui.params(this, -1, -2);
        descParams.topMargin = Ui.dp(this, 12);
        intro.addView(description, descParams);
        status = Ui.text(this, "●  ESPERANDO SENSORES", 11, Ui.CYAN, true);
        status.setLetterSpacing(0.08f);
        status.setPadding(Ui.dp(this, 12), Ui.dp(this, 10), Ui.dp(this, 12), Ui.dp(this, 10));
        status.setBackground(Ui.rounded(0x2214D7C5, 20, 0x5548D7C5, 1, this));
        LinearLayout.LayoutParams statusParams = Ui.params(this, -2, -2);
        statusParams.topMargin = Ui.dp(this, 16);
        intro.addView(status, statusParams);
        page.addView(intro);

        LinearLayout compassCard = Ui.column(this);
        compassCard.setGravity(Gravity.CENTER_HORIZONTAL);
        compassCard.setPadding(Ui.dp(this, 18), Ui.dp(this, 19), Ui.dp(this, 18), Ui.dp(this, 19));
        compassCard.setBackground(Ui.rounded(Ui.PANEL, 24, Ui.LINE, 1, this));
        headingLabel = Ui.text(this, "—°", 36, Ui.TEXT, true);
        compassCard.addView(headingLabel);
        TextView headingCaption = Ui.eyebrow(this, "RUMBO MAGNÉTICO", Ui.MUTED);
        LinearLayout.LayoutParams captionParams = Ui.params(this, -2, -2);
        captionParams.topMargin = Ui.dp(this, 6);
        compassCard.addView(headingCaption, captionParams);
        compass = new CompassView(this);
        LinearLayout.LayoutParams compassParams = Ui.params(this, 220, 220);
        compassParams.topMargin = Ui.dp(this, 12);
        compassCard.addView(compass, compassParams);
        magnitude = Ui.text(this, "Intensidad total: — µT", 13, Ui.CYAN, true);
        LinearLayout.LayoutParams magnitudeParams = Ui.params(this, -2, -2);
        magnitudeParams.topMargin = Ui.dp(this, 10);
        compassCard.addView(magnitude, magnitudeParams);
        LinearLayout.LayoutParams compassCardParams = Ui.params(this, -1, -2);
        compassCardParams.topMargin = Ui.dp(this, 16);
        page.addView(compassCard, compassCardParams);

        LinearLayout axesCard = Ui.column(this);
        axesCard.setPadding(Ui.dp(this, 18), Ui.dp(this, 17), Ui.dp(this, 18), Ui.dp(this, 17));
        axesCard.setBackground(Ui.rounded(Ui.PANEL, 20, Ui.LINE, 1, this));
        axes = new TextView[3];
        String[] labels = {"EJE X", "EJE Y", "EJE Z"};
        for (int i = 0; i < 3; i++) {
            LinearLayout line = Ui.row(this);
            TextView axis = Ui.eyebrow(this, labels[i], Ui.MUTED);
            line.addView(axis, new LinearLayout.LayoutParams(0, -2, 1f));
            axes[i] = Ui.text(this, "— µT", 15, Ui.TEXT, true);
            line.addView(axes[i]);
            axesCard.addView(line, Ui.params(this, -1, 38));
        }
        LinearLayout.LayoutParams axesCardParams = Ui.params(this, -1, -2);
        axesCardParams.topMargin = Ui.dp(this, 14);
        page.addView(axesCard, axesCardParams);

        TextView tip = Ui.text(this,
                "Aleja el teléfono de imanes y metal. La brújula muestra norte magnético aproximado; una calibración en forma de ocho puede mejorar la lectura.",
                12, Ui.MUTED, false);
        tip.setLineSpacing(Ui.dp(this, 4), 1f);
        LinearLayout.LayoutParams tipParams = Ui.params(this, -1, -2);
        tipParams.topMargin = Ui.dp(this, 16);
        page.addView(tip, tipParams);
        return scroll;
    }

    @Override
    protected void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            magneticSensor = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        }
        updateStatus(magneticSensor == null ? "MAGNETÓMETRO NO DISPONIBLE" : "LISTO PARA LEER");
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (sensorManager == null) return;
        boolean magneticReady = magneticSensor != null
                && sensorManager.registerListener(this, magneticSensor, SensorManager.SENSOR_DELAY_UI);
        boolean gravityReady = accelerometer != null
                && sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_UI);
        updateStatus(magneticReady
                ? (gravityReady ? "●  SENSORES ACTIVOS" : "●  RUMBO SIN COMPENSAR")
                : "MAGNETÓMETRO NO DISPONIBLE");
    }

    @Override
    protected void onPause() {
        if (sensorManager != null) sensorManager.unregisterListener(this);
        super.onPause();
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD) {
            magneticValues = event.values.clone();
            axes[0].setText(String.format(Locale.getDefault(), "%+.1f µT", magneticValues[0]));
            axes[1].setText(String.format(Locale.getDefault(), "%+.1f µT", magneticValues[1]));
            axes[2].setText(String.format(Locale.getDefault(), "%+.1f µT", magneticValues[2]));
            float strength = (float) Math.sqrt(magneticValues[0] * magneticValues[0]
                    + magneticValues[1] * magneticValues[1]
                    + magneticValues[2] * magneticValues[2]);
            magnitude.setText(String.format(Locale.getDefault(), "Intensidad total: %.1f µT", strength));
        } else if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            gravityValues = event.values.clone();
        }

        if (magneticValues == null) return;
        if (gravityValues != null && SensorManager.getRotationMatrix(
                rotationMatrix, null, gravityValues, magneticValues)) {
            int axisX = SensorManager.AXIS_X;
            int axisY = SensorManager.AXIS_Y;
            int rotation = getWindowManager().getDefaultDisplay().getRotation();
            if (rotation == Surface.ROTATION_90) {
                axisX = SensorManager.AXIS_Y;
                axisY = SensorManager.AXIS_MINUS_X;
            } else if (rotation == Surface.ROTATION_180) {
                axisX = SensorManager.AXIS_MINUS_X;
                axisY = SensorManager.AXIS_MINUS_Y;
            } else if (rotation == Surface.ROTATION_270) {
                axisX = SensorManager.AXIS_MINUS_Y;
                axisY = SensorManager.AXIS_X;
            }
            SensorManager.remapCoordinateSystem(rotationMatrix, axisX, axisY, remappedMatrix);
            SensorManager.getOrientation(remappedMatrix, orientation);
            float degrees = (float) Math.toDegrees(orientation[0]);
            if (degrees < 0) degrees += 360f;
            headingLabel.setText(String.format(Locale.getDefault(), "%.0f°", degrees));
            compass.setHeading(degrees);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        if (accuracy == SensorManager.SENSOR_STATUS_UNRELIABLE) updateStatus("CALIBRACIÓN RECOMENDADA");
    }

    private void updateStatus(String message) {
        if (status != null) status.setText(message);
    }
}
