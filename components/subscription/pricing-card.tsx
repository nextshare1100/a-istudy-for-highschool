'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { SUBSCRIPTION_TIERS } from '@/lib/stripe/client';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  tier: 'free' | 'premium';
  billing?: 'monthly' | 'yearly';
  onSelectPlan?: (priceType: 'monthly' | 'yearly') => void;
  currentPlan?: boolean;
}

export function PricingCard({ 
  tier, 
  billing = 'monthly', 
  onSelectPlan,
  currentPlan = false 
}: PricingCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const plan = SUBSCRIPTION_TIERS[tier];
  
  const price = tier === 'free' 
    ? 0 
    : billing === 'monthly' 
      ? plan.monthlyPrice 
      : plan.yearlyPrice;
  
  const yearlyDiscount = tier === 'premium' && billing === 'yearly'
    ? Math.round((1 - (plan.yearlyPrice / 12) / plan.monthlyPrice) * 100)
    : 0;
  
  const handleSelectPlan = () => {
    if (!user) {
      router.push('/login?redirect=/subscription/register');
      return;
    }
    
    if (tier === 'free') {
      // フリープランは何もしない
      return;
    }
    
    onSelectPlan?.(billing);
  };
  
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all",
      tier === 'premium' && "border-primary shadow-lg scale-105",
      currentPlan && "ring-2 ring-primary"
    )}>
      {tier === 'premium' && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-none rounded-bl-lg">おすすめ</Badge>
        </div>
      )}
      
      {yearlyDiscount > 0 && (
        <div className="absolute top-0 left-0">
          <Badge variant="destructive" className="rounded-none rounded-br-lg">
            {yearlyDiscount}% OFF
          </Badge>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>
          {tier === 'free' 
            ? '基本的な学習機能'
            : 'すべての機能を無制限に利用'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="text-4xl font-bold">
            {price === 0 ? '無料' : `¥${price.toLocaleString()}`}
          </div>
          {tier === 'premium' && (
            <div className="text-sm text-muted-foreground">
              {billing === 'monthly' ? '月額' : '年額'}
              {billing === 'yearly' && ` (月あたり¥${Math.round(price / 12).toLocaleString()})`}
            </div>
          )}
        </div>
        
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
          
          {tier === 'free' && (
            <>
              <li className="flex items-start gap-2 text-muted-foreground">
                <X className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">AI による詳細分析</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <X className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">カスタム学習スケジュール</span>
              </li>
            </>
          )}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          variant={tier === 'premium' ? 'default' : 'outline'}
          onClick={handleSelectPlan}
          disabled={currentPlan}
        >
          {currentPlan 
            ? '現在のプラン' 
            : tier === 'free' 
              ? 'フリープランを継続' 
              : 'プレミアムプランを始める'
          }
        </Button>
      </CardFooter>
    </Card>
  );
}