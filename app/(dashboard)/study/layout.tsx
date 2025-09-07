import { ErrorBoundary } from '@/components/error-boundary';

export default function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
