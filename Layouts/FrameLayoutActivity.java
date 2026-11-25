package com.example.layouts;

import android.os.Bundle;
import android.widget.Button;

import androidx.appcompat.app.AppCompatActivity;

public class FrameLayoutActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_frame_layout);

        Button botonMenu = findViewById(R.id.botonMenu);
        botonMenu.setOnClickListener(v -> finish());
    }
}
