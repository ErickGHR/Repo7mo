package com.pulso.sensorlab;

import android.graphics.Color;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public class ResearchActivity extends BaseActivity {
    @Override protected String pageTitle() { return "Investigación"; }
    @Override protected int pageNumber() { return 6; }

    @Override
    protected View createContent() {
        ScrollView scroll = new ScrollView(this);
        LinearLayout page = Ui.column(this);
        page.setPadding(Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 30));
        scroll.addView(page);

        LinearLayout intro = Ui.column(this);
        intro.setPadding(Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 20));
        intro.setBackground(Ui.rounded(Ui.PANEL, 24, Ui.LINE, 1, this));
        intro.addView(Ui.eyebrow(this, "Guía de campo  ·  Android", Ui.CYAN));
        TextView title = Ui.text(this, "Sensores que\ntraducen el mundo.", 26, Ui.TEXT, true);
        LinearLayout.LayoutParams titleParams = Ui.params(this, -1, -2);
        titleParams.topMargin = Ui.dp(this, 13);
        intro.addView(title, titleParams);
        TextView summary = Ui.text(this,
                "Android expone los sensores físicos mediante SensorManager y la ubicación mediante el proveedor del sistema.",
                14, Ui.MUTED, false);
        summary.setLineSpacing(Ui.dp(this, 4), 1f);
        LinearLayout.LayoutParams summaryParams = Ui.params(this, -1, -2);
        summaryParams.topMargin = Ui.dp(this, 11);
        intro.addView(summary, summaryParams);
        page.addView(intro);

        section(page, "01  ·  ACELERÓMETRO", "Mide aceleración sobre X, Y y Z en m/s². También detecta la gravedad, por eso un teléfono quieto suele indicar cerca de 9.81 m/s² en un eje. Útil para inclinación, pasos y gestos.", Ui.BLUE);
        section(page, "02  ·  GIROSCOPIO", "Mide velocidad angular en radianes por segundo. Al integrar esas lecturas se estima cuánto giró el dispositivo; el error puede acumularse con el tiempo.", Ui.PINK);
        section(page, "03  ·  GPS", "Los proveedores de ubicación combinan señales GNSS, Wi‑Fi y redes móviles. La precisión depende del entorno y del permiso otorgado. Esta demo sólo pide acceso en primer plano.", Ui.AMBER);
        section(page, "04  ·  MAGNETÓMETRO", "Mide el campo magnético en microteslas. Al combinarlo con la gravedad se estima el norte magnético. Interferencias metálicas pueden alterar la brújula.", Ui.CYAN);

        LinearLayout lifecycle = Ui.column(this);
        lifecycle.setPadding(Ui.dp(this, 18), Ui.dp(this, 17), Ui.dp(this, 18), Ui.dp(this, 17));
        lifecycle.setBackground(Ui.rounded(Ui.PANEL_LIGHT, 18, Ui.LINE, 1, this));
        lifecycle.addView(Ui.eyebrow(this, "Ciclo de vida responsable", Ui.PURPLE));
        TextView lifecycleText = Ui.text(this,
                "Las pantallas registran sensores mientras están visibles y los liberan al pausarse. La ubicación no se solicita en segundo plano.",
                13, Ui.MUTED, false);
        lifecycleText.setLineSpacing(Ui.dp(this, 4), 1f);
        LinearLayout.LayoutParams lifecycleTextParams = Ui.params(this, -1, -2);
        lifecycleTextParams.topMargin = Ui.dp(this, 9);
        lifecycle.addView(lifecycleText, lifecycleTextParams);
        LinearLayout.LayoutParams lifecycleParams = Ui.params(this, -1, -2);
        lifecycleParams.topMargin = Ui.dp(this, 15);
        page.addView(lifecycle, lifecycleParams);
        return scroll;
    }

    private void section(LinearLayout parent, String heading, String body, int accent) {
        LinearLayout card = Ui.column(this);
        card.setPadding(Ui.dp(this, 18), Ui.dp(this, 17), Ui.dp(this, 18), Ui.dp(this, 17));
        card.setBackground(Ui.rounded(Ui.PANEL, 19, Ui.LINE, 1, this));
        TextView header = Ui.eyebrow(this, heading, accent);
        header.setTextSize(10);
        card.addView(header);
        TextView description = Ui.text(this, body, 13, Ui.MUTED, false);
        description.setLineSpacing(Ui.dp(this, 4), 1f);
        LinearLayout.LayoutParams descriptionParams = Ui.params(this, -1, -2);
        descriptionParams.topMargin = Ui.dp(this, 10);
        card.addView(description, descriptionParams);
        LinearLayout.LayoutParams cardParams = Ui.params(this, -1, -2);
        cardParams.topMargin = Ui.dp(this, 12);
        parent.addView(card, cardParams);
    }
}
