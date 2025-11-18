/**
 * Type definitions for react-native-iap
 * 
 * These types define the interface for the react-native-iap library
 * until it is installed and provides its own types.
 */

export interface Product {
  readonly productId: string;
  readonly title: string;
  readonly description: string;
  readonly price: string;
  readonly currency?: string;
  readonly localizedPrice?: string;
  readonly type?: 'inapp' | 'iap' | 'subscription';
}

export interface Subscription extends Product {
  readonly subscriptionPeriodNumberIOS?: string;
  readonly subscriptionPeriodUnitIOS?: string;
  readonly introductoryPrice?: string;
  readonly introductoryPricePaymentModeIOS?: string;
  readonly introductoryPriceNumberOfPeriodsIOS?: string;
  readonly introductoryPriceSubscriptionPeriodIOS?: string;
}

export interface Purchase {
  readonly productId: string;
  readonly transactionId?: string;
  readonly transactionDate?: string;
  readonly transactionReceipt?: string;
  readonly purchaseToken?: string;
  readonly dataAndroid?: string;
  readonly signatureAndroid?: string;
  readonly autoRenewingAndroid?: boolean;
  readonly purchaseStateAndroid?: number;
  readonly originalTransactionDateIOS?: string;
  readonly originalTransactionIdentifierIOS?: string;
}

export interface PurchaseError {
  readonly code: string;
  readonly message: string;
  readonly debugMessage?: string;
}

export interface GetProductsParams {
  readonly skus: readonly string[];
}

export interface GetSubscriptionsParams {
  readonly skus: readonly string[];
}

export interface RequestPurchaseParams {
  readonly sku: string;
  readonly obfuscatedAccountIdAndroid?: string;
  readonly obfuscatedProfileIdAndroid?: string;
}

export interface RequestSubscriptionParams {
  readonly sku: string;
  readonly obfuscatedAccountIdAndroid?: string;
  readonly obfuscatedProfileIdAndroid?: string;
}

export interface FinishTransactionParams {
  readonly purchase: Purchase;
}

export type PurchaseUpdateListener = (purchase: Purchase) => void;
export type PurchaseErrorListener = (error: PurchaseError) => void;

export interface EmitterSubscription {
  readonly remove: () => void;
}

export interface ReactNativeIAP {
  readonly initConnection: () => Promise<void>;
  readonly endConnection: () => Promise<void>;
  readonly getProducts: (params: GetProductsParams) => Promise<readonly Product[]>;
  readonly getSubscriptions: (params: GetSubscriptionsParams) => Promise<readonly Subscription[]>;
  readonly requestPurchase: (params: RequestPurchaseParams) => Promise<Purchase>;
  readonly requestSubscription: (params: RequestSubscriptionParams) => Promise<Purchase>;
  readonly getAvailablePurchases: () => Promise<readonly Purchase[]>;
  readonly finishTransaction: (params: FinishTransactionParams) => Promise<void>;
  readonly acknowledgePurchaseAndroid: (purchaseToken: string) => Promise<void>;
  readonly consumePurchaseAndroid: (purchaseToken: string) => Promise<void>;
  readonly purchaseUpdatedListener: (listener: PurchaseUpdateListener) => EmitterSubscription;
  readonly purchaseErrorListener: (listener: PurchaseErrorListener) => EmitterSubscription;
}
