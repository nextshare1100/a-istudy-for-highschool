'use client';

import { useState } from 'react';
import { PricingCard } from '@/components/subscription/pricing-card';
import { CampaignCodeForm } from '@/components/subscription/campaign-code-form';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [appliedCampaign, setAppliedCampaign] = useState<any>(null);
  
  const handleCheckout = async () => {
    if (!user) {
      router.push('/login?redirect=/pricing');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // キャンペーンコードがある場合は専用APIを使用
      const endpoint = appliedCampaign 
        ? '/api/stripe/checkout-campaign'
        : '/api/stripe/checkout';
      
      const body = appliedCampaign
        ? { campaignCode: appliedCampaign.code }
        : { priceType: selectedPlan };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCampaignValidated = (code: string, campaign: any) => {
    setAppliedCampaign({ code, ...campaign });
  };
  
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">料金プラン</h1>
        <p className="text-xl text-muted-foreground">
          あなたに最適なプランをお選びください
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* キャンペーンコード入力 */}
        <CampaignCodeForm onValidated={handleCampaignValidated} />
        
        {/* 料金プラン */}
        <div className="grid md:grid-cols-2 gap-6">
          <PricingCard tier="free" />
          <PricingCard 
            tier="premium" 
            billing={selectedPlan}
            onSelectPlan={setSelectedPlan}
          />
        </div>
        
        {/* チェックアウトボタン */}
        {appliedCampaign && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={handleCheckout}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : null}
              初月無料で始める
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              クレジットカード登録が必要ですが、初月は課金されません
            </p>
          </div>
        )}
      </div>
    </div>
  );
}