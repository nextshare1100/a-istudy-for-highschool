// ========== 基本的なサブスクリプション型 ==========

export interface UserSubscription {
  userId: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  status: 'free' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  priceId?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  description: string;
  invoiceUrl?: string;
  createdAt: Date;
}

export interface SubscriptionFeatures {
  aiQuestionsLimit: number | 'unlimited';
  detailedAnalytics: boolean;
  personalizedPlan: boolean;
  prioritySupport: boolean;
  offlineAccess: boolean;
}

export const FREE_FEATURES: SubscriptionFeatures = {
  aiQuestionsLimit: 10,
  detailedAnalytics: false,
  personalizedPlan: false,
  prioritySupport: false,
  offlineAccess: false,
};

export const PREMIUM_FEATURES: SubscriptionFeatures = {
  aiQuestionsLimit: 'unlimited',
  detailedAnalytics: true,
  personalizedPlan: true,
  prioritySupport: true,
  offlineAccess: true,
};

// ========== キャンペーンコード関連 ==========

export interface CampaignCode {
  id?: string;
  code: string;
  type: 'first_month_free' | 'three_months_free' | 'percentage' | 'fixed_amount';
  stripeCouponId: string;
  stripePromotionCodeId?: string;
  discountValue?: number; // percentageやfixed_amountの場合の値
  validUntil: Date;
  usageLimit: number;
  usedCount: number;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignUsage {
  id?: string;
  userId: string;
  campaignCodeId: string;
  code: string;
  appliedAt: Date;
  subscriptionId?: string;
}

// ========== 法人契約関連 ==========

export interface SchoolContract {
  id?: string;
  schoolId: string;
  schoolName: string;
  schoolNameKana?: string;
  emailDomains: string[]; // 例: ["school.ac.jp"]
  contractType: 'full' | 'partial';
  startDate: Date;
  endDate?: Date; // 契約終了日（オプション）
  monthlyFee: number;
  studentCount?: number; // 想定学生数
  actualStudentCount?: number; // 実際の利用学生数
  status: 'active' | 'pending' | 'canceled' | 'expired';
  adminIds: string[]; // 管理者ユーザーID
  features?: SchoolContractFeatures;
  billingInfo?: BillingInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchoolContractFeatures {
  maxStudents?: number;
  customBranding?: boolean;
  dedicatedSupport?: boolean;
  dataExport?: boolean;
  ssoEnabled?: boolean;
}

export interface BillingInfo {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  taxId?: string;
}

// ========== 移行・通知関連 ==========

export interface MigrationNotification {
  id?: string;
  userId: string;
  type: 'school_contract_available' | 'migration_complete' | 'migration_reminder';
  title: string;
  message: string;
  schoolName: string;
  schoolId: string;
  actions?: {
    label: string;
    action: 'migrate' | 'keep' | 'dismiss';
    url?: string;
  }[];
  read: boolean;
  readAt?: Date;
  expiresAt?: Date; // 通知の有効期限
  createdAt: Date;
}

export interface UserMigrationStatus {
  userId: string;
  previousStatus: 'personal' | 'free';
  currentStatus: 'school' | 'personal';
  schoolId?: string;
  migratedAt?: Date;
  declinedAt?: Date;
  refundAmount?: number;
  originalSubscriptionId?: string;
}

// ========== 拡張ユーザー型 ==========

export interface ExtendedUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  
  // サブスクリプション関連
  stripeCustomerId?: string;
  subscriptionStatus?: UserSubscription['status'];
  subscriptionId?: string;
  
  // 学校関連
  schoolId?: string;
  accountStatus: 'personal' | 'school' | 'migrating';
  
  // キャンペーン関連
  appliedCampaignCode?: string;
  appliedCampaignAt?: Date;
  
  // 移行関連
  originalSubscriptionId?: string;
  migratedAt?: Date;
  declinedSchoolMigration?: boolean;
  declinedSchoolId?: string;
  declinedAt?: Date;
  
  // システム情報
  role?: 'user' | 'admin' | 'school_admin';
  createdAt: Date;
  updatedAt: Date;
}

// ========== Stripe関連の型 ==========

export interface StripeCustomer {
  id: string;
  userId: string;
  email: string;
  name?: string;
  defaultPaymentMethodId?: string;
  currency?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  customerId: string;
  type: 'card';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    funding?: string;
  };
  isDefault: boolean;
  createdAt: Date;
}

// ========== API関連の型 ==========

export interface CheckoutSessionParams {
  userId: string;
  userEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  campaignCode?: string;
  metadata?: Record<string, string>;
}

export interface PortalSessionParams {
  customerId: string;
  returnUrl: string;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  trialPeriodDays?: number;
  couponId?: string;
  metadata?: Record<string, string>;
}

// ========== レスポンス型 ==========

export interface SubscriptionStatusResponse {
  isActive: boolean;
  status: UserSubscription['status'];
  features: SubscriptionFeatures;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: Date;
  schoolAccount?: {
    schoolName: string;
    schoolId: string;
  };
}

export interface ValidationResponse<T = any> {
  isValid: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export interface MigrationResponse {
  success: boolean;
  refundAmount?: number;
  error?: string;
  nextSteps?: string[];
}

// ========== 定数 ==========

export const SUBSCRIPTION_STATUSES = {
  FREE: 'free',
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
} as const;

export const ACCOUNT_STATUSES = {
  PERSONAL: 'personal',
  SCHOOL: 'school',
  MIGRATING: 'migrating',
} as const;

export const CAMPAIGN_TYPES = {
  FIRST_MONTH_FREE: 'first_month_free',
  THREE_MONTHS_FREE: 'three_months_free',
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
} as const;

// ========== ユーティリティ型 ==========

export type SubscriptionStatus = UserSubscription['status'];
export type AccountStatus = ExtendedUser['accountStatus'];
export type CampaignType = CampaignCode['type'];

// 機能制限チェック用のヘルパー型
export type FeatureKey = keyof SubscriptionFeatures;

// サブスクリプション状態の判定ヘルパー
export const isSubscriptionActive = (status: SubscriptionStatus): boolean => {
  return status === 'active' || status === 'trialing';
};

export const isPaidSubscription = (status: SubscriptionStatus): boolean => {
  return status === 'active';
};

export const canUseFeature = (
  features: SubscriptionFeatures,
  featureKey: FeatureKey
): boolean => {
  const value = features[featureKey];
  return value === true || value === 'unlimited' || (typeof value === 'number' && value > 0);
};