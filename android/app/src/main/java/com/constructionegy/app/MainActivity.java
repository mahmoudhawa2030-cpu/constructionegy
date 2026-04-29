package com.constructionegy.app;

import android.Manifest;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import androidx.core.app.ActivityCompat;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocationAccuracyPlugin.class);
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        // Request CAMERA permission up-front so getUserMedia works in the WebView
        ActivityCompat.requestPermissions(this, new String[]{ Manifest.permission.CAMERA }, 1001);

        // Disable pinch-to-zoom at the native WebView level (viewport meta is ignored by Capacitor WebView)
        getBridge().getWebView().getSettings().setSupportZoom(false);
        getBridge().getWebView().getSettings().setBuiltInZoomControls(false);
        getBridge().getWebView().getSettings().setDisplayZoomControls(false);

        // Allow the WebView to use camera via getUserMedia
        getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);

        // Extend BridgeWebChromeClient (not plain WebChromeClient) so HTML file inputs
        // and Capacitor camera both work. Plain WebChromeClient breaks <input type="file">.
        getBridge().getWebView().setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });
    }
}
