// components/qr-scanner.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { QrCode, Upload, Camera, X, CheckCircle2, CreditCard } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface QRScannerProps {
  onScan: (code: string) => void;
  onProceedToPayment?: (code: string) => void; // 決済画面へ進む際のコールバック
}

export function QRScanner({ onScan, onProceedToPayment }: QRScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    return () => {
      stopCamera();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        
        // ビデオの準備ができたらスキャン開始
        videoRef.current.onloadedmetadata = () => {
          setIsScanning(true);
          scanQRCode();
        };
      }
    } catch (error) {
      console.error('カメラの起動に失敗しました:', error);
      toast({
        title: 'エラー',
        description: 'カメラの使用許可が必要です',
        variant: 'destructive',
      });
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleCodeScanned = (code: string) => {
    setScannedCode(code);
    setIsOpen(false); // QRスキャナーダイアログを閉じる
    stopCamera();
    
    // 成功ダイアログを表示
    setShowSuccessDialog(true);
    
    // 2秒後に成功ダイアログを閉じて決済案内ダイアログを表示
    setTimeout(() => {
      setShowSuccessDialog(false);
      setShowPaymentDialog(true);
    }, 2000);
  };

  const handleProceedToPayment = () => {
    setShowPaymentDialog(false);
    // 親コンポーネントに通知
    if (onProceedToPayment) {
      onProceedToPayment(scannedCode);
    } else {
      onScan(scannedCode);
    }
  };

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // jsQRライブラリを使用する場合（要インストール: npm install jsqr）
      // import jsQR from 'jsqr';
      // const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      // デモ用：実際の実装では上記のjsQRを使用
      const mockDetectQR = () => {
        // ランダムに成功をシミュレート（実際は削除）
        if (Math.random() > 0.98) {
          return { data: 'STUDYTRACKER2024' };
        }
        return null;
      };
      
      const code = mockDetectQR();
      
      if (code && code.data) {
        // URLからコードを抽出
        let extractedCode = code.data;
        try {
          const url = new URL(code.data);
          const codeParam = url.searchParams.get('code');
          if (codeParam) {
            extractedCode = codeParam;
          }
        } catch {
          // URLでない場合はそのまま使用
        }
        
        handleCodeScanned(extractedCode);
        return;
      }
    } catch (error) {
      console.error('QRコード読み取りエラー:', error);
    }

    // 次のフレームをスキャン
    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
    }
  };

  const handleClose = () => {
    stopCamera();
    setIsOpen(false);
    setIsScanning(false);
  };

  // ファイルアップロードによるQRコード読み取り
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const image = new Image();
      const reader = new FileReader();

      reader.onload = async (e) => {
        image.src = e.target?.result as string;
        
        image.onload = async () => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) return;

          canvas.width = image.width;
          canvas.height = image.height;
          context.drawImage(image, 0, 0);

          try {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // jsQRライブラリを使用する場合
            // import jsQR from 'jsqr';
            // const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            // デモ用の仮実装
            const mockCode = { data: 'STUDYTRACKER2024' };
            
            if (mockCode && mockCode.data) {
              // URLからコードを抽出
              let extractedCode = mockCode.data;
              try {
                const url = new URL(mockCode.data);
                const codeParam = url.searchParams.get('code');
                if (codeParam) {
                  extractedCode = codeParam;
                }
              } catch {
                // URLでない場合はそのまま使用
              }
              
              handleCodeScanned(extractedCode);
            } else {
              toast({
                title: 'エラー',
                description: 'QRコードが見つかりませんでした',
                variant: 'destructive',
              });
            }
          } catch (error) {
            toast({
              title: 'エラー',
              description: 'QRコードの読み取りに失敗しました',
              variant: 'destructive',
            });
          }
        };
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('QRコード読み取りエラー:', error);
      toast({
        title: 'エラー',
        description: 'ファイルの処理に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      // ファイル入力をリセット
      event.target.value = '';
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
        QRコード
      </Button>

      {/* QRスキャナーダイアログ */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              QRコードを読み取る
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="camera" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera">カメラで読み取る</TabsTrigger>
              <TabsTrigger value="upload">画像をアップロード</TabsTrigger>
            </TabsList>
            
            <TabsContent value="camera" className="space-y-4">
              {hasPermission ? (
                <>
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    
                    {/* スキャンフレーム */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-48 h-48">
                        <div className="absolute inset-0 border-2 border-white/50 rounded-lg" />
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                        
                        {isScanning && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-0.5 bg-primary animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-center text-sm text-muted-foreground">
                    {isScanning ? 'QRコードを枠内に収めてください' : 'カメラを起動中...'}
                  </p>
                </>
              ) : (
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    カメラでQRコードを読み取ります
                  </p>
                  <Button onClick={startCamera} className="gap-2">
                    <Camera className="w-4 h-4" />
                    カメラを起動
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="upload" className="space-y-4">
              <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="qr-upload"
                  disabled={isProcessing}
                />
                <label htmlFor="qr-upload" className="cursor-pointer">
                  <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    QRコードの画像をアップロード
                  </p>
                  <Button
                    variant="outline"
                    disabled={isProcessing}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('qr-upload')?.click();
                    }}
                  >
                    {isProcessing ? '処理中...' : '画像を選択'}
                  </Button>
                </label>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="text-xs text-muted-foreground text-center">
            ※ HTTPSでない場合、カメラ機能が制限される場合があります
          </div>
        </DialogContent>
      </Dialog>

      {/* スキャン成功ダイアログ */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              キャンペーンコードを確認しました
            </DialogTitle>
            <DialogDescription className="pt-2">
              コード: <span className="font-medium">{scannedCode}</span>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* 決済案内ダイアログ */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-blue-600" />
              お支払い情報の登録
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <p>
                キャンペーンコード「<span className="font-medium">{scannedCode}</span>」が適用されました。
              </p>
              <p className="font-medium text-foreground">
                来月から請求を開始するために、クレジットカードの入力をお願いいたします。
              </p>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm space-y-2">
                <p className="text-blue-800 dark:text-blue-200 flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">✓</span>
                  初月無料期間中は課金されません
                </p>
                <p className="text-blue-800 dark:text-blue-200 flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">✓</span>
                  いつでもキャンセル可能です
                </p>
                <p className="text-blue-800 dark:text-blue-200 flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">✓</span>
                  SSL暗号化により安全に保護されています
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentDialog(false);
                setScannedCode('');
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleProceedToPayment}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              クレジットカード情報を入力する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}