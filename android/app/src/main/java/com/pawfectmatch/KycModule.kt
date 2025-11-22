package com.pawfectmatch

import android.app.Activity
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.sumsub.sns.core.SNSMobileSDK
import com.sumsub.sns.core.SNSMobileSDK.Callback
import com.sumsub.sns.core.SNSMobileSDK.Environment
import com.sumsub.sns.core.SNSMobileSDK.Region
import com.sumsub.sns.core.data.StatusResult

@ReactModule(name = KycModule.NAME)
class KycModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context), ActivityEventListener {
  companion object {
    const val NAME = "KycModule"
    private const val REQUEST_CODE = 8077
    private const val LOG_TAG = "PetSparkKyc"
  }

  private var sdk: SNSMobileSDK? = null
  private var pendingLaunchPromise: Promise? = null

  init {
    context.addActivityEventListener(this)
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun configure(options: ReadableMap, promise: Promise) {
    val accessToken = options.getString("accessToken")
    if (accessToken.isNullOrBlank()) {
      promise.reject("ERR_INVALID_TOKEN", "accessToken is required to configure the KYC SDK")
      return
    }

    val region = options.getString("region") ?: "eu"
    val environmentName = options.getString("environment") ?: "production"
    val environment = when (environmentName.lowercase()) {
      "sandbox" -> Environment.SANDBOX
      "staging" -> Environment.STAGING
      else -> Environment.PRODUCTION
    }

    val selectedRegion = when (region.lowercase()) {
      "us" -> Region.US
      "ap" -> Region.APAC
      else -> Region.EU
    }

    sdk = SNSMobileSDK.Builder(context)
      .accessToken(accessToken)
      .environment(environment)
      .region(selectedRegion)
      .callback(object : Callback {
        override fun onStatusChanged(statusResult: StatusResult) {
          sendEvent("KycStatusChanged", statusResult.toWritableMap())
        }

        override fun onTokenExpired(onTokenRenewed: (String) -> Unit) {
          sendEvent("KycTokenExpired", Arguments.createMap())
        }

        override fun onError(error: Throwable) {
          Log.e(LOG_TAG, "KYC SDK error", error)
          sendEvent("KycError", Arguments.createMap().apply {
            putString("message", error.message ?: "Unknown error")
          })
        }
      })
      .build()

    promise.resolve(null)
  }

  @ReactMethod
  fun refreshAccessToken(token: String, promise: Promise) {
    val instance = sdk
    if (instance == null) {
      promise.reject("ERR_SDK_NOT_INITIALIZED", "Call configure() before refreshing tokens")
      return
    }

    if (token.isBlank()) {
      promise.reject("ERR_INVALID_TOKEN", "Token must be a non-empty string")
      return
    }

    instance.updateAccessToken(token)
    promise.resolve(null)
  }

  @ReactMethod
  fun launchVerification(flowId: String?, promise: Promise) {
    val currentActivity: Activity = currentActivity
      ?: run {
        promise.reject("ERR_NO_ACTIVITY", "No active activity to launch verification")
        return
      }

    val instance = sdk
    if (instance == null) {
      promise.reject("ERR_SDK_NOT_INITIALIZED", "Call configure() before launching verification")
      return
    }

    if (pendingLaunchPromise != null) {
      promise.reject("ERR_VERIFICATION_IN_PROGRESS", "Another verification session is already in progress")
      return
    }

    pendingLaunchPromise = promise

    instance.launch(currentActivity, REQUEST_CODE, flowId ?: "default")
  }

  @ReactMethod
  fun getLatestStatus(promise: Promise) {
    val instance = sdk
    if (instance == null) {
      promise.reject("ERR_SDK_NOT_INITIALIZED", "Call configure() before requesting status")
      return
    }

    instance.fetchStatus({ statusResult ->
      promise.resolve(statusResult.toWritableMap())
    }, { error ->
      Log.e(LOG_TAG, "Failed to fetch KYC status", error)
      promise.reject("ERR_STATUS", error.message, error)
    })
  }

  override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != REQUEST_CODE) {
      return
    }

    val promise = pendingLaunchPromise ?: return
    pendingLaunchPromise = null

    val resultMap = Arguments.createMap().apply {
      putInt("resultCode", resultCode)
    }

    if (resultCode == Activity.RESULT_OK) {
      resultMap.putString("status", "completed")
      promise.resolve(resultMap)
    } else if (resultCode == Activity.RESULT_CANCELED) {
      resultMap.putString("status", "cancelled")
      promise.resolve(resultMap)
    } else {
      val message = data?.getStringExtra("sns_error_message") ?: "Unknown KYC result"
      promise.reject("ERR_VERIFICATION_FAILED", message)
    }
  }

  override fun onNewIntent(intent: Intent?) = Unit

  private fun StatusResult.toWritableMap(): WritableMap {
    return Arguments.createMap().apply {
      putString("reviewStatus", reviewStatus.name.lowercase())
      putString("clientStatus", clientStatus.name.lowercase())
      putString("moderationStatus", moderationStatus.name.lowercase())
      putDouble("lastUpdated", updatedAt.time.toDouble())
    }
  }

  private fun sendEvent(event: String, params: WritableMap) {
    if (!context.hasActiveCatalystInstance()) {
      return
    }
    context
      .getJSModule(RCTDeviceEventEmitter::class.java)
      .emit(event, params)
  }

  @ReactMethod
  fun addListener(@Suppress("UNUSED_PARAMETER") eventName: String) {
    // Required for RN event emitter compatibility; listeners are managed on the JS side.
  }

  @ReactMethod
  fun removeListeners(@Suppress("UNUSED_PARAMETER") count: Int) {
    // Required for RN event emitter compatibility; no-op because listeners live in JS.
  }
}
