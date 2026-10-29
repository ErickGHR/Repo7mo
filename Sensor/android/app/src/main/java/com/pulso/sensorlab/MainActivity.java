package com.pulso.sensorlab;

import android.content.Intent;
import android.graphics.Color;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public class MainActivity extends BaseActivity {
    @Override protected String pageTitle() { return "Inicio"; }
    @Override protected int pageNumber() { return 1; }

    @Override
    protected View createContent() {
        ScrollView scroll = new ScrollView(this);
        LinearLayout page = Ui.column(this);
        page.setPadding(Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 28));
        scroll.addView(page);

        LinearLayout hero = Ui.column(this);
        hero.setPadding(Ui.dp(this, 22), Ui.dp(this, 24), Ui.dp(this, 22), Ui.dp(this, 22));
        hero.setBackground(Ui.rounded(Ui.PANEL, 28, Ui.LINE, 1, this));

        FrameLayout emblem = new FrameLayout(this);
        emblem.setBackground(Ui.rounded(Ui.PANEL_LIGHT, 100, Ui.LINE, 1, this));
        TextView glyph = Ui.text(this, "⌁", 52, Ui.CYAN, true);
        glyph.setGravity(Gravity.CENTER);
        emblem.addView(glyph, new FrameLayout.LayoutParams(-1, -1));
        LinearLayout.LayoutParams emblemParams = Ui.params(this, 112, 112);
        emblemParams.gravity = Gravity.CENTER_HORIZONTAL;
        emblemParams.bottomMargin = Ui.dp(this, 24);
        hero.addView(emblem, emblemParams);

        hero.addView(Ui.eyebrow(this, "Centro de instrumentos  ·  04", Ui.CYAN));
        TextView headline = Ui.text(this, "Tu teléfono\nlo siente todo.", 32, Ui.TEXT, true);
        LinearLayout.LayoutParams headlineParams = Ui.params(this, -1, -2);
        headlineParams.topMargin = Ui.dp(this, 14);
        hero.addView(headline, headlineParams);
        TextView body = Ui.text(this,
                "Explora el movimiento, la orientación y tu posición en tiempo real.",
                16, Ui.MUTED, false);
        body.setLineSpacing(Ui.dp(this, 4), 1f);
        LinearLayout.LayoutParams bodyParams = Ui.params(this, -1, -2);
        bodyParams.topMargin = Ui.dp(this, 12);
        hero.addView(body, bodyParams);
        View divider = new View(this);
        divider.setBackgroundColor(Ui.LINE);
        LinearLayout.LayoutParams dividerParams = Ui.params(this, -1, 1);
        dividerParams.topMargin = Ui.dp(this, 24);
        dividerParams.bottomMargin = Ui.dp(this, 18);
        hero.addView(divider, dividerParams);
        LinearLayout ready = Ui.row(this);
        View dot = new View(this);
        dot.setBackground(Ui.rounded(Ui.CYAN, 20, Ui.CYAN, 0, this));
        ready.addView(dot, Ui.params(this, 8, 8));
        TextView readyText = Ui.eyebrow(this, "Sensores listos para explorar", Ui.CYAN);
        readyText.setTextSize(10);
        LinearLayout.LayoutParams readyTextParams = Ui.params(this, -2, -2);
        readyTextParams.leftMargin = Ui.dp(this, 9);
        ready.addView(readyText, readyTextParams);
        hero.addView(ready);
        page.addView(hero);

        LinearLayout.LayoutParams labelParams = Ui.params(this, -1, -2);
        labelParams.topMargin = Ui.dp(this, 30);
        page.addView(Ui.eyebrow(this, "Elige un instrumento", Ui.MUTED), labelParams);

        LinearLayout cards = Ui.column(this);
        LinearLayout.LayoutParams cardsParams = Ui.params(this, -1, -2);
        cardsParams.topMargin = Ui.dp(this, 14);
        page.addView(cards, cardsParams);
        cards.addView(instrumentCard("↗", "Acelerómetro", "Movimiento y gravedad",
                Ui.BLUE, AccelerometerActivity.class));
        cards.addView(instrumentCard("⟳", "Giroscopio", "Rotación en 3 ejes",
                Ui.PINK, GyroscopeActivity.class));
        cards.addView(instrumentCard("◎", "GPS", "Ubicación del dispositivo",
                Ui.AMBER, GpsActivity.class));
        cards.addView(instrumentCard("✳", "Magnetómetro", "Campo magnético y brújula",
                Ui.CYAN, MagnetometerActivity.class));

        LinearLayout research = Ui.row(this);
        research.setPadding(Ui.dp(this, 18), Ui.dp(this, 16), Ui.dp(this, 18), Ui.dp(this, 16));
        research.setBackground(Ui.rounded(Ui.PANEL_LIGHT, 18, Ui.LINE, 1, this));
        TextView icon = Ui.text(this, "▤", 22, Ui.BLUE, true);
        research.addView(icon, Ui.params(this, 34, -2));
        TextView researchText = Ui.text(this, "¿Cómo funcionan estos sensores?", 13, Ui.TEXT, true);
        research.addView(researchText, new LinearLayout.LayoutParams(0, -2, 1f));
        research.addView(Ui.text(this, "→", 20, Ui.CYAN, true));
        LinearLayout.LayoutParams researchParams = Ui.params(this, -1, -2);
        researchParams.topMargin = Ui.dp(this, 12);
        page.addView(research, researchParams);
        research.setOnClickListener(v -> launch(ResearchActivity.class));

        TextView note = Ui.text(this,
                "Mueve el teléfono para observar los cambios. Los datos se procesan localmente.",
                11, Ui.MUTED, false);
        note.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams noteParams = Ui.params(this, -1, -2);
        noteParams.topMargin = Ui.dp(this, 18);
        page.addView(note, noteParams);
        return scroll;
    }

    private View instrumentCard(String glyph, String title, String subtitle,
                                int accent, Class<?> destination) {
        LinearLayout card = Ui.row(this);
        card.setPadding(Ui.dp(this, 14), Ui.dp(this, 14), Ui.dp(this, 14), Ui.dp(this, 14));
        card.setBackground(Ui.rounded(Ui.PANEL, 22, Ui.LINE, 1, this));
        TextView icon = Ui.text(this, glyph, 24, accent, true);
        icon.setGravity(Gravity.CENTER);
        icon.setBackground(Ui.rounded(Color.argb(28, Color.red(accent),
                Color.green(accent), Color.blue(accent)), 17, Color.TRANSPARENT, 0, this));
        card.addView(icon, Ui.params(this, 60, 60));

        LinearLayout labels = Ui.column(this);
        labels.setGravity(Gravity.CENTER_VERTICAL);
        TextView name = Ui.text(this, title, 16, Ui.TEXT, true);
        TextView detail = Ui.text(this, subtitle, 12, Ui.MUTED, false);
        labels.addView(name);
        LinearLayout.LayoutParams detailParams = Ui.params(this, -2, -2);
        detailParams.topMargin = Ui.dp(this, 5);
        labels.addView(detail, detailParams);
        LinearLayout.LayoutParams labelsParams = new LinearLayout.LayoutParams(0, -2, 1f);
        labelsParams.leftMargin = Ui.dp(this, 14);
        card.addView(labels, labelsParams);

        TextView arrow = Ui.text(this, "↗", 18, Ui.MUTED, true);
        arrow.setGravity(Gravity.CENTER);
        arrow.setBackground(Ui.rounded(Ui.PANEL_LIGHT, 14, Color.TRANSPARENT, 0, this));
        card.addView(arrow, Ui.params(this, 42, 42));
        LinearLayout.LayoutParams cardParams = Ui.params(this, -1, -2);
        cardParams.bottomMargin = Ui.dp(this, 10);
        card.setLayoutParams(cardParams);
        card.setOnClickListener(v -> launch(destination));
        return card;
    }

    private void launch(Class<?> destination) {
        Intent intent = new Intent(this, destination);
        intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        startActivity(intent);
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
}
