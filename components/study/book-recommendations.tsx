'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ShoppingCart, Star } from 'lucide-react';
import { generateAffiliateLink } from '@/lib/amazon/affiliate';
import Image from 'next/image';

interface Book {
  id: string;
  asin: string;
  title: string;
  author: string;
  publisher: string;
  price: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  description: string;
  tags: string[];
  subject: string;
  difficulty: string;
}

interface BookRecommendationsProps {
  subject: string;
  topic?: string;
  weakPoints?: string[];
}

export function BookRecommendations({ 
  subject, 
  topic, 
  weakPoints 
}: BookRecommendationsProps) {
  // 実際の実装では、APIから推薦書籍を取得
  const recommendedBooks: Book[] = [
    {
      id: '1',
      asin: 'B08XYJ3F5V',
      title: 'チャート式 数学II+B',
      author: 'チャート研究所',
      publisher: '数研出版',
      price: 2200,
      imageUrl: '/images/books/chart-math.jpg',
      rating: 4.5,
      reviewCount: 128,
      description: '定番の参考書。基礎から応用まで幅広くカバー。',
      tags: ['定番', '網羅的', '演習問題豊富'],
      subject: '数学',
      difficulty: 'standard',
    },
    // ... 他の書籍
  ];
  
  const handlePurchase = (book: Book) => {
    // アフィリエイトリンクを生成
   const affiliateUrl = generateAffiliateLink(book.asin);
   
   // Google Analytics イベントを送信
   if (typeof window !== 'undefined' && window.gtag) {
     window.gtag('event', 'click', {
       event_category: 'affiliate',
       event_label: book.title,
       value: book.price,
     });
   }
   
   // 新しいタブで開く
   window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
 };
 
 const getDifficultyBadge = (difficulty: string) => {
   const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
     basic: { label: '基礎', variant: 'secondary' },
     standard: { label: '標準', variant: 'default' },
     advanced: { label: '応用', variant: 'destructive' },
   };
   
   const { label, variant } = variants[difficulty] || variants.standard;
   return <Badge variant={variant}>{label}</Badge>;
 };
 
 return (
   <Card>
     <CardHeader>
       <CardTitle>おすすめ参考書・問題集</CardTitle>
       <CardDescription>
         {topic ? `${subject}の${topic}` : subject}の学習に最適な教材をご紹介します
       </CardDescription>
     </CardHeader>
     
     <CardContent className="space-y-6">
       {recommendedBooks.map((book) => (
         <div key={book.id} className="flex gap-4 p-4 border rounded-lg">
           <div className="relative w-24 h-32 flex-shrink-0">
             <Image
               src={book.imageUrl}
               alt={book.title}
               fill
               className="object-cover rounded"
             />
           </div>
           
           <div className="flex-grow space-y-2">
             <div>
               <h4 className="font-semibold text-lg leading-tight">
                 {book.title}
               </h4>
               <p className="text-sm text-muted-foreground">
                 {book.author} / {book.publisher}
               </p>
             </div>
             
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-1">
                 <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                 <span className="text-sm font-medium">{book.rating}</span>
                 <span className="text-sm text-muted-foreground">
                   ({book.reviewCount}件)
                 </span>
               </div>
               {getDifficultyBadge(book.difficulty)}
             </div>
             
             <p className="text-sm text-muted-foreground line-clamp-2">
               {book.description}
             </p>
             
             <div className="flex flex-wrap gap-2">
               {book.tags.map((tag) => (
                 <Badge key={tag} variant="outline" className="text-xs">
                   {tag}
                 </Badge>
               ))}
             </div>
             
             <div className="flex items-center justify-between">
               <span className="text-lg font-bold">
                 ¥{book.price.toLocaleString()}
               </span>
               <Button
                 size="sm"
                 onClick={() => handlePurchase(book)}
                 className="gap-2"
               >
                 <ShoppingCart className="h-4 w-4" />
                 Amazonで購入
                 <ExternalLink className="h-3 w-3" />
               </Button>
             </div>
           </div>
         </div>
       ))}
       
       {weakPoints && weakPoints.length > 0 && (
         <Alert>
           <InfoIcon className="h-4 w-4" />
           <AlertDescription>
             <strong>あなたの弱点に基づいた推薦:</strong>
             <ul className="mt-2 space-y-1">
               {weakPoints.map((point, index) => (
                 <li key={index} className="text-sm">
                   • {point}の克服には上記の教材が効果的です
                 </li>
               ))}
             </ul>
           </AlertDescription>
         </Alert>
       )}
       
       <div className="text-center pt-4">
         <Button variant="outline" className="w-full">
           もっと見る
         </Button>
       </div>
     </CardContent>
   </Card>
 );
}