package com.example.layouts;

import android.os.Bundle;
import android.content.Intent;
import android.widget.Button;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Button botonLinear = findViewById(R.id.botonLinear);
        Button botonRelative = findViewById(R.id.botonRelative);
        Button botonFrame = findViewById(R.id.botonFrame);
        Button botonTable = findViewById(R.id.botonTable);

        botonLinear.setOnClickListener(v ->
                startActivity(new Intent(this, LinearLayoutActivity.class)));
        botonRelative.setOnClickListener(v ->
                startActivity(new Intent(this, RelativeLayoutActivity.class)));
        botonFrame.setOnClickListener(v ->
                startActivity(new Intent(this, FrameLayoutActivity.class)));
        botonTable.setOnClickListener(v ->
                startActivity(new Intent(this, TableLayoutActivity.class)));
    }
}