package im.adamant.adamantmessengerpwa;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.HashSet;
import android.os.Handler;
import android.os.Looper;
import org.json.JSONObject;

public class AdamantFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "AdamantFirebaseMsg";
    private static final String CHANNEL_ID = "adamant_notifications";
    private static final long CLEANUP_INTERVAL = 2 * 60 * 1000;

    private static final HashSet<String> processedEvents = new HashSet<>();
    private static Handler cleanupHandler = new Handler(Looper.getMainLooper());

    static {
        cleanupHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                processedEvents.clear();
                cleanupHandler.postDelayed(this, CLEANUP_INTERVAL);
            }
        }, CLEANUP_INTERVAL);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public void handleIntent(Intent intent) {
        RemoteMessage remoteMessage = null;
        try {
            if (intent.getExtras() != null) {
                remoteMessage = new RemoteMessage(intent.getExtras());
            }
        } catch (Exception e) {
            Log.e(TAG, "Error creating RemoteMessage", e);
        }

        if (remoteMessage == null) {
            super.handleIntent(intent);
            return;
        }

        if (areNotificationsDisabled()) {
            return;
        }

        String txnData = remoteMessage.getData().get("txn");
        if (txnData != null) {
            String transactionId = extractTransactionId(txnData);
            if (transactionId != null) {
                if (processedEvents.contains(transactionId)) {
                    return;
                }
                processedEvents.add(transactionId);

                // Also check if this is a signal message that should be hidden
                String body = formatNotificationText(txnData);
                if (body == null) {
                    // Signal message - don't show notification but still mark as processed
                    return;
                }
            }
        }

        if (isAppInForeground()) {
            super.handleIntent(intent);
        } else {
            showBackgroundNotification(remoteMessage);
        }
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
    }

    private void showBackgroundNotification(RemoteMessage remoteMessage) {
        try {
            String txnData = remoteMessage.getData().get("txn");
            if (txnData == null) {
                return;
            }

            String transactionId = extractTransactionId(txnData);
            String senderId = extractSenderId(txnData);
            if (transactionId == null || senderId == null) {
                return;
            }

            String title = senderId;
            String body = formatNotificationText(txnData);

            Intent clickIntent = new Intent(this, MainActivity.class);
            clickIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            clickIntent.putExtra("openChat", true);
            clickIntent.putExtra("senderId", senderId);
            clickIntent.putExtra("transactionId", transactionId);

            PendingIntent pendingIntent = PendingIntent.getActivity(
                    this,
                    transactionId.hashCode(),
                    clickIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setAutoCancel(true)
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                    .setContentIntent(pendingIntent);

            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            int notificationId = Math.abs(transactionId.hashCode());
            notificationManager.notify(notificationId, builder.build());

            MainActivity.saveNotificationId(this, senderId, notificationId);

        } catch (Exception e) {
            Log.e(TAG, "Error showing notification", e);
        }
    }

    private String formatNotificationText(String txnData) {
        try {
            JSONObject transaction = new JSONObject(txnData);

            int transactionType = transaction.optInt("type", -1);
            long transactionAmount = transaction.optLong("amount", 0);

            // Type 0: Pure ADM Transfer (without comments)
            if (transactionType == 0) {
                return formatADMTransfer(transactionAmount);
            }

            // Type 8: Chat Message (can include ADM transfer with comment)
            if (transactionType == 8) {
                // If amount > 0, it's ADM transfer with comment
                if (transactionAmount > 0) {
                    return formatADMTransferWithComment(transactionAmount);
                }

                // Regular chat message - check asset.chat.type
                return formatChatMessage(transaction);
            }

            return "New transaction";
        } catch (Exception e) {
            Log.e(TAG, "Error parsing notification", e);
            return "New message";
        }
    }

    private String formatChatMessage(JSONObject transaction) {
        try {
            if (!transaction.has("asset")) {
                return "New message";
            }

            JSONObject asset = transaction.getJSONObject("asset");
            if (!asset.has("chat")) {
                return "New message";
            }

            JSONObject chat = asset.getJSONObject("chat");
            int chatType = chat.optInt("type", 1);

            switch (chatType) {
                case 1:
                    // Basic Encrypted Message
                    return "New message";
                case 2:
                    // Rich Content Message (crypto transfers, etc.)
                    return "sent you crypto";
                case 3:
                    // Signal Message (should be hidden per documentation)
                    return null; // Don't show notification for signal messages
                default:
                    return "New message";
            }
        } catch (Exception e) {
            return "New message";
        }
    }

    private String formatADMTransfer(long amount) {
        if (amount == 0) {
            return "sent you ADM";
        }
        double admAmount = amount / 100000000.0;

        java.math.BigDecimal bd = java.math.BigDecimal.valueOf(admAmount);
        return String.format("sent you %s ADM", bd.stripTrailingZeros().toPlainString());
    }

    private String formatADMTransferWithComment(long amount) {
        if (amount == 0) {
            return "sent you ADM with message";
        }
        double admAmount = amount / 100000000.0;

        java.math.BigDecimal bd = java.math.BigDecimal.valueOf(admAmount);
        return String.format("sent you %s ADM with message", bd.stripTrailingZeros().toPlainString());
    }

    private boolean areNotificationsDisabled() {
        try {
            SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String notificationTypeStr = prefs.getString("allowNotificationType", "2");
            return "0".equals(notificationTypeStr);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isAppInForeground() {
        try {
            android.app.ActivityManager activityManager = (android.app.ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
            java.util.List<android.app.ActivityManager.RunningAppProcessInfo> appProcesses = activityManager.getRunningAppProcesses();

            if (appProcesses == null) {
                return false;
            }

            String packageName = getPackageName();
            for (android.app.ActivityManager.RunningAppProcessInfo appProcess : appProcesses) {
                if (appProcess.processName.equals(packageName)) {
                    return appProcess.importance == android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND;
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    private String extractTransactionId(String txnData) {
        try {
            JSONObject transaction = new JSONObject(txnData);
            return transaction.optString("id", null);
        } catch (Exception e) {
            // Fallback to string parsing
            return extractFieldFromJson(txnData, "\"id\":\"", 6);
        }
    }

    private String extractSenderId(String txnData) {
        try {
            JSONObject transaction = new JSONObject(txnData);
            return transaction.optString("senderId", null);
        } catch (Exception e) {
            // Fallback to string parsing
            return extractFieldFromJson(txnData, "\"senderId\":\"", 12);
        }
    }

    private String extractFieldFromJson(String jsonData, String fieldPattern, int patternLength) {
        try {
            int startIndex = jsonData.indexOf(fieldPattern);
            if (startIndex == -1) {
                return null;
            }

            startIndex += patternLength;
            int endIndex = jsonData.indexOf("\"", startIndex);
            return endIndex == -1 ? null : jsonData.substring(startIndex, endIndex);
        } catch (Exception e) {
            return null;
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "ADAMANT Notifications",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            channel.setDescription("Notifications for ADAMANT Messenger");

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
    }
}
