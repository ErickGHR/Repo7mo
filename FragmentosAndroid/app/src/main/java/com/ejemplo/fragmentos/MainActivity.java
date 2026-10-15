package com.ejemplo.fragmentos;

import android.os.Bundle;
import android.widget.Button;

import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;

public class MainActivity extends FragmentActivity {

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Button btnInicio = findViewById(R.id.btnInicio);
        Button btnPerfil = findViewById(R.id.btnPerfil);
        Button btnAyuda = findViewById(R.id.btnAyuda);

        btnInicio.setOnClickListener(view -> mostrarFragmento(new InicioFragment()));
        btnPerfil.setOnClickListener(view -> mostrarFragmento(new PerfilFragment()));
        btnAyuda.setOnClickListener(view -> mostrarFragmento(new AyudaFragment()));

        if (savedInstanceState == null) {
            mostrarFragmento(new InicioFragment());
        }
    }

    private void mostrarFragmento(Fragment fragmento) {
        FragmentManager fragmentManager = getSupportFragmentManager();
        FragmentTransaction transaccion = fragmentManager.beginTransaction();
        transaccion.setReorderingAllowed(true);
        transaccion.replace(R.id.contenedorFragmentos, fragmento);
        transaccion.commit();
    }
}
