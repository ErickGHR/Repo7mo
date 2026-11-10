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
import android.widget.EditText;
import android.widget.FrameLayout;
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
import java.util.Date;
import java.util.Locale;

/** Una demostración local de mensajería hecha únicamente con Java. */
public class MainActivity extends Activity {
    private static final String PREFS_NAME = "fake_whatsapp";
    private static final String PREF_CHATS = "chats";
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
    private int selectedTab = 0;
    private Chat currentChat;
    private LinearLayout messageList;
    private ScrollView messageScroll;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window window = getWindow();
        window.setStatusBarColor(0xff064e46);
        window.setNavigationBarColor(0xff063f39);
        loadChats();
        showHome();
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
        menu.getMenu().add("Acerca de").setOnMenuItemClickListener(item -> {
            new AlertDialog.Builder(this)
                    .setTitle("FakeWhatsapp")
                    .setMessage("Demo de mensajería hecha en Java. Los chats se guardan solo en este dispositivo.")
                    .setPositiveButton("Cerrar", null)
                    .show();
            return true;
        });
        menu.show();
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

        TextView avatar = avatar(chat.name, chat.color);
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
        TextView avatar = avatar(name, color);
        if (!ownStatus) {
            GradientDrawable ring = new GradientDrawable();
            ring.setShape(GradientDrawable.OVAL);
            ring.setColor(color);
            ring.setStroke(dp(3), GREEN_LIGHT);
            avatar.setBackground(ring);
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
        bar.addView(avatar(currentChat.name, currentChat.color), new LinearLayout.LayoutParams(dp(40), dp(40)));

        LinearLayout person = new LinearLayout(this);
        person.setOrientation(LinearLayout.VERTICAL);
        person.setPadding(dp(10), 0, 0, 0);
        person.addView(label(currentChat.name, 17, Color.WHITE, true));
        TextView status = label("en línea", 12, 0xffd4e8e5, false);
        LinearLayout.LayoutParams statusParams = new LinearLayout.LayoutParams(-2, -2);
        statusParams.topMargin = dp(2);
        person.addView(status, statusParams);
        bar.addView(person, new LinearLayout.LayoutParams(0, -2, 1));

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
        TextView body = label(message.body, 16, TEXT_DARK, false);
        body.setMaxWidth(getResources().getDisplayMetrics().widthPixels - dp(88));
        bubble.addView(body);
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
        messageList.addView(line, lineParams);
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
                    chat.lastMessage = object.optString("lastMessage", "");
                    chat.time = object.optString("time", "");
                    JSONArray messages = object.optJSONArray("messages");
                    if (messages != null) {
                        for (int j = 0; j < messages.length(); j++) {
                            JSONObject item = messages.getJSONObject(j);
                            boolean mine = item.getBoolean("mine");
                            boolean read = item.optBoolean("read", mine);
                            chat.messages.add(new Message(item.getString("body"), mine, item.getString("time"), read));
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

        Chat family = new Chat("Familia", 0xff8c9d70);
        family.messages.add(new Message("Ya voy en camino", true, "Ayer"));
        updatePreview(family);

        chats.add(maria);
        chats.add(carlos);
        chats.add(family);
    }

    private void updatePreview(Chat chat) {
        if (!chat.messages.isEmpty()) {
            Message last = chat.messages.get(chat.messages.size() - 1);
            chat.lastMessage = last.mine ? "Tú: " + last.body : last.body;
            chat.time = last.time;
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
                JSONArray messages = new JSONArray();
                for (Message message : chat.messages) {
                    JSONObject item = new JSONObject();
                    item.put("body", message.body);
                    item.put("mine", message.mine);
                    item.put("time", message.time);
                    item.put("read", message.read);
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

    private TextView avatar(String name, int color) {
        TextView view = label(initials(name), 17, Color.WHITE, true);
        view.setGravity(Gravity.CENTER);
        view.setBackground(circle(color));
        return view;
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
        String lastMessage = "";
        String time = "";

        Chat(String name, int color) {
            this.name = name;
            this.color = color;
        }
    }

    private static class Message {
        final String body;
        final boolean mine;
        final String time;
        final boolean read;

        Message(String body, boolean mine, String time) {
            this(body, mine, time, mine);
        }

        Message(String body, boolean mine, String time, boolean read) {
            this.body = body;
            this.mine = mine;
            this.time = time;
            this.read = read;
        }
    }
}
