package com.pulso.sensorlab;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.Locale;

abstract class SensorDemoActivity extends BaseActivity implements SensorEventListener {
    private SensorManager sensorManager;
    private Sensor sensor;
    private TextView status;
    private final TextView[] readings = new TextView[3];
    private final AxisBar[] bars = new AxisBar[3];
    private boolean sensorAvailable;

    protected abstract int sensorType();
    protected abstract String sensorTitle();
    protected abstract String sensorDescription();
    protected abstract String unit();
    protected abstract int accentColor();
    protected abstract float displayDivisor();
    protected abstract float barRange();
    protected abstract int screenNumber();

    @Override
    protected String pageTitle() { return sensorTitle(); }

    @Override
    protected int pageNumber() { return screenNumber(); }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        sensor = sensorManager == null ? null : sensorManager.getDefaultSensor(sensorType());
        sensorAvailable = sensor != null;
        updateStatus(sensorAvailable ? "PREPARADO" : "NO DISPONIBLE");
    }

    @Override
    protected View createContent() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(false);
        LinearLayout page = Ui.column(this);
        page.setPadding(Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 28));
        scroll.addView(page);

        LinearLayout intro = Ui.column(this);
        intro.setPadding(Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 20));
        intro.setBackground(Ui.rounded(Ui.PANEL, 26, Ui.LINE, 1, this));
        intro.addView(Ui.eyebrow(this, "Instrumento  ·  " + unit(), accentColor()));
        TextView description = Ui.text(this, sensorDescription(), 15, Ui.MUTED, false);
        description.setLineSpacing(Ui.dp(this, 4), 1f);
        LinearLayout.LayoutParams descParams = Ui.params(this, -1, -2);
        descParams.topMargin = Ui.dp(this, 14);
        intro.addView(description, descParams);
        status = Ui.text(this, "●  ESPERANDO SENSOR", 11, Ui.CYAN, true);
        status.setLetterSpacing(0.08f);
        status.setPadding(Ui.dp(this, 12), Ui.dp(this, 10), Ui.dp(this, 12), Ui.dp(this, 10));
        status.setBackground(Ui.rounded(0x2214D7C5, 20, 0x5548D7C5, 1, this));
        LinearLayout.LayoutParams statusParams = Ui.params(this, -2, -2);
        statusParams.topMargin = Ui.dp(this, 18);
        intro.addView(status, statusParams);
        page.addView(intro);

        LinearLayout.LayoutParams sectionParams = Ui.params(this, -1, -2);
        sectionParams.topMargin = Ui.dp(this, 26);
        page.addView(Ui.eyebrow(this, "Lecturas en tiempo real", Ui.MUTED), sectionParams);

        LinearLayout axes = Ui.row(this);
        axes.setGravity(Gravity.TOP);
        axes.setPadding(Ui.dp(this, 8), Ui.dp(this, 18), Ui.dp(this, 8), Ui.dp(this, 18));
        axes.setBackground(Ui.rounded(Ui.PANEL, 22, Ui.LINE, 1, this));
        String[] labels = {"EJE X", "EJE Y", "EJE Z"};
        for (int i = 0; i < 3; i++) {
            LinearLayout axis = Ui.column(this);
            axis.setPadding(Ui.dp(this, 10), Ui.dp(this, 4), Ui.dp(this, 10), Ui.dp(this, 4));
            TextView label = Ui.eyebrow(this, labels[i], Ui.MUTED);
            label.setTextSize(9);
            axis.addView(label);
            readings[i] = Ui.text(this, "0.00", 22, Ui.TEXT, true);
            LinearLayout.LayoutParams valueParams = Ui.params(this, -1, -2);
            valueParams.topMargin = Ui.dp(this, 13);
            axis.addView(readings[i], valueParams);
            TextView axisUnit = Ui.text(this, unit(), 10, Ui.MUTED, false);
            LinearLayout.LayoutParams unitParams = Ui.params(this, -1, -2);
            unitParams.topMargin = Ui.dp(this, 4);
            axis.addView(axisUnit, unitParams);
            bars[i] = new AxisBar(this, accentColor());
            LinearLayout.LayoutParams barParams = Ui.params(this, -1, 5);
            barParams.topMargin = Ui.dp(this, 15);
            axis.addView(bars[i], barParams);
            LinearLayout.LayoutParams axisParams = new LinearLayout.LayoutParams(0,
                    LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            if (i > 0) axisParams.leftMargin = Ui.dp(this, 4);
            axes.addView(axis, axisParams);
        }
        LinearLayout.LayoutParams axesParams = Ui.params(this, -1, -2);
        axesParams.topMargin = Ui.dp(this, 12);
        page.addView(axes, axesParams);

        LinearLayout note = Ui.column(this);
        note.setPadding(Ui.dp(this, 18), Ui.dp(this, 17), Ui.dp(this, 18), Ui.dp(this, 17));
        note.setBackground(Ui.rounded(Ui.PANEL_LIGHT, 19, Ui.LINE, 1, this));
        note.addView(Ui.eyebrow(this, "Qué observar", accentColor()));
        TextView noteText = Ui.text(this,
                "Mueve o gira el dispositivo lentamente. Las barras y cifras se actualizan desde el sensor físico del Android.",
                13, Ui.MUTED, false);
        noteText.setLineSpacing(Ui.dp(this, 4), 1f);
        LinearLayout.LayoutParams noteTextParams = Ui.params(this, -1, -2);
        noteTextParams.topMargin = Ui.dp(this, 9);
        note.addView(noteText, noteTextParams);
        LinearLayout.LayoutParams noteParams = Ui.params(this, -1, -2);
        noteParams.topMargin = Ui.dp(this, 16);
        page.addView(note, noteParams);
        return scroll;
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (sensorManager == null) return;
        if (sensor != null && sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_UI)) {
            updateStatus("●  SENSOR ACTIVO");
        } else {
            updateStatus("SENSOR NO DISPONIBLE");
        }
    }

    @Override
    protected void onPause() {
        if (sensorManager != null) sensorManager.unregisterListener(this);
        super.onPause();
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.values.length < 3) return;
        float divisor = displayDivisor();
        for (int i = 0; i < 3; i++) {
            float value = event.values[i] / divisor;
            readings[i].setText(String.format(Locale.getDefault(), "%+.2f", value));
            bars[i].setReading(value, barRange());
        }
        sensorAvailable = true;
        updateStatus("●  SENSOR ACTIVO");
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        if (accuracy == SensorManager.SENSOR_STATUS_UNRELIABLE) {
            updateStatus("PRECISIÓN BAJA");
        }
    }

    private void updateStatus(String value) {
        if (status == null) return;
        status.setText(value);
        status.setTextColor(sensorAvailable ? Ui.CYAN : Ui.AMBER);
    }

    private static final class AxisBar extends View {
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final int color;
        private float fraction;

        AxisBar(Context context, int color) {
            super(context);
            this.color = color;
        }

        void setReading(float value, float range) {
            fraction = Math.min(1f, Math.abs(value) / Math.max(0.01f, range));
            invalidate();
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            float radius = getHeight() / 2f;
            paint.setColor(Ui.LINE);
            canvas.drawRoundRect(0, 0, getWidth(), getHeight(), radius, radius, paint);
            paint.setColor(color);
            canvas.drawRoundRect(0, 0, Math.max(getHeight(), getWidth() * fraction),
                    getHeight(), radius, radius, paint);
        }
    }
}
