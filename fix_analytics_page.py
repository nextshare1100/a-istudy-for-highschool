#!/usr/bin/env python3
import re

# ファイルを読み込む
with open('app/(dashboard)/analytics/page.tsx', 'r') as f:
    content = f.read()

# 1. setStats(null) を setStats(mockStats) に置換
content = content.replace('setStats(null)', 'setStats(mockStats)')

# 2. const data = await response.json() の後の処理を改善
old_pattern = r'const data = await response\.json\(\)\s*\n\s*setStats\(data\)'
new_replacement = '''const result = await response.json()
        
        // APIレスポンスの形式に応じて適切に設定
        if (result.success && result.data) {
          setStats(result.data)
        } else {
          // エラー時はモックデータを使用
          console.warn('APIからのデータ取得に失敗したため、モックデータを使用します')
          setStats(mockStats)
        }'''

content = re.sub(old_pattern, new_replacement, content)

# 3. localStorage.getItem('token') の後に || '' を追加（nullを防ぐ）
content = content.replace("localStorage.getItem('token')`", "localStorage.getItem('token') || ''`")

# ファイルを書き戻す
with open('app/(dashboard)/analytics/page.tsx', 'w') as f:
    f.write(content)

print("✅ 修正が完了しました")
