// 法人契約
export interface CorporateContract {
  corporateId: string;
  qrCode: string;
  companyName: string;
  maxUsers: number;
  currentUsers: number;
  contractEndDate: string;
  status: 'active' | 'expired';
  contactEmail?: string | null;
  notes?: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

// 法人契約ユーザー
export interface CorporateUser {
  userId: string;
  corporateId: string;
  companyName: string;
  activatedAt: string;
  previousSubscriptionStatus: string;
}

// 法人契約検証レスポンス
export interface CorporateVerifyResponse {
  success: boolean;
  contract: {
    corporateId: string;
    companyName: string;
    contractEndDate: string;
    remainingSlots: number;
  };
  user: {
    email: string;
    currentSubscriptionStatus: string;
  };
}

// 法人契約作成レスポンス
export interface CorporateCreateResponse {
  success: boolean;
  contract: {
    corporateId: string;
    qrCode: string;
    companyName: string;
    maxUsers: number;
    currentUsers: number;
    contractEndDate: string;
    status: 'active';
    qrCodeDataUrl: string;
    qrCodeUrl: string;
  };
}

// 法人契約アクティベートレスポンス
export interface CorporateActivateResponse {
  success: boolean;
  message: string;
  contract: {
    success: boolean;
    corporateId: string;
    companyName: string;
    contractEndDate: string;
  };
}