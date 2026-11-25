package com.example.demointent;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        Button btnPrimera = findViewById(R.id.btnPrimera);
        Button btnSegunda = findViewById(R.id.btnSegunda);
        Button btnTercera = findViewById(R.id.btnTercera);

        btnPrimera.setOnClickListener(v -> {
            Intent intent = new Intent(this, PrimeraActivity.class);
            intent.putExtra("mensaje", "Mensaje enviado desde la actividad principal");
            startActivity(intent);
        });

        btnSegunda.setOnClickListener(v -> {
            Intent intent = new Intent(this, SegundaActivity.class);
            intent.putExtra("nombre", "Nombre enviado desde la actividad principal");
            startActivity(intent);
        });

        btnTercera.setOnClickListener(v -> {
            Intent intent = new Intent(this, TerceraActivity.class);
            intent.putExtra("numero", 12345);
            intent.putExtra("numero1", 23456);

            startActivity(intent);
        });

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
    }
}