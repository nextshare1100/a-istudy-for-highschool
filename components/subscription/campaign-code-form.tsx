'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, Tag } from 'lucide-react';
import { campaignService } from '@/lib/services/campaign-service';

interface CampaignCodeFormProps {
  onValidated: (code: string, campaign: any) => void;
}

export function CampaignCodeForm({ onValidated }: CampaignCodeFormProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const handleValidate = async () => {
    if (!code.trim()) return;
    
    setIsValidating(true);
    setError(null);
    
    try {
      const result = await campaignService.validateCode(code);
      
      if (result.isValid && result.campaign) {
        setStatus('valid');
        onValidated(code, result.campaign);
      } else {
        setStatus('invalid');
        setError(result.error || '無効なキャンペーンコードです');
      }
    } catch (error) {
      setStatus('invalid');
      setError('エラーが発生しました');
    } finally {
      setIsValidating(false);
    }
  };
  
  return (
    <div className="space-y-4 p-6 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Tag className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">キャンペーンコード</h3>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="campaign-code">お持ちの方はこちらに入力</Label>
        <div className="flex gap-2">
          <Input
            id="campaign-code"
            type="text"
            placeholder="例: LAUNCH2024"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={isValidating || status === 'valid'}
            className={status === 'valid' ? 'border-green-500' : ''}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleValidate}
            disabled={!code.trim() || isValidating || status === 'valid'}
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === 'valid' ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              '適用'
            )}
          </Button>
        </div>
      </div>
      
      {status === 'valid' && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-800">
            キャンペーンコードが適用されました！初月無料でご利用いただけます。
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}