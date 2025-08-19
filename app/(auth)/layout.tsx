import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'A-IStudy - 高校生向けAI学習プラットフォーム',
  description: 'AIがあなたの学習を最適化。志望校合格への最短ルートを提供します。',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}