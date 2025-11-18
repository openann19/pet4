/**
 * Type definitions for react-native-iap
 * These types are used when the package may not be installed or fully typed
 */

export interface IAPProduct {
  productId: string
  title: string
  description: string
  price: string
  currency?: string
  localizedPrice?: string
}

export interface IAPPurchase {
  productId: string
  transactionId: string
  transactionReceipt?: string
  purchaseToken?: string
  transactionDate?: number
}

export interface IAPModule {
  initConnection: () => Promise<void>
  endConnection: () => Promise<void>
  getProducts: (options: { skus: string[] }) => Promise<IAPProduct[]>
  getSubscriptions: (options: { skus: string[] }) => Promise<IAPProduct[]>
  requestSubscription: (options: {
    sku: string
    obfuscatedAccountIdAndroid?: string
    obfuscatedProfileIdAndroid?: string
  }) => Promise<IAPPurchase>
  requestPurchase: (options: {
    sku: string
    obfuscatedAccountIdAndroid?: string
    obfuscatedProfileIdAndroid?: string
  }) => Promise<IAPPurchase>
  getAvailablePurchases: () => Promise<IAPPurchase[]>
  acknowledgePurchaseAndroid: (token: string) => Promise<void>
  consumePurchaseAndroid: (token: string) => Promise<void>
  finishTransaction: (options: { purchase: IAPPurchase }) => Promise<void>
  purchaseUpdatedListener: (callback: (purchase: IAPPurchase) => void) => {
    remove: () => void
  }
  purchaseErrorListener: (callback: (error: { code: string; message: string }) => void) => {
    remove: () => void
  }
}

declare const reactNativeIap: IAPModule
export default reactNativeIap

