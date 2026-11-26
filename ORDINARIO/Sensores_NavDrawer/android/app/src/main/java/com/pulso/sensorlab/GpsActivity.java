package com.pulso.sensorlab;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.Locale;

public class GpsActivity extends BaseActivity implements LocationListener {
    private static final int LOCATION_REQUEST = 41;
    private LocationManager locationManager;
    private TextView status;
    private TextView latitude;
    private TextView longitude;
    private TextView accuracy;
    private boolean requestingUpdates;

    @Override protected String pageTitle() { return "GPS"; }
    @Override protected int pageNumber() { return 4; }

    @Override
    protected View createContent() {
        ScrollView scroll = new ScrollView(this);
        LinearLayout page = Ui.column(this);
        page.setPadding(Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 30));
        scroll.addView(page);

        LinearLayout intro = Ui.column(this);
        intro.setPadding(Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 20), Ui.dp(this, 20));
        intro.setBackground(Ui.rounded(Ui.PANEL, 25, Ui.LINE, 1, this));
        intro.addView(Ui.eyebrow(this, "Ubicación  ·  Latitud / longitud", Ui.AMBER));
        TextView description = Ui.text(this,
                "Solicita ubicación sólo cuando tocas el botón. El permiso se usa en primer plano para mostrar tu posición actual.",
                14, Ui.MUTED, false);
        description.setLineSpacing(Ui.dp(this, 4), 1f);
        LinearLayout.LayoutParams descParams = Ui.params(this, -1, -2);
        descParams.topMargin = Ui.dp(this, 12);
        intro.addView(description, descParams);
        status = Ui.text(this, "●  LISTO PARA LOCALIZAR", 11, Ui.AMBER, true);
        status.setLetterSpacing(0.08f);
        status.setPadding(Ui.dp(this, 12), Ui.dp(this, 10), Ui.dp(this, 12), Ui.dp(this, 10));
        status.setBackground(Ui.rounded(0x22FFC46B, 20, 0x55FFC46B, 1, this));
        LinearLayout.LayoutParams statusParams = Ui.params(this, -2, -2);
        statusParams.topMargin = Ui.dp(this, 17);
        intro.addView(status, statusParams);
        page.addView(intro);

        LinearLayout coordinates = Ui.column(this);
        coordinates.setPadding(Ui.dp(this, 18), Ui.dp(this, 10), Ui.dp(this, 18), Ui.dp(this, 10));
        coordinates.setBackground(Ui.rounded(Ui.PANEL, 22, Ui.LINE, 1, this));
        latitude = addCoordinate(coordinates, "LATITUD", "—");
        addDivider(coordinates);
        longitude = addCoordinate(coordinates, "LONGITUD", "—");
        addDivider(coordinates);
        accuracy = addCoordinate(coordinates, "PRECISIÓN", "—");
        LinearLayout.LayoutParams coordinateParams = Ui.params(this, -1, -2);
        coordinateParams.topMargin = Ui.dp(this, 18);
        page.addView(coordinates, coordinateParams);

        TextView locate = Ui.text(this, "●   ACTUALIZAR UBICACIÓN", 14, Ui.BG, true);
        locate.setGravity(Gravity.CENTER);
        locate.setBackground(Ui.rounded(Ui.AMBER, 18, Ui.AMBER, 1, this));
        locate.setPadding(Ui.dp(this, 16), 0, Ui.dp(this, 16), 0);
        locate.setOnClickListener(v -> requestLocation());
        LinearLayout.LayoutParams buttonParams = Ui.params(this, -1, 58);
        buttonParams.topMargin = Ui.dp(this, 16);
        page.addView(locate, buttonParams);

        LinearLayout tip = Ui.column(this);
        tip.setPadding(Ui.dp(this, 17), Ui.dp(this, 16), Ui.dp(this, 17), Ui.dp(this, 16));
        tip.setBackground(Ui.rounded(Ui.PANEL_LIGHT, 18, Ui.LINE, 1, this));
        tip.addView(Ui.eyebrow(this, "Emulador Android", Ui.AMBER));
        TextView tipText = Ui.text(this,
                "Para simular una posición, abre Extended Controls → Location en el emulador y envía unas coordenadas.",
                12, Ui.MUTED, false);
        tipText.setLineSpacing(Ui.dp(this, 4), 1f);
        LinearLayout.LayoutParams tipTextParams = Ui.params(this, -1, -2);
        tipTextParams.topMargin = Ui.dp(this, 8);
        tip.addView(tipText, tipTextParams);
        LinearLayout.LayoutParams tipParams = Ui.params(this, -1, -2);
        tipParams.topMargin = Ui.dp(this, 16);
        page.addView(tip, tipParams);
        return scroll;
    }

    private TextView addCoordinate(LinearLayout parent, String label, String initialValue) {
        LinearLayout row = Ui.row(this);
        row.setPadding(Ui.dp(this, 4), Ui.dp(this, 14), Ui.dp(this, 4), Ui.dp(this, 14));
        TextView name = Ui.eyebrow(this, label, Ui.MUTED);
        row.addView(name, new LinearLayout.LayoutParams(0, -2, 1f));
        TextView value = Ui.text(this, initialValue, 16, Ui.TEXT, true);
        value.setGravity(Gravity.END);
        row.addView(value);
        parent.addView(row);
        return value;
    }

    private void addDivider(LinearLayout parent) {
        View divider = new View(this);
        divider.setBackgroundColor(Ui.LINE);
        parent.addView(divider, Ui.params(this, -1, 1));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
    }

    private void requestLocation() {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                && checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[] {
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
            }, LOCATION_REQUEST);
            return;
        }
        if (locationManager == null) {
            setStatus("SERVICIO DE UBICACIÓN NO DISPONIBLE", false);
            return;
        }

        try {
            boolean hasFine = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                    == PackageManager.PERMISSION_GRANTED;
            boolean hasCoarse = checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)
                    == PackageManager.PERMISSION_GRANTED;
            boolean enabled = false;
            for (String provider : locationManager.getProviders(true)) {
                boolean gps = LocationManager.GPS_PROVIDER.equals(provider);
                boolean network = LocationManager.NETWORK_PROVIDER.equals(provider);
                if ((gps && hasFine) || (network && (hasFine || hasCoarse))) enabled = true;
                if ((gps && hasFine) || (network && (hasFine || hasCoarse))) {
                    Location last = locationManager.getLastKnownLocation(provider);
                    if (last != null) updateLocation(last);
                }
            }
            if (!enabled) {
                setStatus("ACTIVA LA UBICACIÓN DEL DISPOSITIVO", false);
                Toast.makeText(this, "Activa Ubicación en los ajustes de Android.", Toast.LENGTH_LONG).show();
                return;
            }

            if (hasFine && locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000L, 0f, this);
                requestingUpdates = true;
            }
            if ((hasFine || hasCoarse)
                    && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 2000L, 0f, this);
                requestingUpdates = true;
            }
            setStatus(requestingUpdates ? "●  BUSCANDO POSICIÓN" : "ESPERANDO UNA LECTURA", true);
        } catch (SecurityException exception) {
            setStatus("FALTA EL PERMISO DE UBICACIÓN", false);
        } catch (IllegalArgumentException exception) {
            setStatus("NO HAY PROVEEDOR DE UBICACIÓN", false);
        }
    }

    private void setStatus(String message, boolean active) {
        if (status == null) return;
        status.setText(message);
        status.setTextColor(active ? Ui.CYAN : Ui.AMBER);
    }

    private void updateLocation(Location location) {
        if (latitude == null) return;
        latitude.setText(String.format(Locale.US, "%.6f°", location.getLatitude()));
        longitude.setText(String.format(Locale.US, "%.6f°", location.getLongitude()));
        accuracy.setText(location.hasAccuracy()
                ? String.format(Locale.getDefault(), "± %.1f m", location.getAccuracy())
                : "No disponible");
        setStatus("●  UBICACIÓN ACTUALIZADA", true);
    }

    @Override
    public void onLocationChanged(Location location) {
        updateLocation(location);
    }

    @Override
    public void onProviderEnabled(String provider) { }

    @Override
    public void onProviderDisabled(String provider) {
        if (LocationManager.GPS_PROVIDER.equals(provider)) setStatus("GPS DESACTIVADO", false);
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) { }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != LOCATION_REQUEST) return;
        boolean granted = false;
        for (int result : grantResults) if (result == PackageManager.PERMISSION_GRANTED) granted = true;
        if (granted) requestLocation();
        else setStatus("PERMISO DENEGADO · TOCA PARA REINTENTAR", false);
    }

    @Override
    protected void onPause() {
        if (requestingUpdates && locationManager != null) {
            locationManager.removeUpdates(this);
            requestingUpdates = false;
        }
        super.onPause();
    }
}
