package com.example.fakewhatsapp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/** Recibe push de mensajes y los abre en la conversación indicada. */
public class FakeWhatsappMessagingService extends FirebaseMessagingService {
    static final String CHANNEL_ID = "messages";
    static final String EXTRA_CONVERSATION_TITLE = "conversation_title";
    private static final String TOKEN_PREFS = "fake_whatsapp_push";
    private static final String TOKEN_KEY = "fcm_token";

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        getSharedPreferences(TOKEN_PREFS, MODE_PRIVATE).edit().putString(TOKEN_KEY, token).apply();
        SupabaseApi.registerPushToken(this, token);
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        String title = remoteMessage.getData().get("conversation_title");
        String body = remoteMessage.getData().get("body");
        if (remoteMessage.getNotification() != null) {
            if (title == null) title = remoteMessage.getNotification().getTitle();
            if (body == null) body = remoteMessage.getNotification().getBody();
        }
        showMessageNotification(
                title == null || title.trim().isEmpty() ? "Nuevo mensaje" : title,
                body == null || body.trim().isEmpty() ? "Tienes un mensaje nuevo" : body,
                remoteMessage.getData().get("conversation_id"),
                remoteMessage.getMessageId()
        );
    }

    static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "Mensajes", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Notificaciones de mensajes nuevos");
        manager.createNotificationChannel(channel);
    }

    static String getSavedToken(Context context) {
        return context.getSharedPreferences(TOKEN_PREFS, MODE_PRIVATE).getString(TOKEN_KEY, null);
    }

    private void showMessageNotification(String title, String body, String conversationId, String messageId) {
        createNotificationChannel(this);
        Intent openConversation = new Intent(this, MainActivity.class)
                .putExtra(EXTRA_CONVERSATION_TITLE, title)
                .putExtra("conversation_id", conversationId)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int requestCode = messageId == null ? (conversationId == null ? 0 : conversationId.hashCode()) : messageId.hashCode();
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pendingIntent = PendingIntent.getActivity(this, requestCode, openConversation, flags);

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);
        Notification notification = builder
                .setSmallIcon(android.R.drawable.sym_action_chat)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setShowWhen(true)
                .build();
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(requestCode, notification);
    }
}
