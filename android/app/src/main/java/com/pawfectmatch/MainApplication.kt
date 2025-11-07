package com.pawfectmatch

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost

class MainApplication : Application(), ReactApplication {
  private val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
    override fun getPackages(): List<ReactPackage> {
      val packages = PackageList(this).packages
      packages.add(KycPackage())
      return packages
    }

    override fun getJSMainModuleName(): String = "index"

    override fun isNewArchEnabled(): Boolean = false

    override fun isHermesEnabled(): Boolean = true
  }

  override fun getReactNativeHost(): ReactNativeHost = reactNativeHost

  override fun onCreate() {
    super.onCreate()
    DefaultNewArchitectureEntryPoint.load()
  }
}
