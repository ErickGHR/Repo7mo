package com.example.fakewhatsapp;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Conexión REST mínima, sin SDK externo; funciona solo cuando el usuario configura Supabase. */
final class SupabaseApi {
    private static final String PREFS = "fake_whatsapp_api";
    private static final String ACCESS_TOKEN = "access_token";
    private static final String REFRESH_TOKEN = "refresh_token";
    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();
    private static final Handler MAIN = new Handler(Looper.getMainLooper());

    interface Callback {
        void onComplete(boolean success, String message);
    }

    private SupabaseApi() { }

    static boolean isConfigured() {
        return BuildConfig.SUPABASE_URL != null && !BuildConfig.SUPABASE_URL.trim().isEmpty()
                && BuildConfig.SUPABASE_ANON_KEY != null && !BuildConfig.SUPABASE_ANON_KEY.trim().isEmpty();
    }

    static boolean hasSession(Context context) {
        return !context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(ACCESS_TOKEN, "").isEmpty();
    }

    static void signIn(Context context, String email, String password, Callback callback) {
        authenticate(context, "token?grant_type=password", email, password, callback);
    }

    static void signUp(Context context, String email, String password, Callback callback) {
        authenticate(context, "signup", email, password, callback);
    }

    static void resetPassword(Context context, String email, Callback callback) {
        if (!isConfigured()) {
            callback.onComplete(false, "Configura Supabase antes de recuperar la contraseña.");
            return;
        }
        EXECUTOR.execute(() -> {
            boolean success = false;
            String message = "No se pudo enviar el enlace de recuperación.";
            try {
                JSONObject body = new JSONObject();
                body.put("email", email);
                String redirect = URLEncoder.encode(BuildConfig.SUPABASE_REDIRECT_URL, "UTF-8");
                HttpResult result = request("POST", "/auth/v1/recover?redirect_to=" + redirect, body, null);
                if (result.code >= 200 && result.code < 300) {
                    success = true;
                    message = "Si el correo existe, recibirás un enlace para restablecer la contraseña.";
                } else {
                    message = responseMessage(result.body, message);
                }
            } catch (Exception exception) {
                message = "Error de conexión: " + exception.getMessage();
            }
            final boolean completed = success;
            final String resultMessage = message;
            MAIN.post(() -> callback.onComplete(completed, resultMessage));
        });
    }

    static boolean storeRecoverySession(Context context, String accessToken, String refreshToken) {
        if (accessToken == null || accessToken.isEmpty() || refreshToken == null || refreshToken.isEmpty()) {
            return false;
        }
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putString(ACCESS_TOKEN, accessToken)
                .putString(REFRESH_TOKEN, refreshToken)
                .apply();
        return true;
    }

    static void updatePassword(Context context, String password, Callback callback) {
        if (!isConfigured()) {
            callback.onComplete(false, "Configura Supabase antes de cambiar la contraseña.");
            return;
        }
        SharedPreferences preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String accessToken = preferences.getString(ACCESS_TOKEN, "");
        if (accessToken.isEmpty()) {
            callback.onComplete(false, "Abre el enlace de recuperación antes de guardar la contraseña.");
            return;
        }
        EXECUTOR.execute(() -> {
            boolean success = false;
            String message = "No se pudo actualizar la contraseña.";
            try {
                JSONObject body = new JSONObject();
                body.put("password", password);
                HttpResult result = requestWithRefresh(context, "PUT", "/auth/v1/user", body, accessToken);
                if (result.code >= 200 && result.code < 300) {
                    success = true;
                    message = "Contraseña actualizada correctamente.";
                } else {
                    message = responseMessage(result.body, message);
                }
            } catch (Exception exception) {
                message = "Error de conexión: " + exception.getMessage();
            }
            final boolean completed = success;
            final String resultMessage = message;
            MAIN.post(() -> callback.onComplete(completed, resultMessage));
        });
    }

    static void signOut(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String accessToken = preferences.getString(ACCESS_TOKEN, "");
        String pushToken = FakeWhatsappMessagingService.getSavedToken(context);
        if (!accessToken.isEmpty() && pushToken != null) {
            EXECUTOR.execute(() -> {
                try {
                    JSONObject body = new JSONObject();
                    body.put("p_token", pushToken);
                    requestWithRefresh(context, "/rest/v1/rpc/unregister_push_device", body, accessToken);
                } catch (Exception ignored) {
                    // The local sign-out must still complete if the API is unavailable.
                } finally {
                    preferences.edit().clear().apply();
                }
            });
        } else {
            preferences.edit().clear().apply();
        }
    }

    static void registerPendingPushToken(Context context) {
        String token = FakeWhatsappMessagingService.getSavedToken(context);
        if (token != null) registerPushToken(context, token);
    }

    static void registerPushToken(Context context, String token) {
        if (!isConfigured()) return;
        String access = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(ACCESS_TOKEN, "");
        if (access.isEmpty()) return;
        EXECUTOR.execute(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("p_token", token);
                body.put("p_device_name", Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID));
                requestWithRefresh(context, "/rest/v1/rpc/register_push_device", body, access);
            } catch (Exception ignored) {
                // La demo local sigue funcionando aunque el servicio aún no esté configurado.
            }
        });
    }

    private static void authenticate(Context context, String endpoint, String email, String password, Callback callback) {
        if (!isConfigured()) {
            callback.onComplete(false, "Configura supabase.url y supabase.anonKey en local.properties.");
            return;
        }
        EXECUTOR.execute(() -> {
            boolean success = false;
            String resultMessage = "No se pudo conectar con Supabase.";
            try {
                JSONObject credentials = new JSONObject();
                credentials.put("email", email);
                credentials.put("password", password);
                HttpResult result = request("POST", "/auth/v1/" + endpoint, credentials, null);
                JSONObject response = new JSONObject(result.body);
                if (result.code >= 200 && result.code < 300) {
                    if (response.has("access_token")) {
                        SharedPreferences.Editor editor = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
                        editor.putString(ACCESS_TOKEN, response.getString("access_token"));
                        editor.putString(REFRESH_TOKEN, response.optString("refresh_token", ""));
                        editor.apply();
                        success = true;
                        resultMessage = endpoint.equals("signup")
                                ? "Cuenta creada. Sesión iniciada."
                                : "Sesión iniciada.";
                        registerPendingPushToken(context);
                    } else if (endpoint.equals("signup") && response.optJSONObject("user") != null) {
                        resultMessage = "Supabase recibió el registro. Revisa tu correo para confirmarlo y luego inicia sesión.";
                    } else {
                        resultMessage = response.optString("msg", response.optString("message", response.optString("error_description", resultMessage)));
                    }
                } else {
                    resultMessage = response.optString("msg", response.optString("message", response.optString("error_description", resultMessage)));
                }
            } catch (Exception exception) {
                resultMessage = "Error de conexión: " + exception.getMessage();
            }
            final boolean completed = success;
            final String message = resultMessage;
            MAIN.post(() -> callback.onComplete(completed, message));
        });
    }

    private static HttpResult request(String method, String path, JSONObject body, String accessToken) throws Exception {
        URL url = new URL(BuildConfig.SUPABASE_URL.replaceAll("/$", "") + path);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod(method);
        connection.setConnectTimeout(12000);
        connection.setReadTimeout(12000);
        connection.setRequestProperty("apikey", BuildConfig.SUPABASE_ANON_KEY);
        if (accessToken != null && !accessToken.isEmpty()) {
            connection.setRequestProperty("Authorization", "Bearer " + accessToken);
        }
        connection.setRequestProperty("Content-Type", "application/json");
        if (body != null) {
            connection.setDoOutput(true);
            try (OutputStream output = connection.getOutputStream()) {
                output.write(body.toString().getBytes(StandardCharsets.UTF_8));
            }
        }
        int code = connection.getResponseCode();
        InputStream stream = code >= 400 ? connection.getErrorStream() : connection.getInputStream();
        StringBuilder response = new StringBuilder();
        if (stream != null) {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) response.append(line);
            }
        }
        connection.disconnect();
        return new HttpResult(code, response.toString());
    }

    private static HttpResult requestWithRefresh(Context context, String path, JSONObject body, String accessToken) throws Exception {
        return requestWithRefresh(context, "POST", path, body, accessToken);
    }

    private static HttpResult requestWithRefresh(Context context, String method, String path,
                                                 JSONObject body, String accessToken) throws Exception {
        HttpResult result = request(method, path, body, accessToken);
        if (result.code != HttpURLConnection.HTTP_UNAUTHORIZED) return result;
        String refreshed = refreshSession(context);
        return refreshed == null ? result : request(method, path, body, refreshed);
    }

    private static String refreshSession(Context context) throws Exception {
        SharedPreferences preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String refreshToken = preferences.getString(REFRESH_TOKEN, "");
        if (refreshToken.isEmpty()) return null;
        JSONObject body = new JSONObject();
        body.put("refresh_token", refreshToken);
        HttpResult result = request("POST", "/auth/v1/token?grant_type=refresh_token", body, null);
        if (result.code < 200 || result.code >= 300) return null;
        JSONObject response = new JSONObject(result.body);
        String freshAccessToken = response.optString("access_token", "");
        if (freshAccessToken.isEmpty()) return null;
        preferences.edit()
                .putString(ACCESS_TOKEN, freshAccessToken)
                .putString(REFRESH_TOKEN, response.optString("refresh_token", refreshToken))
                .apply();
        return freshAccessToken;
    }

    private static String responseMessage(String body, String fallback) {
        try {
            JSONObject response = new JSONObject(body);
            return response.optString("msg", response.optString("message",
                    response.optString("error_description", fallback)));
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private static final class HttpResult {
        final int code;
        final String body;

        HttpResult(int code, String body) {
            this.code = code;
            this.body = body;
        }
    }
}
