import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, TrendingUp, BarChart3, Clock } from 'lucide-react';
import { EssayTheme } from '@/types/essay';

interface ThemeTabsProps {
  themes: EssayTheme[];
  onSelectTheme: (theme: EssayTheme) => void;
}

const CATEGORIES = [
  { id: 'general', label: '一般教養', icon: BookOpen },
  { id: 'faculty_specific', label: '学部別', icon: BookOpen },
  { id: 'current_affairs', label: '時事問題', icon: TrendingUp },
  { id: 'graph_analysis', label: 'グラフ分析', icon: BarChart3 },
];

export function ThemeTabs({ themes, onSelectTheme }: ThemeTabsProps) {
  const themesByCategory = themes.reduce((acc, theme) => {
    if (!acc[theme.category]) {
      acc[theme.category] = [];
    }
    acc[theme.category].push(theme);
    return acc;
  }, {} as Record<string, EssayTheme[]>);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <TabsTrigger key={category.id} value={category.id}>
              <Icon className="mr-2 h-4 w-4" />
              {category.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {CATEGORIES.map((category) => (
        <TabsContent key={category.id} value={category.id} className="space-y-4">
          {themesByCategory[category.id]?.map((theme) => (
            <Card
              key={theme.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectTheme(theme)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{theme.title}</CardTitle>
                    <CardDescription>{theme.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getDifficultyColor(theme.difficulty)}>
                      {theme.difficulty === 'easy' && '初級'}
                      {theme.difficulty === 'medium' && '中級'}
                      {theme.difficulty === 'hard' && '上級'}
                    </Badge>
                    {theme.graphData && (
                      <Badge variant="secondary">
                        <BarChart3 className="mr-1 h-3 w-3" />
                        グラフ
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {theme.requirements.timeLimit}分
                    </span>
                    <span>
                      {theme.requirements.minWords}〜{theme.requirements.maxWords}字
                    </span>
                  </div>
                  {theme.faculty && (
                    <div className="flex gap-2">
                      {theme.faculty.map((f) => (
                        <Badge key={f} variant="outline" className="text-xs">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      ))}
    </Tabs>
  );
}