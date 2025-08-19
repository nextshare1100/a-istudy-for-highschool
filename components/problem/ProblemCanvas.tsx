// components/problem/ProblemCanvas.tsx
'use client'

export default function ProblemCanvas({ 
  onSave 
}: { 
  onSave?: (imageData: string) => void 
}) {
  return (
    <div className="border rounded p-4">
      <p>Canvas placeholder</p>
    </div>
  )
}