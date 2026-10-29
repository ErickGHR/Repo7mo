package com.pulso.sensorlab;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

public class SplashActivity extends Activity {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable launchHome = () -> {
        startActivity(new Intent(this, MainActivity.class));
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        finish();
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getActionBar() != null) getActionBar().hide();
        Window window = getWindow();
        window.setStatusBarColor(Ui.BG);
        window.setNavigationBarColor(Ui.BG);

        FrameLayout background = new FrameLayout(this);
        background.setBackgroundColor(Ui.BG);
        LinearLayout content = Ui.column(this);
        content.setGravity(Gravity.CENTER);

        FrameLayout mark = new FrameLayout(this);
        mark.setBackground(Ui.rounded(Ui.CYAN, 28, Ui.CYAN, 1, this));
        TextView glyph = Ui.text(this, "⌁", 60, Ui.BG, true);
        glyph.setGravity(Gravity.CENTER);
        mark.addView(glyph, new FrameLayout.LayoutParams(-1, -1));
        content.addView(mark, Ui.params(this, 108, 108));

        TextView title = Ui.text(this, "P U L S O", 28, Ui.TEXT, true);
        LinearLayout.LayoutParams titleParams = Ui.params(this, -2, -2);
        titleParams.topMargin = Ui.dp(this, 24);
        content.addView(title, titleParams);
        TextView subtitle = Ui.eyebrow(this, "Laboratorio móvil", Ui.MUTED);
        subtitle.setTextSize(12);
        LinearLayout.LayoutParams subtitleParams = Ui.params(this, -2, -2);
        subtitleParams.topMargin = Ui.dp(this, 9);
        content.addView(subtitle, subtitleParams);

        TextView status = Ui.eyebrow(this, "SENSORES · MOVIMIENTO · ORIENTACIÓN", Ui.CYAN);
        status.setTextSize(9);
        LinearLayout.LayoutParams statusParams = Ui.params(this, -2, -2);
        statusParams.topMargin = Ui.dp(this, 46);
        content.addView(status, statusParams);

        FrameLayout.LayoutParams contentParams = new FrameLayout.LayoutParams(-1, -1);
        background.addView(content, contentParams);
        setContentView(background);

        mark.setScaleX(0.88f);
        mark.setScaleY(0.88f);
        mark.animate().scaleX(1f).scaleY(1f).setDuration(680)
                .setInterpolator(new AccelerateDecelerateInterpolator()).start();
        handler.postDelayed(launchHome, 1100);
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(launchHome);
        super.onDestroy();
    }
}
