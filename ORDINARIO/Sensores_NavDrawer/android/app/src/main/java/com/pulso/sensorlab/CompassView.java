package com.pulso.sensorlab;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.view.View;

final class CompassView extends View {
    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private float heading;

    CompassView(Context context) {
        super(context);
        setContentDescription("Brújula que indica el norte magnético aproximado");
    }

    void setHeading(float value) {
        heading = value;
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        float cx = getWidth() / 2f;
        float cy = getHeight() / 2f;
        float radius = Math.min(cx, cy) * 0.82f;

        paint.setStyle(Paint.Style.FILL);
        paint.setColor(Ui.PANEL_LIGHT);
        canvas.drawCircle(cx, cy, radius, paint);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(Ui.dp(getContext(), 1.5f));
        paint.setColor(Ui.LINE);
        canvas.drawCircle(cx, cy, radius, paint);
        canvas.drawCircle(cx, cy, radius * 0.72f, paint);

        paint.setStyle(Paint.Style.FILL);
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setTypeface(android.graphics.Typeface.create("sans-serif", android.graphics.Typeface.BOLD));
        paint.setTextSize(Ui.dp(getContext(), 12));
        String[] labels = {"N", "E", "S", "O"};
        for (int i = 0; i < labels.length; i++) {
            double angle = Math.toRadians(i * 90 - 90);
            float x = cx + (float) Math.cos(angle) * radius * 0.86f;
            float y = cy + (float) Math.sin(angle) * radius * 0.86f
                    + paint.getTextSize() * 0.35f;
            paint.setColor(i == 0 ? Ui.CYAN : Ui.MUTED);
            canvas.drawText(labels[i], x, y, paint);
        }

        canvas.save();
        canvas.rotate(-heading, cx, cy);
        Path needle = new Path();
        needle.moveTo(cx, cy - radius * 0.53f);
        needle.lineTo(cx - radius * 0.13f, cy + radius * 0.10f);
        needle.lineTo(cx, cy + radius * 0.02f);
        needle.lineTo(cx + radius * 0.13f, cy + radius * 0.10f);
        needle.close();
        paint.setColor(Ui.CYAN);
        canvas.drawPath(needle, paint);
        paint.setColor(Ui.PINK);
        Path south = new Path();
        south.moveTo(cx, cy + radius * 0.44f);
        south.lineTo(cx - radius * 0.10f, cy + radius * 0.06f);
        south.lineTo(cx + radius * 0.10f, cy + radius * 0.06f);
        south.close();
        canvas.drawPath(south, paint);
        paint.setColor(Ui.TEXT);
        canvas.drawCircle(cx, cy, Ui.dp(getContext(), 5), paint);
        canvas.restore();
    }
}
