'use client'

import { Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type DateRange = 'today' | 'week' | 'month' | 'year' | 'custom'

interface DateRangePickerProps {
  value: DateRange
  onChange: (value: DateRange) => void
  onCustomRangeChange?: (range: { from: Date; to: Date }) => void
}

export function DateRangePicker({ value, onChange, onCustomRangeChange }: DateRangePickerProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <Calendar className="w-4 h-4 mr-2" />
        <SelectValue placeholder="期間を選択" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="today">今日</SelectItem>
        <SelectItem value="week">今週</SelectItem>
        <SelectItem value="month">今月</SelectItem>
        <SelectItem value="year">今年</SelectItem>
        <SelectItem value="custom">カスタム</SelectItem>
      </SelectContent>
    </Select>
  )
}