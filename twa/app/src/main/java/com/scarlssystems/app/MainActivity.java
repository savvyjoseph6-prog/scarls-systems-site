package com.scarlssystems.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends Activity {
    private static final String HOME = "https://scarlssystems.com/app/";
    private WebView web;
    private ValueCallback<Uri[]> filePicker;
    private static final int PICK = 77;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        web = new WebView(this);
        web.setBackgroundColor(0xFF050506);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setUserAgentString(s.getUserAgentString() + " SCARLSApp/1");
        web.addJavascriptInterface(new Bridge(), "ScarlsNative");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                String host = u.getHost() == null ? "" : u.getHost();
                if (host.equals("scarlssystems.com") || host.endsWith(".scarlssystems.com")) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { /* nothing can open it */ }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onJsConfirm(WebView v, String url, String message, JsResult r) {
                new AlertDialog.Builder(MainActivity.this).setMessage(message).setCancelable(false)
                        .setPositiveButton("OK", (d, w) -> r.confirm()).setNegativeButton("Cancel", (d, w) -> r.cancel()).show();
                return true;
            }
            @Override
            public boolean onJsAlert(WebView v, String url, String message, JsResult r) {
                new AlertDialog.Builder(MainActivity.this).setMessage(message).setCancelable(false)
                        .setPositiveButton("OK", (d, w) -> r.confirm()).show();
                return true;
            }
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (filePicker != null) filePicker.onReceiveValue(null);
                filePicker = cb;
                try { startActivityForResult(p.createIntent(), PICK); } catch (Exception e) { filePicker = null; return false; }
                return true;
            }
        });

        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
        }
        FirebaseMessaging.getInstance().getToken().addOnSuccessListener(t -> prefs().edit().putString("fcm", t).apply());

        web.loadUrl(targetFrom(getIntent()));
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        web.loadUrl(targetFrom(intent));
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == PICK && filePicker != null) {
            filePicker.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
            filePicker = null;
            return;
        }
        super.onActivityResult(req, res, data);
    }

    private String targetFrom(Intent i) {
        Uri d = i == null ? null : i.getData();
        if (d != null && "scarlssystems.com".equals(d.getHost()) && d.getPath() != null && d.getPath().startsWith("/app/")) return d.toString();
        return HOME;
    }

    private SharedPreferences prefs() { return getSharedPreferences("scarls", MODE_PRIVATE); }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    /** Lets the web app ask for this phone's Firebase token. */
    private class Bridge {
        @JavascriptInterface
        public String getToken() { return prefs().getString("fcm", ""); }

        @JavascriptInterface
        public int getVersion() {
            try {
                android.content.pm.PackageInfo i = getPackageManager().getPackageInfo(getPackageName(), 0);
                return Build.VERSION.SDK_INT >= 28 ? (int) i.getLongVersionCode() : i.versionCode;
            } catch (Exception e) { return 0; }
        }
    }
}
