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
import com.goterl.lazysodium.LazySodiumAndroid;
import com.goterl.lazysodium.SodiumAndroid;
import com.goterl.lazysodium.interfaces.Box;
import com.goterl.lazysodium.interfaces.Sign;
import com.whitestein.securestorage.PasswordStorageHelper;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import android.os.Handler;
import android.os.Looper;
import org.json.JSONObject;

public class AdamantFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "AdamantFirebaseMsg";
    private static final String CHANNEL_ID = "adamant_notifications";
    private static final String PRIVATE_KEY_STORAGE_KEY = "adamant_private_key";
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
                if (isSignalMessage(txnData)) {
                    return;
                }
                String body = formatNotificationText(txnData);
                if (body == null) {
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
                    .setContentTitle(senderId)
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

    // ─── Private key & decryption ─────────────────────────────────────────────

    private byte[] readPrivateKeyBytes() {
        try {
            PasswordStorageHelper storage = new PasswordStorageHelper(this);
            byte[] data = storage.getData(PRIVATE_KEY_STORAGE_KEY);
            if (data == null) {
                return null;
            }
            String hexKey = new String(data, StandardCharsets.UTF_8);
            return hexToBytes(hexKey);
        } catch (Exception e) {
            Log.e(TAG, "Failed to read private key from SecureStorage", e);
            return null;
        }
    }

    private String decryptMessage(JSONObject transaction) {
        try {
            JSONObject chat = transaction.getJSONObject("asset").getJSONObject("chat");
            String messageHex = chat.getString("message");
            String nonceHex = chat.getString("own_message");
            String senderPkHex = transaction.getString("senderPublicKey");

            byte[] messageBytes = hexToBytes(messageHex);
            byte[] nonceBytes = hexToBytes(nonceHex);
            byte[] senderPkBytes = hexToBytes(senderPkHex);
            byte[] mySkBytes = readPrivateKeyBytes();

            if (mySkBytes == null || messageBytes == null || nonceBytes == null || senderPkBytes == null) {
                return null;
            }

            LazySodiumAndroid sodium = new LazySodiumAndroid(new SodiumAndroid());

            byte[] curve25519Pk = new byte[Sign.CURVE25519_PUBLICKEYBYTES];
            int pkResult = sodium.getSodium().crypto_sign_ed25519_pk_to_curve25519(curve25519Pk, senderPkBytes);
            if (pkResult != 0) {
                Log.w(TAG, "Failed to convert sender public key to Curve25519");
                return null;
            }

            byte[] curve25519Sk = new byte[Sign.CURVE25519_SECRETKEYBYTES];
            int skResult = sodium.getSodium().crypto_sign_ed25519_sk_to_curve25519(curve25519Sk, mySkBytes);
            if (skResult != 0) {
                Log.w(TAG, "Failed to convert private key to Curve25519");
                return null;
            }

            byte[] decrypted = new byte[messageBytes.length - Box.MACBYTES];
            int boxResult = sodium.getSodium().crypto_box_open_easy(
                    decrypted, messageBytes, messageBytes.length, nonceBytes, curve25519Pk, curve25519Sk
            );
            if (boxResult != 0) {
                Log.w(TAG, "Message decryption failed");
                return null;
            }

            return new String(decrypted, StandardCharsets.UTF_8);

        } catch (Exception e) {
            Log.e(TAG, "Exception during decryption", e);
            return null;
        }
    }

    // ─── Notification text formatting ─────────────────────────────────────────

    private String formatNotificationText(String txnData) {
        try {
            JSONObject transaction = new JSONObject(txnData);
            int transactionType = transaction.optInt("type", -1);
            long transactionAmount = transaction.optLong("amount", 0);

            if (transactionType == 0) {
                return formatADMTransfer(transactionAmount);
            }

            if (transactionType == 8) {
                if (transactionAmount > 0) {
                    return formatADMTransferWithComment(transactionAmount);
                }
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
            JSONObject asset = transaction.optJSONObject("asset");
            if (asset == null) {
                return "New message";
            }
            JSONObject chat = asset.optJSONObject("chat");
            if (chat == null) {
                return "New message";
            }

            int chatType = chat.optInt("type", 1);

            if (chatType == 2) {
                return "sent you crypto";
            }

            // chatType == 1: attempt decryption
            String decrypted = decryptMessage(transaction);
            if (decrypted != null && !decrypted.isEmpty()) {
                return decrypted;
            }

            return "New message";

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

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static byte[] hexToBytes(String hex) {
        if (hex == null || hex.length() % 2 != 0) {
            return null;
        }
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
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
            android.app.ActivityManager activityManager =
                    (android.app.ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
            java.util.List<android.app.ActivityManager.RunningAppProcessInfo> appProcesses =
                    activityManager.getRunningAppProcesses();
            if (appProcesses == null) {
                return false;
            }
            String packageName = getPackageName();
            for (android.app.ActivityManager.RunningAppProcessInfo appProcess : appProcesses) {
                if (appProcess.processName.equals(packageName)) {
                    return appProcess.importance ==
                            android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND;
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    private String extractTransactionId(String txnData) {
        try {
            return new JSONObject(txnData).optString("id", null);
        } catch (Exception e) {
            return extractFieldFromJson(txnData, "\"id\":\"", 6);
        }
    }

    private String extractSenderId(String txnData) {
        try {
            return new JSONObject(txnData).optString("senderId", null);
        } catch (Exception e) {
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

    private boolean isSignalMessage(String txnData) {
        try {
            JSONObject transaction = new JSONObject(txnData);
            if (transaction.has("asset") && transaction.getJSONObject("asset").has("chat")) {
                return transaction.getJSONObject("asset").getJSONObject("chat").optInt("type", -1) == 3;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking for signal message", e);
        }
        return false;
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
    }
}