package com.pulso.sensorlab;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

final class Ui {
    static final int BG = Color.rgb(7, 17, 31);
    static final int PANEL = Color.rgb(16, 30, 48);
    static final int PANEL_LIGHT = Color.rgb(21, 38, 59);
    static final int LINE = Color.rgb(34, 54, 77);
    static final int TEXT = Color.rgb(244, 247, 251);
    static final int MUTED = Color.rgb(145, 163, 184);
    static final int CYAN = Color.rgb(72, 215, 197);
    static final int BLUE = Color.rgb(112, 167, 255);
    static final int AMBER = Color.rgb(255, 196, 107);
    static final int PINK = Color.rgb(255, 142, 161);
    static final int PURPLE = Color.rgb(180, 145, 255);

    private Ui() { }

    static int dp(Context context, float value) {
        return Math.round(value * context.getResources().getDisplayMetrics().density);
    }

    static TextView text(Context context, String value, float size, int color, boolean bold) {
        TextView view = new TextView(context);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        view.setIncludeFontPadding(false);
        if (bold) view.setTypeface(Typeface.create("sans-serif", Typeface.BOLD));
        return view;
    }

    static GradientDrawable rounded(int color, int radiusDp, int strokeColor, int strokeDp, Context context) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(dp(context, radiusDp));
        if (strokeDp > 0) drawable.setStroke(dp(context, strokeDp), strokeColor);
        return drawable;
    }

    static LinearLayout column(Context context) {
        LinearLayout layout = new LinearLayout(context);
        layout.setOrientation(LinearLayout.VERTICAL);
        return layout;
    }

    static LinearLayout row(Context context) {
        LinearLayout layout = new LinearLayout(context);
        layout.setOrientation(LinearLayout.HORIZONTAL);
        layout.setGravity(Gravity.CENTER_VERTICAL);
        return layout;
    }

    static LinearLayout.LayoutParams params(Context context, int width, int height) {
        return new LinearLayout.LayoutParams(
                width < 0 ? width : dp(context, width),
                height < 0 ? height : dp(context, height));
    }

    static LinearLayout.LayoutParams weighted(Context context, float weight, int height) {
        return new LinearLayout.LayoutParams(0, height < 0 ? height : dp(context, height), weight);
    }

    static void space(LinearLayout parent, Context context, int heightDp) {
        View spacer = new View(context);
        parent.addView(spacer, params(context, 1, heightDp));
    }

    static TextView eyebrow(Context context, String value, int color) {
        TextView view = text(context, value.toUpperCase(), 11, color, true);
        view.setLetterSpacing(0.14f);
        return view;
    }
}
