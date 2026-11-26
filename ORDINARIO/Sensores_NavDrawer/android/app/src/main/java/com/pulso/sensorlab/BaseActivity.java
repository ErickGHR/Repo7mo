package com.pulso.sensorlab;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

abstract class BaseActivity extends Activity {
    private FrameLayout root;
    private View scrim;
    private View drawer;
    private boolean drawerOpen;

    protected abstract String pageTitle();
    protected abstract int pageNumber();
    protected abstract View createContent();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getActionBar() != null) getActionBar().hide();
        Window window = getWindow();
        window.setStatusBarColor(Ui.BG);
        window.setNavigationBarColor(Ui.BG);
        window.getDecorView().setSystemUiVisibility(0);

        root = new FrameLayout(this);
        root.setBackgroundColor(Ui.BG);

        LinearLayout shell = Ui.column(this);
        shell.setBackgroundColor(Ui.BG);
        shell.addView(createHeader());
        shell.addView(createPageBar());

        FrameLayout body = new FrameLayout(this);
        body.addView(createContent(), new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        shell.addView(body, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(shell, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        createDrawer();
        setContentView(root);
    }

    private View createHeader() {
        LinearLayout bar = Ui.row(this);
        bar.setPadding(Ui.dp(this, 16), Ui.dp(this, 12), Ui.dp(this, 16), Ui.dp(this, 12));

        TextView menu = Ui.text(this, "☰", 27, Ui.TEXT, false);
        menu.setGravity(Gravity.CENTER);
        menu.setContentDescription("Abrir menú de navegación");
        menu.setBackground(Ui.rounded(Ui.PANEL, 15, Ui.LINE, 1, this));
        menu.setOnClickListener(v -> openDrawer());
        bar.addView(menu, Ui.params(this, 48, 48));

        TextView mark = Ui.text(this, "⌁", 34, Ui.BG, true);
        mark.setGravity(Gravity.CENTER);
        mark.setBackground(Ui.rounded(Ui.CYAN, 16, Ui.CYAN, 1, this));
        LinearLayout.LayoutParams markParams = Ui.params(this, 52, 52);
        markParams.leftMargin = Ui.dp(this, 12);
        bar.addView(mark, markParams);

        LinearLayout brand = Ui.column(this);
        brand.setGravity(Gravity.CENTER_VERTICAL);
        TextView name = Ui.text(this, "P U L S O", 18, Ui.TEXT, true);
        TextView subtitle = Ui.eyebrow(this, "Laboratorio móvil", Ui.MUTED);
        subtitle.setTextSize(9);
        brand.addView(name);
        LinearLayout.LayoutParams subtitleParams = Ui.params(this, -2, -2);
        subtitleParams.topMargin = Ui.dp(this, 4);
        brand.addView(subtitle, subtitleParams);
        LinearLayout.LayoutParams brandParams = new LinearLayout.LayoutParams(0,
                LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        brandParams.leftMargin = Ui.dp(this, 12);
        bar.addView(brand, brandParams);

        LinearLayout badge = Ui.row(this);
        badge.setGravity(Gravity.CENTER);
        badge.setPadding(Ui.dp(this, 12), Ui.dp(this, 9), Ui.dp(this, 12), Ui.dp(this, 9));
        badge.setBackground(Ui.rounded(Color.rgb(16, 49, 48), 24, Color.rgb(35, 83, 78), 1, this));
        View dot = new View(this);
        dot.setBackground(Ui.rounded(Ui.CYAN, 20, Ui.CYAN, 0, this));
        badge.addView(dot, Ui.params(this, 8, 8));
        TextView ready = Ui.eyebrow(this, "Listo", Ui.CYAN);
        ready.setTextSize(10);
        LinearLayout.LayoutParams readyParams = Ui.params(this, -2, -2);
        readyParams.leftMargin = Ui.dp(this, 7);
        badge.addView(ready, readyParams);
        bar.addView(badge);
        return bar;
    }

    private View createPageBar() {
        LinearLayout bar = Ui.row(this);
        bar.setPadding(Ui.dp(this, 22), Ui.dp(this, 14), Ui.dp(this, 22), Ui.dp(this, 14));
        View dividerTop = new View(this);
        dividerTop.setBackgroundColor(Ui.LINE);

        FrameLayout wrapper = new FrameLayout(this);
        wrapper.addView(bar, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER_VERTICAL));

        TextView icon = Ui.text(this, pageIcon(), 23, pageAccent(), true);
        bar.addView(icon, Ui.params(this, 32, -2));
        TextView title = Ui.text(this, pageTitle(), 19, Ui.TEXT, true);
        bar.addView(title, new LinearLayout.LayoutParams(0, -2, 1f));
        TextView number = Ui.eyebrow(this, String.format("%02d", pageNumber()), Ui.MUTED);
        bar.addView(number);
        wrapper.setBackgroundColor(Ui.BG);
        wrapper.setPadding(0, 0, 0, 0);
        return wrapper;
    }

    private String pageIcon() {
        switch (pageNumber()) {
            case 2: return "↗";
            case 3: return "⟳";
            case 4: return "◎";
            case 5: return "✳";
            case 6: return "▤";
            default: return "⌂";
        }
    }

    private int pageAccent() {
        switch (pageNumber()) {
            case 2: return Ui.BLUE;
            case 3: return Ui.PINK;
            case 4: return Ui.AMBER;
            case 5: return Ui.CYAN;
            case 6: return Ui.BLUE;
            default: return Ui.CYAN;
        }
    }

    private void createDrawer() {
        scrim = new View(this);
        scrim.setBackgroundColor(0xB8000000);
        scrim.setAlpha(0f);
        scrim.setVisibility(View.GONE);
        scrim.setOnClickListener(v -> closeDrawer());
        root.addView(scrim, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        LinearLayout panel = Ui.column(this);
        panel.setPadding(Ui.dp(this, 18), Ui.dp(this, 30), Ui.dp(this, 14), Ui.dp(this, 18));
        panel.setBackground(Ui.rounded(Ui.PANEL, 0, Ui.LINE, 1, this));
        panel.setElevation(Ui.dp(this, 18));
        int width = Math.min(Ui.dp(this, 330),
                Math.round(getResources().getDisplayMetrics().widthPixels * 0.86f));

        TextView brand = Ui.text(this, "⌁  P U L S O", 23, Ui.CYAN, true);
        panel.addView(brand);
        TextView tagline = Ui.text(this, "Explora lo invisible.", 13, Ui.MUTED, false);
        LinearLayout.LayoutParams taglineParams = Ui.params(this, -2, -2);
        taglineParams.topMargin = Ui.dp(this, 7);
        panel.addView(tagline, taglineParams);

        View rule = new View(this);
        rule.setBackgroundColor(Ui.LINE);
        LinearLayout.LayoutParams ruleParams = Ui.params(this, -1, 1);
        ruleParams.topMargin = Ui.dp(this, 24);
        ruleParams.bottomMargin = Ui.dp(this, 20);
        panel.addView(rule, ruleParams);

        TextView section = Ui.eyebrow(this, "Exploración", Ui.MUTED);
        LinearLayout.LayoutParams sectionParams = Ui.params(this, -2, -2);
        sectionParams.bottomMargin = Ui.dp(this, 12);
        panel.addView(section, sectionParams);

        addDrawerItem(panel, "⌂", "Inicio", "Panel de sensores", MainActivity.class, Ui.CYAN, 1);
        addDrawerItem(panel, "↗", "Acelerómetro", "Movimiento y gravedad", AccelerometerActivity.class, Ui.BLUE, 2);
        addDrawerItem(panel, "⟳", "Giroscopio", "Rotación en 3 ejes", GyroscopeActivity.class, Ui.PINK, 3);
        addDrawerItem(panel, "◎", "GPS", "Ubicación del dispositivo", GpsActivity.class, Ui.AMBER, 4);
        addDrawerItem(panel, "✳", "Magnetómetro", "Campo magnético y brújula", MagnetometerActivity.class, Ui.CYAN, 5);
        addDrawerItem(panel, "▤", "Investigación", "Conceptos y funcionamiento", ResearchActivity.class, Ui.BLUE, 6);

        LinearLayout.LayoutParams footerSpace = new LinearLayout.LayoutParams(-1, 0, 1f);
        panel.addView(new View(this), footerSpace);
        TextView footer = Ui.eyebrow(this, "Android Sensor Lab  ·  v1.0", Ui.MUTED);
        footer.setTextSize(9);
        panel.addView(footer);

        drawer = panel;
        FrameLayout.LayoutParams drawerParams = new FrameLayout.LayoutParams(width,
                FrameLayout.LayoutParams.MATCH_PARENT, Gravity.START);
        root.addView(drawer, drawerParams);
        drawer.setTranslationX(-width);
    }

    private void addDrawerItem(LinearLayout parent, String glyph, String title,
                               String subtitle, Class<?> destination, int accent, int number) {
        LinearLayout item = Ui.row(this);
        item.setPadding(Ui.dp(this, 11), Ui.dp(this, 10), Ui.dp(this, 8), Ui.dp(this, 10));
        item.setBackground(Ui.rounded(destination == getClass()
                ? Ui.PANEL_LIGHT : Color.TRANSPARENT, 15,
                destination == getClass() ? Ui.LINE : Color.TRANSPARENT, 1, this));
        TextView icon = Ui.text(this, glyph, 23, accent, true);
        icon.setGravity(Gravity.CENTER);
        item.addView(icon, Ui.params(this, 34, 44));
        LinearLayout labels = Ui.column(this);
        labels.setGravity(Gravity.CENTER_VERTICAL);
        TextView label = Ui.text(this, title, 14, Ui.TEXT, true);
        TextView detail = Ui.text(this, subtitle, 10, Ui.MUTED, false);
        labels.addView(label);
        LinearLayout.LayoutParams detailParams = Ui.params(this, -2, -2);
        detailParams.topMargin = Ui.dp(this, 4);
        labels.addView(detail, detailParams);
        LinearLayout.LayoutParams labelParams = new LinearLayout.LayoutParams(0, -2, 1f);
        labelParams.leftMargin = Ui.dp(this, 8);
        item.addView(labels, labelParams);
        TextView index = Ui.eyebrow(this, String.format("%02d", number), Ui.MUTED);
        index.setTextSize(9);
        item.addView(index);

        LinearLayout.LayoutParams itemParams = Ui.params(this, -1, 64);
        itemParams.bottomMargin = Ui.dp(this, 5);
        parent.addView(item, itemParams);
        item.setOnClickListener(v -> navigate(destination));
    }

    private void navigate(Class<?> destination) {
        closeDrawer();
        if (destination == getClass()) return;
        Intent intent = new Intent(this, destination);
        intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        startActivity(intent);
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }

    private void openDrawer() {
        if (drawerOpen) return;
        drawerOpen = true;
        scrim.setVisibility(View.VISIBLE);
        scrim.animate().alpha(1f).setDuration(180).start();
        drawer.animate().translationX(0f).setDuration(220).start();
    }

    private void closeDrawer() {
        if (!drawerOpen) return;
        drawerOpen = false;
        int width = drawer.getLayoutParams().width;
        scrim.animate().alpha(0f).setDuration(160).withEndAction(() -> scrim.setVisibility(View.GONE)).start();
        drawer.animate().translationX(-width).setDuration(180).start();
    }

    @Override
    public void onBackPressed() {
        if (drawerOpen) closeDrawer();
        else super.onBackPressed();
    }
}
