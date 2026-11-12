package com.scarlssystems.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class PushService extends FirebaseMessagingService {
    static final String CHANNEL = "scarls_updates";

    @Override
    public void onNewToken(String token) {
        getSharedPreferences("scarls", MODE_PRIVATE).edit().putString("fcm", token).apply();
    }

    @Override
    public void onMessageReceived(RemoteMessage msg) {
        Map<String, String> d = msg.getData();
        String title = d.get("title") != null ? d.get("title") : "SCARLS SYSTEMS";
        String body = d.get("body") != null ? d.get("body") : "";
        String url = d.get("url") != null ? d.get("url") : "/app/";
        String tag = d.get("tag") != null ? d.get("tag") : "scarls";
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Project updates", NotificationManager.IMPORTANCE_HIGH));
        }
        Intent open = new Intent(this, MainActivity.class).setAction(Intent.ACTION_VIEW)
                .setData(Uri.parse("https://scarlssystems.com" + (url.startsWith("/") ? url : "/app/")))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, tag.hashCode(), open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        b.setSmallIcon(R.drawable.ic_notif).setContentTitle(title).setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body)).setAutoCancel(true).setContentIntent(pi);
        nm.notify(tag, 1, b.build());
    }
}
