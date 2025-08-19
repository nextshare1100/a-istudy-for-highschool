'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Loader2, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { paymentMethodService } from '@/lib/services/payment-method-service';

export function PaymentMethod() {
  const { user } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { data: paymentMethods, isLoading, refetch } = useQuery({
    queryKey: ['payment-methods', user?.uid],
    queryFn: () => paymentMethodService.getPaymentMethods(user!.uid),
    enabled: !!user,
  });
  
  const handleAddPaymentMethod = async () => {
    setIsUpdating(true);
    try {
      // Stripe Elementsを使用した支払い方法の追加
      // この実装は簡略化されています
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
      });
      
      const { clientSecret } = await response.json();
      
      // Stripe Elementsのモーダルを開く（実装省略）
      console.log('Setup intent created:', clientSecret);
      
      // 成功後にリフェッチ
      await refetch();
    } catch (error) {
      console.error('Failed to add payment method:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleSetDefault = async (paymentMethodId: string) => {
    setIsUpdating(true);
    try {
      await paymentMethodService.setDefaultPaymentMethod(user!.uid, paymentMethodId);
      await refetch();
    } catch (error) {
      console.error('Failed to set default payment method:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleRemove = async (paymentMethodId: string) => {
    if (!confirm('この支払い方法を削除してもよろしいですか？')) {
      return;
    }
    
    setIsUpdating(true);
    try {
      await paymentMethodService.removePaymentMethod(user!.uid, paymentMethodId);
      await refetch();
    } catch (error) {
      console.error('Failed to remove payment method:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>支払い方法</CardTitle>
        <CardDescription>
          登録されている支払い方法を管理します
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {paymentMethods && paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        •••• {method.last4}
                      </span>
                      {method.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          デフォルト
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      有効期限: {method.expMonth}/{method.expYear}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={isUpdating}
                    >
                      デフォルトに設定
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(method.id)}
                    disabled={isUpdating || method.isDefault}
                  >
                    削除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            支払い方法が登録されていません
          </div>
        )}
        
        <Button
          onClick={handleAddPaymentMethod}
          disabled={isUpdating}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          支払い方法を追加
        </Button>
      </CardContent>
    </Card>
  );
}