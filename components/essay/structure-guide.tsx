import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Circle } from 'lucide-react';
import { useState } from 'react';

interface StructureSection {
  title: string;
  description: string;
  points: string[];
  wordCount: string;
}

const STRUCTURE_TEMPLATES: Record<string, StructureSection[]> = {
  basic: [
    {
      title: '序論',
      description: '問題提起と論文の方向性を示す',
      points: [
        'テーマの背景説明',
        '問題提起',
        '論文の構成予告'
      ],
      wordCount: '全体の20-25%'
    },
    {
      title: '本論',
      description: '具体的な論証を展開',
      points: [
        '主張の根拠提示',
        '具体例の説明',
        '反対意見への言及',
        '自説の優位性'
      ],
      wordCount: '全体の60-65%'
    },
    {
      title: '結論',
      description: '主張をまとめ、展望を示す',
      points: [
        '論点の整理',
        '主張の再確認',
        '今後の展望'
      ],
      wordCount: '全体の15-20%'
    }
  ],
  argumentative: [
    {
      title: '問題提起',
      description: '議論の焦点を明確化',
      points: [
        '現状の問題点',
        '議論の必要性'
      ],
      wordCount: '全体の15%'
    },
    {
      title: '自説の展開',
      description: '自分の立場と根拠',
      points: [
        '立場の表明',
        '根拠1と具体例',
        '根拠2と具体例'
      ],
      wordCount: '全体の40%'
    },
    {
      title: '反対意見の検討',
      description: '対立する見解への対応',
      points: [
        '反対意見の紹介',
        '反対意見の問題点',
        '自説の優位性'
      ],
      wordCount: '全体の30%'
    },
    {
      title: '結論',
      description: '総合的な判断',
      points: [
        '論点整理',
        '最終的な主張'
      ],
      wordCount: '全体の15%'
    }
  ]
};

export function StructureGuide() {
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [activeTemplate, setActiveTemplate] = useState('basic');

  const toggleSection = (sectionTitle: string) => {
    setCompletedSections(prev =>
      prev.includes(sectionTitle)
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>構成ガイド</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">基本構成</TabsTrigger>
            <TabsTrigger value="argumentative">論証型</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTemplate} className="space-y-4 mt-4">
            {STRUCTURE_TEMPLATES[activeTemplate].map((section, index) => (
              <div
                key={section.title}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {index + 1}
                    </span>
                    {section.title}
                  </h4>
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {completedSections.includes(section.title) ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                <p className="text-sm text-gray-600">{section.description}</p>
                
                <ul className="text-sm space-y-1">
                  {section.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                
                <p className="text-xs text-gray-500">
                  推奨文字数: {section.wordCount}
                </p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}