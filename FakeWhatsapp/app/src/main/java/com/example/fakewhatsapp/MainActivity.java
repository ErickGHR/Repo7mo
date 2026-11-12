package com.example.fakewhatsapp;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.content.SharedPreferences;
import android.content.Intent;
import android.net.Uri;
import android.widget.EditText;
import android.widget.CheckBox;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Date;
import java.util.Locale;

/** Una demostración local de mensajería hecha únicamente con Java. */
public class MainActivity extends Activity {
    private static final String PREFS_NAME = "fake_whatsapp";
    private static final String PREF_CHATS = "chats";
    private static final String PREF_PROFILE_PHOTOS = "profile_photos";
    private static final int REQUEST_PROFILE_PHOTO = 41;
    private static final int REQUEST_MESSAGE_IMAGE = 42;
    private static final int GREEN = Color.rgb(7, 94, 84);
    private static final int GREEN_LIGHT = Color.rgb(18, 140, 126);
    private static final int READ_BLUE = Color.rgb(52, 183, 241);
    private static final int TEXT_DARK = Color.rgb(45, 52, 54);
    private static final int TEXT_MUTED = Color.rgb(117, 125, 128);
    private static final String[] CONTACTS = {
            "Ana López", "Carlos Ruiz", "María García", "Luis Torres", "Sofía Pérez"
    };
    private static final int[] AVATAR_COLORS = {
            0xff7198a5, 0xffbb8064, 0xff8c9d70, 0xff9276a8, 0xffc18c55
    };

    private final ArrayList<Chat> chats = new ArrayList<>();
    private final ArrayList<View> messageRows = new ArrayList<>();
    private final HashMap<String, String> profilePhotoUris = new HashMap<>();
    private int selectedTab = 0;
    private Chat currentChat;
    private LinearLayout messageList;
    private ScrollView messageScroll;
    private String pendingPhotoOwner;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window window = getWindow();
        window.setStatusBarColor(0xff064e46);
        window.setNavigationBarColor(0xff063f39);
        FakeWhatsappMessagingService.createNotificationChannel(this);
        loadChats();
        loadProfilePhotos();
        SupabaseApi.registerPendingPushToken(this);
        if (!openNotificationConversation(getIntent())) {
            showHome();
        }
    }

    private void showHome() {
        currentChat = null;
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setBackgroundColor(Color.WHITE);
        page.addView(createHomeBar(), new LinearLayout.LayoutParams(-1, dp(56)));
        page.addView(createTabs(), new LinearLayout.LayoutParams(-1, dp(46)));

        if (selectedTab == 0) {
            page.addView(createChatList(), new LinearLayout.LayoutParams(-1, 0, 1));
        } else if (selectedTab == 1) {
            page.addView(createStatusList(), new LinearLayout.LayoutParams(-1, 0, 1));
        } else {
            page.addView(createCallsList(), new LinearLayout.LayoutParams(-1, 0, 1));
        }
        setContentView(page);
    }

    private View createHomeBar() {
        LinearLayout bar = new LinearLayout(this);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(18), 0, dp(12), 0);
        bar.setBackgroundColor(GREEN);

        TextView title = label("WhatsApp", 21, Color.WHITE, true);
        bar.addView(title, new LinearLayout.LayoutParams(0, -1, 1));

        TextView menuButton = label("⋮", 28, Color.WHITE, false);
        menuButton.setGravity(Gravity.CENTER);
        menuButton.setContentDescription("Más opciones");
        menuButton.setPadding(dp(12), 0, dp(8), 0);
        menuButton.setOnClickListener(v -> showMenu(menuButton));
        bar.addView(menuButton, new LinearLayout.LayoutParams(dp(44), -1));
        return bar;
    }

    private void showMenu(View anchor) {
        PopupMenu menu = new PopupMenu(this, anchor);
        menu.getMenu().add("Nueva conversación").setOnMenuItemClickListener(item -> {
            showContactPicker();
            return true;
        });
        menu.getMenu().add("Nuevo grupo").setOnMenuItemClickListener(item -> {
            showGroupCreator();
            return true;
        });
        menu.getMenu().add("Buscar mensajes").setOnMenuItemClickListener(item -> {
            showMessageSearch(null);
            return true;
        });
        menu.getMenu().add("Foto de perfil").setOnMenuItemClickListener(item -> {
            chooseProfilePhoto("Mi perfil");
            return true;
        });
        menu.getMenu().add(SupabaseApi.hasSession(this) ? "Cerrar sesión de API" : "Cuenta / API Supabase")
                .setOnMenuItemClickListener(item -> {
                    if (SupabaseApi.hasSession(this)) {
                        SupabaseApi.signOut(this);
                        Toast.makeText(this, "Sesión de Supabase cerrada", Toast.LENGTH_SHORT).show();
                    } else {
                        showApiAccountDialog();
                    }
                    return true;
                });
        menu.getMenu().add("Acerca de").setOnMenuItemClickListener(item -> {
            new AlertDialog.Builder(this)
                    .setTitle("FakeWhatsapp")
                    .setMessage("Demo de mensajería hecha en Java. Los chats, grupos y fotos de ejemplo se guardan en este dispositivo; la cuenta Supabase registra el token de notificaciones.")
                    .setPositiveButton("Cerrar", null)
                    .show();
            return true;
        });
        menu.show();
    }

    private void showApiAccountDialog() {
        if (!SupabaseApi.isConfigured()) {
            new AlertDialog.Builder(this)
                    .setTitle("Configurar Supabase")
                    .setMessage("Agrega supabase.url y supabase.anonKey al archivo local.properties de FakeWhatsapp, vuelve a sincronizar Gradle e inicia sesión para registrar este dispositivo en la API.")
                    .setPositiveButton("Entendido", null)
                    .show();
            return;
        }

        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        form.setPadding(dp(22), dp(8), dp(22), 0);
        EditText email = new EditText(this);
        email.setSingleLine(true);
        email.setHint("Correo electrónico");
        email.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);
        form.addView(email, new LinearLayout.LayoutParams(-1, -2));
        EditText password = new EditText(this);
        password.setSingleLine(true);
        password.setHint("Contraseña");
        password.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        form.addView(password, new LinearLayout.LayoutParams(-1, -2));

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Conectar cuenta Supabase")
                .setView(form)
                .setPositiveButton("Iniciar sesión", null)
                .setNeutralButton("Crear cuenta", null)
                .setNegativeButton("Cancelar", null)
                .create();
        dialog.setOnShowListener(ignored -> {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v ->
                    authenticateApi(email, password, false, dialog));
            dialog.getButton(AlertDialog.BUTTON_NEUTRAL).setOnClickListener(v ->
                    authenticateApi(email, password, true, dialog));
        });
        dialog.show();
    }

    private void authenticateApi(EditText email, EditText password, boolean createAccount, AlertDialog dialog) {
        String emailValue = email.getText().toString().trim();
        String passwordValue = password.getText().toString();
        if (emailValue.isEmpty() || passwordValue.length() < 6) {
            Toast.makeText(this, "Escribe un correo y una contraseña de al menos 6 caracteres", Toast.LENGTH_LONG).show();
            return;
        }
        Toast.makeText(this, createAccount ? "Creando cuenta…" : "Iniciando sesión…", Toast.LENGTH_SHORT).show();
        SupabaseApi.Callback callback = (success, message) -> {
            Toast.makeText(this, message, Toast.LENGTH_LONG).show();
            if (success) dialog.dismiss();
        };
        if (createAccount) {
            SupabaseApi.signUp(this, emailValue, passwordValue, callback);
        } else {
            SupabaseApi.signIn(this, emailValue, passwordValue, callback);
        }
    }

    private void chooseProfilePhoto(String owner) {
        pendingPhotoOwner = owner;
        Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        picker.addCategory(Intent.CATEGORY_OPENABLE);
        picker.setType("image/*");
        picker.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(picker, REQUEST_PROFILE_PHOTO);
    }

    private void chooseMessageImage() {
        Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        picker.addCategory(Intent.CATEGORY_OPENABLE);
        picker.setType("image/*");
        picker.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(picker, REQUEST_MESSAGE_IMAGE);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        try {
            getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (SecurityException ignored) {
            // Some gallery apps return a temporary grant only; the current session can still display it.
        }

        if (requestCode == REQUEST_PROFILE_PHOTO) {
            profilePhotoUris.put(pendingPhotoOwner == null ? "Mi perfil" : pendingPhotoOwner, uri.toString());
            saveProfilePhotos();
            if (currentChat == null) showHome(); else showConversation();
        } else if (requestCode == REQUEST_MESSAGE_IMAGE && currentChat != null) {
            Message message = new Message("", true, now(), true, uri.toString());
            currentChat.messages.add(message);
            currentChat.lastMessage = "📷 Imagen";
            currentChat.time = message.time;
            saveChats();
            addMessageBubble(message);
            messageScroll.post(() -> messageScroll.fullScroll(View.FOCUS_DOWN));
        }
    }

    private void showGroupCreator() {
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(22), dp(4), dp(22), 0);

        EditText groupName = new EditText(this);
        groupName.setSingleLine(true);
        groupName.setHint("Nombre del grupo");
        content.addView(groupName, new LinearLayout.LayoutParams(-1, -2));

        TextView instruction = label("Selecciona al menos dos participantes", 13, TEXT_MUTED, false);
        instruction.setPadding(0, dp(8), 0, dp(4));
        content.addView(instruction);

        ScrollView scroll = new ScrollView(this);
        LinearLayout choices = new LinearLayout(this);
        choices.setOrientation(LinearLayout.VERTICAL);
        ArrayList<CheckBox> checks = new ArrayList<>();
        for (String contact : CONTACTS) {
            CheckBox check = new CheckBox(this);
            check.setText(contact);
            checks.add(check);
            choices.addView(check, new LinearLayout.LayoutParams(-1, -2));
        }
        scroll.addView(choices);
        content.addView(scroll, new LinearLayout.LayoutParams(-1, dp(220)));

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Crear grupo")
                .setView(content)
                .setPositiveButton("Crear", null)
                .setNegativeButton("Cancelar", null)
                .create();
        dialog.setOnShowListener(ignored -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String name = groupName.getText().toString().trim();
            ArrayList<String> members = new ArrayList<>();
            for (int i = 0; i < checks.size(); i++) {
                if (checks.get(i).isChecked()) members.add(CONTACTS[i]);
            }
            if (name.isEmpty() || members.size() < 2) {
                Toast.makeText(this, "Escribe un nombre y selecciona al menos dos participantes", Toast.LENGTH_LONG).show();
                return;
            }
            Chat group = new Chat(name, AVATAR_COLORS[chats.size() % AVATAR_COLORS.length], true);
            group.members.addAll(members);
            chats.add(0, group);
            saveChats();
            dialog.dismiss();
            selectedTab = 0;
            openChat(group);
        }));
        dialog.show();
    }

    private void showMessageSearch(Chat onlyChat) {
        EditText queryInput = new EditText(this);
        queryInput.setSingleLine(true);
        queryInput.setHint("Texto que quieres encontrar");
        queryInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        new AlertDialog.Builder(this)
                .setTitle(onlyChat == null ? "Buscar mensajes" : "Buscar en " + onlyChat.name)
                .setView(queryInput)
                .setPositiveButton("Buscar", (dialog, which) -> showSearchResults(queryInput.getText().toString().trim(), onlyChat))
                .setNegativeButton("Cancelar", null)
                .show();
    }

    private void showSearchResults(String query, Chat onlyChat) {
        if (query.isEmpty()) {
            Toast.makeText(this, "Escribe algo para buscar", Toast.LENGTH_SHORT).show();
            return;
        }
        ArrayList<Chat> resultChats = new ArrayList<>();
        ArrayList<Integer> resultIndexes = new ArrayList<>();
        ArrayList<String> resultLabels = new ArrayList<>();
        for (Chat chat : chats) {
            if (onlyChat != null && chat != onlyChat) continue;
            for (int i = 0; i < chat.messages.size(); i++) {
                Message message = chat.messages.get(i);
                if (!message.deleted && message.body.toLowerCase(Locale.getDefault()).contains(query.toLowerCase(Locale.getDefault()))) {
                    resultChats.add(chat);
                    resultIndexes.add(i);
                    String preview = message.body.isEmpty() ? "📷 Imagen" : message.body;
                    resultLabels.add(chat.name + " · " + message.time + "\n" + preview);
                }
            }
        }
        if (resultLabels.isEmpty()) {
            Toast.makeText(this, "No encontré mensajes con ese texto", Toast.LENGTH_SHORT).show();
            return;
        }
        new AlertDialog.Builder(this)
                .setTitle("Resultados: " + resultLabels.size())
                .setItems(resultLabels.toArray(new String[0]), (dialog, which) -> {
                    Chat chat = resultChats.get(which);
                    int messageIndex = resultIndexes.get(which);
                    openChat(chat);
                    messageScroll.post(() -> {
                        if (messageIndex < messageRows.size()) {
                            messageScroll.smoothScrollTo(0, messageRows.get(messageIndex).getTop());
                        }
                    });
                })
                .setNegativeButton("Cerrar", null)
                .show();
    }

    private boolean openNotificationConversation(Intent intent) {
        if (intent == null) return false;
        String name = intent.getStringExtra(FakeWhatsappMessagingService.EXTRA_CONVERSATION_TITLE);
        if (name == null || name.trim().isEmpty()) return false;
        Chat chat = findChat(name);
        if (chat == null) {
            chat = new Chat(name, AVATAR_COLORS[Math.abs(name.hashCode()) % AVATAR_COLORS.length]);
            chats.add(0, chat);
            saveChats();
        }
        selectedTab = 0;
        openChat(chat);
        intent.removeExtra(FakeWhatsappMessagingService.EXTRA_CONVERSATION_TITLE);
        return true;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (!openNotificationConversation(intent)) showHome();
    }

    private View createTabs() {
        LinearLayout tabs = new LinearLayout(this);
        tabs.setBackgroundColor(GREEN);
        String[] names = {"CHATS", "ESTADOS", "LLAMADAS"};
        for (int i = 0; i < names.length; i++) {
            final int tab = i;
            LinearLayout item = new LinearLayout(this);
            item.setOrientation(LinearLayout.VERTICAL);
            item.setGravity(Gravity.CENTER);
            TextView text = label(names[i], 13, i == selectedTab ? Color.WHITE : 0xffc5d9d6, true);
            text.setGravity(Gravity.CENTER);
            item.addView(text, new LinearLayout.LayoutParams(-1, 0, 1));
            View indicator = new View(this);
            indicator.setBackgroundColor(i == selectedTab ? 0xffb2dfdb : GREEN);
            item.addView(indicator, new LinearLayout.LayoutParams(-1, dp(3)));
            item.setOnClickListener(v -> {
                selectedTab = tab;
                showHome();
            });
            tabs.addView(item, new LinearLayout.LayoutParams(0, -1, 1));
        }
        return tabs;
    }

    private View createChatList() {
        FrameLayout frame = new FrameLayout(this);
        ScrollView scroll = new ScrollView(this);
        LinearLayout rows = new LinearLayout(this);
        rows.setOrientation(LinearLayout.VERTICAL);
        for (int i = 0; i < chats.size(); i++) {
            final Chat chat = chats.get(i);
            rows.addView(createChatRow(chat));
        }
        scroll.addView(rows);
        frame.addView(scroll, new FrameLayout.LayoutParams(-1, -1));

        TextView fab = label("+", 32, Color.WHITE, false);
        fab.setGravity(Gravity.CENTER);
        fab.setElevation(dp(6));
        fab.setBackground(circle(GREEN_LIGHT));
        fab.setContentDescription("Nueva conversación");
        fab.setOnClickListener(v -> showContactPicker());
        FrameLayout.LayoutParams fabParams = new FrameLayout.LayoutParams(dp(56), dp(56), Gravity.BOTTOM | Gravity.RIGHT);
        fabParams.setMargins(0, 0, dp(18), dp(18));
        frame.addView(fab, fabParams);
        return frame;
    }

    private View createChatRow(Chat chat) {
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(16), dp(10), dp(16), dp(10));

        View avatar = avatar(chat.name, chat.color);
        avatar.setOnClickListener(v -> chooseProfilePhoto(chat.name));
        row.addView(avatar, new LinearLayout.LayoutParams(dp(54), dp(54)));

        LinearLayout details = new LinearLayout(this);
        details.setOrientation(LinearLayout.VERTICAL);
        details.setPadding(dp(14), 0, 0, 0);
        LinearLayout.LayoutParams detailParams = new LinearLayout.LayoutParams(0, -2, 1);
        row.addView(details, detailParams);

        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        TextView name = label(chat.name, 17, TEXT_DARK, true);
        top.addView(name, new LinearLayout.LayoutParams(0, -2, 1));
        top.addView(label(chat.time, 12, TEXT_MUTED, false));
        details.addView(top);

        TextView preview = label(chat.lastMessage, 14, TEXT_MUTED, false);
        preview.setSingleLine(true);
        preview.setEllipsize(android.text.TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams previewParams = new LinearLayout.LayoutParams(-1, -2);
        previewParams.topMargin = dp(5);
        details.addView(preview, previewParams);

        row.setMinimumHeight(dp(76));
        row.setBackgroundResource(android.R.drawable.list_selector_background);
        row.setOnClickListener(v -> openChat(chat));

        LinearLayout wrapper = new LinearLayout(this);
        wrapper.setOrientation(LinearLayout.VERTICAL);
        wrapper.addView(row, new LinearLayout.LayoutParams(-1, -2));
        View divider = new View(this);
        divider.setBackgroundColor(0xffeeeeee);
        LinearLayout.LayoutParams dividerParams = new LinearLayout.LayoutParams(-1, dp(1));
        dividerParams.leftMargin = dp(84);
        wrapper.addView(divider, dividerParams);
        return wrapper;
    }

    private View createStatusList() {
        LinearLayout list = new LinearLayout(this);
        list.setOrientation(LinearLayout.VERTICAL);
        list.setPadding(0, dp(8), 0, 0);
        list.addView(createStatusRow("Mi estado", "Toca para añadir una actualización", 0xff8cb5ab, true));
        TextView heading = label("ACTUALIZACIONES RECIENTES", 12, TEXT_MUTED, true);
        heading.setPadding(dp(18), dp(18), dp(18), dp(8));
        list.addView(heading);
        list.addView(createStatusRow("Ana López", "hace 12 minutos", AVATAR_COLORS[0], false));
        list.addView(createStatusRow("Carlos Ruiz", "hace 35 minutos", AVATAR_COLORS[1], false));
        list.addView(createStatusRow("Sofía Pérez", "hace 1 hora", AVATAR_COLORS[4], false));
        return list;
    }

    private View createStatusRow(String name, String subtitle, int color, boolean ownStatus) {
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(16), dp(9), dp(16), dp(9));
        View avatar = avatar(ownStatus ? "Mi perfil" : name, color);
        if (!ownStatus) {
            FrameLayout ring = new FrameLayout(this);
            GradientDrawable ringDrawable = circle(color);
            ringDrawable.setStroke(dp(3), GREEN_LIGHT);
            ring.setBackground(ringDrawable);
            FrameLayout.LayoutParams avatarParams = new FrameLayout.LayoutParams(-1, -1);
            avatarParams.setMargins(dp(4), dp(4), dp(4), dp(4));
            ring.addView(avatar, avatarParams);
            avatar = ring;
        }
        row.addView(avatar, new LinearLayout.LayoutParams(dp(52), dp(52)));
        LinearLayout copy = new LinearLayout(this);
        copy.setOrientation(LinearLayout.VERTICAL);
        copy.setPadding(dp(14), 0, 0, 0);
        copy.addView(label(name, 16, TEXT_DARK, true));
        TextView caption = label(subtitle, 13, TEXT_MUTED, false);
        LinearLayout.LayoutParams captionParams = new LinearLayout.LayoutParams(-2, -2);
        captionParams.topMargin = dp(4);
        copy.addView(caption, captionParams);
        row.addView(copy);
        return row;
    }

    private View createCallsList() {
        LinearLayout list = new LinearLayout(this);
        list.setOrientation(LinearLayout.VERTICAL);
        list.setPadding(0, dp(8), 0, 0);
        list.addView(createCallRow("María García", "Hoy, 10:42 · Llamada entrante", AVATAR_COLORS[2]));
        list.addView(createCallRow("Luis Torres", "Ayer, 18:20 · Llamada saliente", AVATAR_COLORS[3]));
        list.addView(createCallRow("Ana López", "Ayer, 12:05 · Llamada entrante", AVATAR_COLORS[0]));
        return list;
    }

    private View createCallRow(String name, String description, int color) {
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(16), dp(10), dp(18), dp(10));
        row.addView(avatar(name, color), new LinearLayout.LayoutParams(dp(52), dp(52)));
        LinearLayout copy = new LinearLayout(this);
        copy.setOrientation(LinearLayout.VERTICAL);
        copy.setPadding(dp(14), 0, 0, 0);
        copy.addView(label(name, 16, TEXT_DARK, true));
        TextView detail = label(description, 13, TEXT_MUTED, false);
        LinearLayout.LayoutParams detailParams = new LinearLayout.LayoutParams(-2, -2);
        detailParams.topMargin = dp(4);
        copy.addView(detail, detailParams);
        row.addView(copy, new LinearLayout.LayoutParams(0, -2, 1));
        TextView call = label("☎", 22, GREEN_LIGHT, false);
        row.addView(call);
        row.setOnClickListener(v -> Toast.makeText(this, "Llamada de demostración", Toast.LENGTH_SHORT).show());
        return row;
    }

    private void openChat(Chat chat) {
        currentChat = chat;
        showConversation();
    }

    private void showConversation() {
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setBackgroundColor(0xffeee9e2);
        page.addView(createConversationBar(), new LinearLayout.LayoutParams(-1, dp(58)));

        messageScroll = new ScrollView(this);
        messageScroll.setFillViewport(true);
        messageList = new LinearLayout(this);
        messageList.setOrientation(LinearLayout.VERTICAL);
        messageList.setPadding(dp(10), dp(12), dp(10), dp(12));
        messageRows.clear();
        messageScroll.addView(messageList);
        page.addView(messageScroll, new LinearLayout.LayoutParams(-1, 0, 1));
        for (Message message : currentChat.messages) {
            addMessageBubble(message);
        }

        page.addView(createComposer(), new LinearLayout.LayoutParams(-1, -2));
        setContentView(page);
        messageScroll.post(() -> messageScroll.fullScroll(View.FOCUS_DOWN));
    }

    private View createConversationBar() {
        LinearLayout bar = new LinearLayout(this);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(4), 0, dp(12), 0);
        bar.setBackgroundColor(GREEN);

        TextView back = label("‹", 34, Color.WHITE, false);
        back.setGravity(Gravity.CENTER);
        back.setOnClickListener(v -> showHome());
        bar.addView(back, new LinearLayout.LayoutParams(dp(42), -1));
        View photo = avatar(currentChat.name, currentChat.color);
        photo.setOnClickListener(v -> {
            if (currentChat.isGroup) {
                Toast.makeText(this, "La foto del grupo no está disponible en esta demo", Toast.LENGTH_SHORT).show();
            } else {
                chooseProfilePhoto(currentChat.name);
            }
        });
        bar.addView(photo, new LinearLayout.LayoutParams(dp(40), dp(40)));

        LinearLayout person = new LinearLayout(this);
        person.setOrientation(LinearLayout.VERTICAL);
        person.setPadding(dp(10), 0, 0, 0);
        person.addView(label(currentChat.name, 17, Color.WHITE, true));
        String statusText = currentChat.isGroup
                ? "Grupo · " + (currentChat.members.size() + 1) + " participantes"
                : "en línea";
        TextView status = label(statusText, 12, 0xffd4e8e5, false);
        LinearLayout.LayoutParams statusParams = new LinearLayout.LayoutParams(-2, -2);
        statusParams.topMargin = dp(2);
        person.addView(status, statusParams);
        bar.addView(person, new LinearLayout.LayoutParams(0, -2, 1));

        TextView search = label("⌕", 25, Color.WHITE, false);
        search.setGravity(Gravity.CENTER);
        search.setContentDescription("Buscar mensajes en esta conversación");
        search.setOnClickListener(v -> showMessageSearch(currentChat));
        bar.addView(search, new LinearLayout.LayoutParams(dp(38), -1));

        TextView call = label("☎", 22, Color.WHITE, false);
        call.setGravity(Gravity.CENTER);
        call.setOnClickListener(v -> Toast.makeText(this, "Llamada de demostración", Toast.LENGTH_SHORT).show());
        bar.addView(call, new LinearLayout.LayoutParams(dp(42), -1));
        return bar;
    }

    private View createComposer() {
        LinearLayout composer = new LinearLayout(this);
        composer.setGravity(Gravity.CENTER_VERTICAL);
        composer.setPadding(dp(8), dp(6), dp(8), dp(6));
        composer.setBackgroundColor(0xfff5f3f0);

        TextView attach = label("▧", 23, GREEN_LIGHT, false);
        attach.setGravity(Gravity.CENTER);
        attach.setContentDescription("Adjuntar imagen");
        attach.setOnClickListener(v -> chooseMessageImage());
        composer.addView(attach, new LinearLayout.LayoutParams(dp(38), dp(46)));

        EditText input = new EditText(this);
        input.setSingleLine(false);
        input.setMaxLines(4);
        input.setTextSize(16);
        input.setHint("Escribe un mensaje");
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES | InputType.TYPE_TEXT_FLAG_MULTI_LINE);
        input.setPadding(dp(16), dp(8), dp(16), dp(8));
        input.setBackground(rounded(Color.WHITE, dp(24)));
        composer.addView(input, new LinearLayout.LayoutParams(0, -2, 1));

        TextView send = label("➤", 22, Color.WHITE, true);
        send.setGravity(Gravity.CENTER);
        send.setBackground(circle(GREEN_LIGHT));
        send.setContentDescription("Enviar mensaje");
        LinearLayout.LayoutParams sendParams = new LinearLayout.LayoutParams(dp(46), dp(46));
        sendParams.leftMargin = dp(8);
        composer.addView(send, sendParams);

        View.OnClickListener sendAction = v -> sendMessage(input);
        send.setOnClickListener(sendAction);
        input.setOnEditorActionListener((view, actionId, event) -> {
            sendMessage(input);
            return true;
        });
        return composer;
    }

    private void sendMessage(EditText input) {
        String body = input.getText().toString().trim();
        if (body.isEmpty() || currentChat == null) {
            return;
        }
        Message message = new Message(body, true, now());
        currentChat.messages.add(message);
        currentChat.lastMessage = body;
        currentChat.time = message.time;
        saveChats();
        input.setText("");
        addMessageBubble(message);
        messageScroll.post(() -> messageScroll.fullScroll(View.FOCUS_DOWN));
    }

    private void addMessageBubble(Message message) {
        LinearLayout line = new LinearLayout(this);
        line.setGravity(message.mine ? Gravity.RIGHT : Gravity.LEFT);
        LinearLayout.LayoutParams lineParams = new LinearLayout.LayoutParams(-1, -2);
        lineParams.bottomMargin = dp(7);

        LinearLayout bubble = new LinearLayout(this);
        bubble.setOrientation(LinearLayout.VERTICAL);
        bubble.setPadding(dp(11), dp(7), dp(9), dp(5));
        bubble.setBackground(rounded(message.mine ? 0xffdcf8c6 : Color.WHITE, dp(10)));
        if (message.imageUri != null && !message.deleted) {
            ImageView image = new ImageView(this);
            image.setScaleType(ImageView.ScaleType.CENTER_CROP);
            image.setAdjustViewBounds(true);
            image.setMaxWidth(dp(230));
            image.setMaxHeight(dp(190));
            try {
                image.setImageURI(Uri.parse(message.imageUri));
            } catch (RuntimeException ignored) {
                image.setImageDrawable(null);
            }
            bubble.addView(image, new LinearLayout.LayoutParams(dp(230), dp(170)));
        }
        if (!message.body.isEmpty()) {
            TextView body = label(message.body, 16, TEXT_DARK, false);
            body.setMaxWidth(getResources().getDisplayMetrics().widthPixels - dp(88));
            bubble.addView(body);
        }
        LinearLayout metadata = new LinearLayout(this);
        metadata.setOrientation(LinearLayout.HORIZONTAL);
        metadata.setGravity(Gravity.RIGHT | Gravity.CENTER_VERTICAL);
        metadata.addView(label(message.time, 10, TEXT_MUTED, false));
        if (message.mine) {
            TextView checks = label(message.read ? "✓✓" : "✓", 12,
                    message.read ? READ_BLUE : TEXT_MUTED, true);
            checks.setPadding(dp(4), 0, 0, 0);
            checks.setContentDescription(message.read ? "Leído" : "Enviado");
            metadata.addView(checks);
        }
        LinearLayout.LayoutParams metadataParams = new LinearLayout.LayoutParams(-1, -2);
        metadataParams.topMargin = dp(2);
        bubble.addView(metadata, metadataParams);
        line.addView(bubble, new LinearLayout.LayoutParams(-2, -2));
        line.setOnLongClickListener(v -> {
            if (!message.mine || message.deleted) {
                Toast.makeText(this, "Solo puedes eliminar tus mensajes enviados", Toast.LENGTH_SHORT).show();
            } else {
                confirmDeleteMessage(message);
            }
            return true;
        });
        messageList.addView(line, lineParams);
        messageRows.add(line);
    }

    private void confirmDeleteMessage(Message message) {
        new AlertDialog.Builder(this)
                .setTitle("Eliminar mensaje")
                .setMessage("El mensaje se reemplazará por “Este mensaje fue eliminado” en este dispositivo.")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Eliminar", (dialog, which) -> {
                    message.body = "Este mensaje fue eliminado";
                    message.imageUri = null;
                    message.deleted = true;
                    updatePreview(currentChat);
                    saveChats();
                    showConversation();
                })
                .show();
    }

    private void showContactPicker() {
        ArrayList<String> available = new ArrayList<>();
        for (String contact : CONTACTS) {
            if (findChat(contact) == null) {
                available.add(contact);
            }
        }
        if (available.isEmpty()) {
            Toast.makeText(this, "Ya agregaste todos los contactos de ejemplo", Toast.LENGTH_SHORT).show();
            return;
        }
        String[] choices = available.toArray(new String[0]);
        new AlertDialog.Builder(this)
                .setTitle("Nueva conversación")
                .setItems(choices, (dialog, which) -> {
                    String name = choices[which];
                    Chat chat = new Chat(name, AVATAR_COLORS[chats.size() % AVATAR_COLORS.length]);
                    chats.add(0, chat);
                    saveChats();
                    selectedTab = 0;
                    openChat(chat);
                })
                .setNegativeButton("Cancelar", null)
                .show();
    }

    private Chat findChat(String name) {
        for (Chat chat : chats) {
            if (chat.name.equals(name)) {
                return chat;
            }
        }
        return null;
    }

    private void loadChats() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String saved = preferences.getString(PREF_CHATS, null);
        if (saved != null) {
            try {
                JSONArray array = new JSONArray(saved);
                for (int i = 0; i < array.length(); i++) {
                    JSONObject object = array.getJSONObject(i);
                    Chat chat = new Chat(object.getString("name"), object.getInt("color"));
                    chat.isGroup = object.optBoolean("isGroup", "Familia".equals(chat.name));
                    JSONArray members = object.optJSONArray("members");
                    if (members != null) {
                        for (int j = 0; j < members.length(); j++) chat.members.add(members.optString(j));
                    } else if ("Familia".equals(chat.name)) {
                        chat.members.add("Ana López");
                        chat.members.add("Carlos Ruiz");
                    }
                    chat.lastMessage = object.optString("lastMessage", "");
                    chat.time = object.optString("time", "");
                    JSONArray messages = object.optJSONArray("messages");
                    if (messages != null) {
                        for (int j = 0; j < messages.length(); j++) {
                            JSONObject item = messages.getJSONObject(j);
                            boolean mine = item.getBoolean("mine");
                            boolean read = item.optBoolean("read", mine);
                            Message message = new Message(item.optString("body", ""), mine, item.optString("time", ""), read,
                                    item.has("imageUri") ? item.optString("imageUri", null) : null);
                            message.deleted = item.optBoolean("deleted", false);
                            chat.messages.add(message);
                        }
                    }
                    chats.add(chat);
                }
                return;
            } catch (JSONException ignored) {
                chats.clear();
            }
        }
        addSampleChats();
        saveChats();
    }

    private void addSampleChats() {
        Chat maria = new Chat("María García", AVATAR_COLORS[2]);
        maria.messages.add(new Message("¡Hola! ¿Cómo estás?", false, "10:22"));
        maria.messages.add(new Message("¡Muy bien! ¿Y tú? 😊", true, "10:24"));
        updatePreview(maria);

        Chat carlos = new Chat("Carlos Ruiz", AVATAR_COLORS[1]);
        carlos.messages.add(new Message("Nos vemos mañana 👋", false, "Ayer"));
        updatePreview(carlos);

        Chat family = new Chat("Familia", 0xff8c9d70, true);
        family.members.add("Ana López");
        family.members.add("Carlos Ruiz");
        family.messages.add(new Message("Ya voy en camino", true, "Ayer"));
        updatePreview(family);

        chats.add(maria);
        chats.add(carlos);
        chats.add(family);
    }

    private void updatePreview(Chat chat) {
        if (!chat.messages.isEmpty()) {
            Message last = chat.messages.get(chat.messages.size() - 1);
            String preview = last.deleted ? "Este mensaje fue eliminado"
                    : (last.imageUri != null ? "📷 Imagen" : last.body);
            chat.lastMessage = last.mine && !last.deleted ? "Tú: " + preview : preview;
            chat.time = last.time;
        }
    }

    private void loadProfilePhotos() {
        String saved = getSharedPreferences(PREFS_NAME, MODE_PRIVATE).getString(PREF_PROFILE_PHOTOS, "{}");
        try {
            JSONObject photos = new JSONObject(saved);
            for (java.util.Iterator<String> keys = photos.keys(); keys.hasNext(); ) {
                String name = keys.next();
                profilePhotoUris.put(name, photos.optString(name, ""));
            }
        } catch (JSONException ignored) {
            profilePhotoUris.clear();
        }
    }

    private void saveProfilePhotos() {
        JSONObject photos = new JSONObject();
        try {
            for (String name : profilePhotoUris.keySet()) photos.put(name, profilePhotoUris.get(name));
            getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit().putString(PREF_PROFILE_PHOTOS, photos.toString()).apply();
        } catch (JSONException ignored) {
            // Photo keys and URI strings are always valid JSON values.
        }
    }

    private void saveChats() {
        JSONArray array = new JSONArray();
        try {
            for (Chat chat : chats) {
                JSONObject object = new JSONObject();
                object.put("name", chat.name);
                object.put("color", chat.color);
                object.put("lastMessage", chat.lastMessage);
                object.put("time", chat.time);
                object.put("isGroup", chat.isGroup);
                JSONArray members = new JSONArray();
                for (String member : chat.members) members.put(member);
                object.put("members", members);
                JSONArray messages = new JSONArray();
                for (Message message : chat.messages) {
                    JSONObject item = new JSONObject();
                    item.put("body", message.body);
                    item.put("mine", message.mine);
                    item.put("time", message.time);
                    item.put("read", message.read);
                    item.put("deleted", message.deleted);
                    if (message.imageUri != null) item.put("imageUri", message.imageUri);
                    messages.put(item);
                }
                object.put("messages", messages);
                array.put(object);
            }
            getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit().putString(PREF_CHATS, array.toString()).apply();
        } catch (JSONException ignored) {
            // Los campos escritos arriba siempre son tipos JSON compatibles.
        }
    }

    private View avatar(String name, int color) {
        TextView view = label(initials(name), 17, Color.WHITE, true);
        view.setGravity(Gravity.CENTER);
        view.setBackground(circle(color));
        String photoUri = profilePhotoUris.get(name);
        if (photoUri == null || photoUri.isEmpty()) return view;

        ImageView photo = new ImageView(this);
        photo.setScaleType(ImageView.ScaleType.CENTER_CROP);
        try {
            photo.setImageURI(Uri.parse(photoUri));
        } catch (RuntimeException ignored) {
            return view;
        }
        if (photo.getDrawable() == null) return view;
        FrameLayout frame = new FrameLayout(this);
        frame.setBackground(circle(color));
        frame.setClipToOutline(true);
        frame.addView(photo, new FrameLayout.LayoutParams(-1, -1));
        return frame;
    }

    private String initials(String name) {
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, 1).toUpperCase(Locale.getDefault());
        }
        return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase(Locale.getDefault());
    }

    private TextView label(String text, float size, int color, boolean bold) {
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextSize(size);
        view.setTextColor(color);
        if (bold) {
            view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        }
        return view;
    }

    private GradientDrawable circle(int color) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setShape(GradientDrawable.OVAL);
        drawable.setColor(color);
        return drawable;
    }

    private GradientDrawable rounded(int color, int radius) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(radius);
        return drawable;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private String now() {
        return new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date());
    }

    @Override
    public void onBackPressed() {
        if (currentChat != null) {
            showHome();
        } else if (selectedTab != 0) {
            selectedTab = 0;
            showHome();
        } else {
            super.onBackPressed();
        }
    }

    private static class Chat {
        final String name;
        final int color;
        final ArrayList<Message> messages = new ArrayList<>();
        final ArrayList<String> members = new ArrayList<>();
        boolean isGroup;
        String lastMessage = "";
        String time = "";

        Chat(String name, int color) {
            this(name, color, false);
        }

        Chat(String name, int color, boolean isGroup) {
            this.name = name;
            this.color = color;
            this.isGroup = isGroup;
        }
    }

    private static class Message {
        String body;
        final boolean mine;
        final String time;
        final boolean read;
        String imageUri;
        boolean deleted;

        Message(String body, boolean mine, String time) {
            this(body, mine, time, mine);
        }

        Message(String body, boolean mine, String time, boolean read) {
            this(body, mine, time, read, null);
        }

        Message(String body, boolean mine, String time, boolean read, String imageUri) {
            this.body = body;
            this.mine = mine;
            this.time = time;
            this.read = read;
            this.imageUri = imageUri;
        }
    }
}
