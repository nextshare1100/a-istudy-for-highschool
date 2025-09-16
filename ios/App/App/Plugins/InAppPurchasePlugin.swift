// ios/App/App/Plugins/InAppPurchasePlugin.swift
import Capacitor
import StoreKit

@objc(InAppPurchasePlugin)
public class InAppPurchasePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "InAppPurchasePlugin"
    public let jsName = "InAppPurchase"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initialize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkStatus", returnType: CAPPluginReturnPromise)
    ]
    
    private let productId = "com.nextshare.a_istudy.monthly"
    
    @objc func initialize(_ call: CAPPluginCall) {
        Task {
            do {
                // トランザクション監視を開始
                await self.listenForTransactions()
                call.resolve(["success": true])
            } catch {
                call.reject("Initialization failed", error.localizedDescription)
            }
        }
    }
    
    @objc func getProducts(_ call: CAPPluginCall) {
        Task {
            do {
                let products = try await Product.products(for: [productId])
                
                if let product = products.first {
                    let productData: [String: Any] = [
                        "id": product.id,
                        "displayName": product.displayName,
                        "description": product.description,
                        "price": product.price,
                        "displayPrice": product.displayPrice,
                        "subscription": [
                            "subscriptionPeriod": [
                                "unit": product.subscription?.subscriptionPeriod.unit.rawValue ?? "",
                                "value": product.subscription?.subscriptionPeriod.value ?? 0
                            ],
                            "introductoryOffer": product.subscription?.introductoryOffer != nil ? [
                                "price": product.subscription?.introductoryOffer?.price ?? 0,
                                "displayPrice": product.subscription?.introductoryOffer?.displayPrice ?? "",
                                "period": [
                                    "unit": product.subscription?.introductoryOffer?.period.unit.rawValue ?? "",
                                    "value": product.subscription?.introductoryOffer?.period.value ?? 0
                                ],
                                "periodCount": product.subscription?.introductoryOffer?.periodCount ?? 0
                            ] : nil
                        ]
                    ]
                    
                    call.resolve(["products": [productData]])
                } else {
                    call.resolve(["products": []])
                }
            } catch {
                call.reject("Failed to fetch products", error.localizedDescription)
            }
        }
    }
    
    @objc func purchase(_ call: CAPPluginCall) {
        Task {
            do {
                let products = try await Product.products(for: [productId])
                
                guard let product = products.first else {
                    call.reject("Product not found")
                    return
                }
                
                let result = try await product.purchase()
                
                switch result {
                case .success(let verification):
                    // トランザクションを検証
                    switch verification {
                    case .verified(let transaction):
                        // トランザクションを終了
                        await transaction.finish()
                        
                        // サブスクリプション状態を確認
                        let status = await self.checkSubscriptionStatus()
                        
                        call.resolve([
                            "success": true,
                            "transactionId": transaction.id,
                            "originalTransactionId": transaction.originalID,
                            "purchaseDate": ISO8601DateFormatter().string(from: transaction.purchaseDate),
                            "expirationDate": transaction.expirationDate != nil ? ISO8601DateFormatter().string(from: transaction.expirationDate!) : nil,
                            "isActive": status.isActive,
                            "isInTrialPeriod": status.isInTrialPeriod
                        ])
                        
                    case .unverified(_, let error):
                        call.reject("Transaction verification failed", error.localizedDescription)
                    }
                    
                case .userCancelled:
                    call.resolve(["success": false, "cancelled": true])
                    
                case .pending:
                    call.resolve(["success": false, "pending": true])
                    
                @unknown default:
                    call.reject("Unknown purchase result")
                }
            } catch {
                call.reject("Purchase failed", error.localizedDescription)
            }
        }
    }
    
    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                // 同期を実行
                try await AppStore.sync()
                
                // 現在のエンタイトルメントを確認
                var restoredPurchases: [[String: Any]] = []
                
                for await result in Transaction.currentEntitlements {
                    if case .verified(let transaction) = result {
                        restoredPurchases.append([
                            "transactionId": transaction.id,
                            "originalTransactionId": transaction.originalID,
                            "productId": transaction.productID,
                            "purchaseDate": ISO8601DateFormatter().string(from: transaction.purchaseDate),
                            "expirationDate": transaction.expirationDate != nil ? ISO8601DateFormatter().string(from: transaction.expirationDate!) : nil
                        ])
                    }
                }
                
                let status = await self.checkSubscriptionStatus()
                
                call.resolve([
                    "success": true,
                    "purchases": restoredPurchases,
                    "isActive": status.isActive,
                    "expirationDate": status.expirationDate != nil ? ISO8601DateFormatter().string(from: status.expirationDate!) : nil
                ])
                
            } catch {
                call.reject("Restore failed", error.localizedDescription)
            }
        }
    }
    
    @objc func checkStatus(_ call: CAPPluginCall) {
        Task {
            let status = await self.checkSubscriptionStatus()
            
            call.resolve([
                "isActive": status.isActive,
                "isInTrialPeriod": status.isInTrialPeriod,
                "expirationDate": status.expirationDate != nil ? ISO8601DateFormatter().string(from: status.expirationDate!) : nil,
                "willRenew": status.willRenew
            ])
        }
    }
    
    // ヘルパーメソッド
    private func listenForTransactions() async {
        // トランザクションアップデートを監視
        for await result in Transaction.updates {
            if case .verified(let transaction) = result {
                // トランザクションを処理
                await transaction.finish()
                
                // JSイベントを発火
                self.notifyListeners("transactionUpdated", data: [
                    "transactionId": transaction.id,
                    "productId": transaction.productID,
                    "purchaseDate": ISO8601DateFormatter().string(from: transaction.purchaseDate)
                ])
            }
        }
    }
    
    private func checkSubscriptionStatus() async -> (isActive: Bool, isInTrialPeriod: Bool, expirationDate: Date?, willRenew: Bool) {
        var isActive = false
        var isInTrialPeriod = false
        var expirationDate: Date?
        var willRenew = false
        
        // 現在のエンタイトルメントを確認
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result,
               transaction.productID == productId {
                isActive = true
                expirationDate = transaction.expirationDate
                
                // トライアル期間かどうかを確認
                if let originalTransaction = try? await Transaction.latest(for: transaction.originalID) {
                    if case .verified(let original) = originalTransaction {
                        isInTrialPeriod = original.offerType == .introductory
                    }
                }
                
                // 自動更新状態を確認
                if let status = try? await transaction.latestTransaction?.subscriptionStatus {
                    willRenew = status.state == .subscribed
                }
                
                break
            }
        }
        
        return (isActive, isInTrialPeriod, expirationDate, willRenew)
    }
}