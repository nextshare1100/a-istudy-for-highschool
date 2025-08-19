'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscriptionStatus } from '@/components/subscription/subscription-status';
import { PaymentMethod } from '@/components/subscription/payment-method';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { billingService } from '@/lib/services/billing-service';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function BillingSettingsPage() {
  const { user } = useAuthStore();
  
  const { data: invoices } = useQuery({
    queryKey: ['invoices', user?.uid],
    queryFn: () => billingService.getInvoices(user!.uid),
    enabled: !!user,
  });
  
  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const url = await billingService.getInvoiceDownloadUrl(invoiceId);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };
  
  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">請求と支払い</h1>
        <p className="text-muted-foreground mt-2">
          サブスクリプションと支払い方法を管理します
        </p>
      </div>
      
      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscription">サブスクリプション</TabsTrigger>
          <TabsTrigger value="payment">支払い方法</TabsTrigger>
          <TabsTrigger value="invoices">請求履歴</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscription">
          <SubscriptionStatus />
        </TabsContent>
        
        <TabsContent value="payment">
          <PaymentMethod />
        </TabsContent>
        
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>請求履歴</CardTitle>
              <CardDescription>
                過去の請求書をダウンロードできます
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {invoices && invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {format(invoice.created.toDate(), 'yyyy年M月分', { locale: ja })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ¥{invoice.amount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        ダウンロード
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  請求履歴はありません
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}