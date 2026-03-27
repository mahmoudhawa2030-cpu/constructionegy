package com.constructionegy.app;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.LocationSettingsResponse;
import com.google.android.gms.location.Priority;
import com.google.android.gms.location.SettingsClient;
import com.google.android.gms.tasks.Task;

/**
 * Shows the Google Play system sheet (“Location accuracy” / Turn on) when high-accuracy location
 * is needed, matching the standard Android flow used by maps apps.
 */
@CapacitorPlugin(name = "LocationAccuracy", requestCodes = { LocationAccuracyPlugin.REQUEST_CHECK_SETTINGS })
public class LocationAccuracyPlugin extends Plugin {

    private static final String TAG = "LocationAccuracy";
    static final int REQUEST_CHECK_SETTINGS = 90330;

    @PluginMethod
    public void requestHighAccuracySheet(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No activity");
            return;
        }

        LocationRequest locationRequest =
                new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10_000L)
                        .setMinUpdateIntervalMillis(5_000L)
                        .build();

        LocationSettingsRequest.Builder builder = new LocationSettingsRequest.Builder()
                .addLocationRequest(locationRequest)
                .setAlwaysShow(true);

        SettingsClient client = LocationServices.getSettingsClient(activity);
        Task<LocationSettingsResponse> task = client.checkLocationSettings(builder.build());

        task.addOnSuccessListener(
                response -> {
                    JSObject ret = new JSObject();
                    ret.put("alreadySatisfied", true);
                    call.resolve(ret);
                });

        task.addOnFailureListener(
                e -> {
                    if (e instanceof ResolvableApiException) {
                        ResolvableApiException rae = (ResolvableApiException) e;
                        try {
                            saveCall(call);
                            getBridge().saveCall(call);
                            rae.startResolutionForResult(activity, REQUEST_CHECK_SETTINGS);
                        } catch (Exception ex) {
                            Log.e(TAG, "startResolutionForResult failed", ex);
                            call.reject("Cannot show location dialog", ex);
                        }
                    } else {
                        Log.e(TAG, "checkLocationSettings failed", e);
                        String msg = e.getMessage() != null ? e.getMessage() : "Location settings check failed";
                        call.reject(msg, e);
                    }
                });
    }

    @Override
    @Deprecated
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_CHECK_SETTINGS) {
            return;
        }
        PluginCall saved = getSavedCall();
        if (saved == null) {
            return;
        }
        JSObject ret = new JSObject();
        ret.put("userReturned", true);
        ret.put("ok", resultCode == Activity.RESULT_OK);
        saved.resolve(ret);
        saved.release(getBridge());
    }
}
