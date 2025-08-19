'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, QrCode } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import QrScanner from 'qr-scanner';

interface QRCodeScannerProps {
  onScan: (code: string) => void;
}

export function QRCodeScanner({ onScan }: QRCodeScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // QrScanner の静的設定
    QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js';
    
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (isOpen && videoRef.current && !scannerRef.current) {
      initializeScanner();
    }
    
    return () => {
      if (!isOpen) {
        stopScanner();
      }
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    if (!videoRef.current) return;

    try {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => handleScanResult(result),
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
          preferredCamera: 'environment',
        }
      );

      scannerRef.current = scanner;
      
      await scanner.start();
      setHasPermission(true);
      setIsScanning(true);
    } catch (error) {
      console.error('スキャナーの初期化に失敗しました:', error);
      toast({
        title: 'エラー',
        description: 'カメラの使用許可が必要です',
        variant: 'destructive',
      });
      setHasPermission(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanResult = (result: QrScanner.ScanResult) => {
    const data = result.data;
    
    // URLからキャンペーンコードを抽出
    let campaignCode = '';
    
    try {
      // URLパターンの場合
      if (data.includes('http')) {
        const url = new URL(data);
        const params = new URLSearchParams(url.search);
        campaignCode = params.get('code') || '';
      } else {
        // 直接コードの場合
        campaignCode = data.trim().toUpperCase();
      }
      
      // AISTUDYTRIAL コードの検証
      if (campaignCode && campaignCode.match(/^[A-Z0-9]+$/)) {
        onScan(campaignCode);
        toast({
          title: '読み取り成功',
          description: `コード: ${campaignCode}`,
        });
        handleClose();
      } else {
        toast({
          title: 'エラー',
          description: '有効なキャンペーンコードが見つかりませんでした',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('QRコード解析エラー:', error);
      toast({
        title: 'エラー',
        description: 'QRコードの読み取りに失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    stopScanner();
    setIsOpen(false);
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      if (videoRef.current) {
        initializeScanner();
      }
    } catch (error) {
      console.error('カメラ許可エラー:', error);
      toast({
        title: 'エラー',
        description: 'カメラの使用が許可されませんでした',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <QrCode className="w-4 h-4" />
        QRコードで読み取る
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              QRコードをスキャン
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {hasPermission ? (
              <>
                <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* スキャンフレーム */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-2 border-white/50 rounded-lg">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                    </div>
                  </div>
                </div>
                
                {isScanning && (
                  <p className="text-center text-sm text-muted-foreground animate-pulse">
                    QRコードを枠内に収めてください
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  カメラの使用許可が必要です
                </p>
                <Button onClick={requestCameraPermission}>
                  カメラを起動
                </Button>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground text-center">
              キャンペーンコード「AISTUDYTRIAL」が含まれたQRコードを読み取ってください
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}