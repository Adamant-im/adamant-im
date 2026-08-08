package im.adamant.adamantmessengerpwa;

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import java.util.HashSet;
import java.util.Set;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";
    private static final String PREFS_NAME = "AdamantNotifications";
    private static final String KEY_SENDER_NOTIFICATIONS = "sender_notifications_";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        clearAllNotifications();
        handleNotificationClick(getIntent());
    }

    @Override
    public void onResume() {
        super.onResume();
        clearAllNotifications();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleNotificationClick(intent);
    }

    private void clearAllNotifications() {
        try {
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.cancelAll();
                clearAllSavedNotificationIds();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error clearing notifications", e);
        }
    }

    private void handleNotificationClick(Intent intent) {
        if (intent != null && intent.getBooleanExtra("openChat", false)) {
            String senderId = intent.getStringExtra("senderId");
            String transactionId = intent.getStringExtra("transactionId");

            if (senderId != null) {
                clearNotificationsFromSender(senderId);
                openChat(senderId, transactionId);
            }

            intent.removeExtra("openChat");
            intent.removeExtra("senderId");
            intent.removeExtra("transactionId");
        }
    }

    private void openChat(String senderId, String transactionId) {
        String js = String.format(
                "window.dispatchEvent(new CustomEvent('openChat', { detail: { partnerId: '%s', transactionId: '%s' } }));",
                senderId,
                transactionId != null ? transactionId : ""
        );

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript(js, null);
        } else {
            new Handler().postDelayed(() -> {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript(js, null);
                }
            }, 500);
        }
    }

    private void clearNotificationsFromSender(String senderId) {
        try {
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager == null) {
                return;
            }

            Set<String> notificationIds = getSenderNotificationIds(senderId);
            for (String notificationIdStr : notificationIds) {
                try {
                    int notificationId = Integer.parseInt(notificationIdStr);
                    notificationManager.cancel(notificationId);
                } catch (NumberFormatException e) {
                    Log.e(TAG, "Invalid notification ID: " + notificationIdStr);
                }
            }
            clearSenderNotificationIds(senderId);
        } catch (Exception e) {
            Log.e(TAG, "Error clearing sender notifications", e);
        }
    }

    public static void saveNotificationId(Context context, String senderId, int notificationId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            Set<String> existingIds = prefs.getStringSet(KEY_SENDER_NOTIFICATIONS + senderId, new HashSet<>());
            Set<String> updatedIds = new HashSet<>(existingIds);
            updatedIds.add(String.valueOf(notificationId));
            prefs.edit().putStringSet(KEY_SENDER_NOTIFICATIONS + senderId, updatedIds).apply();
        } catch (Exception e) {
            Log.e(TAG, "Error saving notification ID", e);
        }
    }

    private Set<String> getSenderNotificationIds(String senderId) {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            return prefs.getStringSet(KEY_SENDER_NOTIFICATIONS + senderId, new HashSet<>());
        } catch (Exception e) {
            return new HashSet<>();
        }
    }

    private void clearSenderNotificationIds(String senderId) {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().remove(KEY_SENDER_NOTIFICATIONS + senderId).apply();
        } catch (Exception e) {
            Log.e(TAG, "Error clearing sender notification IDs", e);
        }
    }

    private void clearAllSavedNotificationIds() {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            for (String key : prefs.getAll().keySet()) {
                if (key.startsWith(KEY_SENDER_NOTIFICATIONS)) {
                    editor.remove(key);
                }
            }
            editor.apply();
        } catch (Exception e) {
            Log.e(TAG, "Error clearing all notification IDs", e);
        }
    }
}
