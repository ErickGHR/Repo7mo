package com.ejemplo.verthorizon;

import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "CicloVidaActivity";
    private static final String CLAVE_DATO = "dato_capturado";
    private static final String CLAVE_RESULTADO = "resultado_mostrado";

    private EditText etDato;
    private TextView tvResultado;
    private TextView tvEstado;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registrar("onCreate");
        setContentView(R.layout.activity_main);

        etDato = findViewById(R.id.etDato);
        tvResultado = findViewById(R.id.tvResultado);
        tvEstado = findViewById(R.id.tvEstado);
        Button btnMostrar = findViewById(R.id.btnMostrar);

        btnMostrar.setOnClickListener(view -> mostrarDatoCapturado());

        if (savedInstanceState != null) {
            etDato.setText(savedInstanceState.getString(CLAVE_DATO, ""));
            tvResultado.setText(savedInstanceState.getString(
                    CLAVE_RESULTADO,
                    getString(R.string.resultado_vacio)
            ));
            Log.d(TAG, "Estado restaurado desde savedInstanceState");
        }

        mostrarEstado("onCreate: Activity creada");
    }

    private void mostrarDatoCapturado() {
        String dato = etDato.getText().toString().trim();
        if (dato.isEmpty()) {
            tvResultado.setText(R.string.instruccion_escribir);
        } else {
            tvResultado.setText(getString(R.string.dato_capturado, dato));
        }
    }

    private void mostrarEstado(String mensaje) {
        if (tvEstado != null) {
            tvEstado.setText(mensaje);
        }
    }

    private void registrar(String evento) {
        Log.d(TAG, evento + " ejecutado");
    }

    @Override
    protected void onStart() {
        super.onStart();
        registrar("onStart");
        mostrarEstado("onStart: Activity visible");
    }

    @Override
    protected void onResume() {
        super.onResume();
        registrar("onResume");
        mostrarEstado("onResume: Activity en primer plano");
    }

    @Override
    protected void onPause() {
        registrar("onPause");
        mostrarEstado("onPause: Activity pierde el primer plano");
        super.onPause();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        outState.putString(CLAVE_DATO, etDato.getText().toString());
        outState.putString(CLAVE_RESULTADO, tvResultado.getText().toString());
        registrar("onSaveInstanceState: texto guardado");
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onStop() {
        registrar("onStop");
        mostrarEstado("onStop: Activity ya no está visible");
        super.onStop();
    }

    @Override
    protected void onRestart() {
        super.onRestart();
        registrar("onRestart");
        mostrarEstado("onRestart: Activity vuelve después de estar detenida");
    }

    @Override
    protected void onDestroy() {
        registrar("onDestroy");
        super.onDestroy();
    }
}
