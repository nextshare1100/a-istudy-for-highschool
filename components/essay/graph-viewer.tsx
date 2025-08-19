import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraphData } from '@/types/essay';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface GraphViewerProps {
  graphData: GraphData;
  interactive?: boolean;
  showQuestions?: boolean;
}

export function GraphViewer({ 
  graphData, 
  interactive = true,
  showQuestions = true 
}: GraphViewerProps) {
  const chartRef = useRef<ChartJS>(null);

  const options: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: interactive ? 'index' : 'none',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: graphData.title,
        font: {
          size: 16,
        },
      },
      tooltip: {
        enabled: interactive,
      },
    },
    scales: graphData.type !== 'pie' ? {
      y: {
        beginAtZero: true,
      },
    } : undefined,
  };

  // グラフをダウンロード
  const downloadGraph = () => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.download = `graph-${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{graphData.title}</CardTitle>
          {interactive && (
            <button
              onClick={downloadGraph}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              グラフをダウンロード
            </button>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <Chart
              ref={chartRef}
              type={graphData.type}
              data={graphData.data}
              options={options}
            />
          </div>
          
          {graphData.source && (
            <p className="text-sm text-gray-500 mt-4">
              出典: {graphData.source}
            </p>
          )}
        </CardContent>
      </Card>

      {showQuestions && graphData.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>設問</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {graphData.questions.map((question, index) => (
                <li key={index} className="flex gap-2">
                  <span className="font-medium">{index + 1}.</span>
                  <span>{question}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}