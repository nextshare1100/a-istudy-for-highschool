import { useState, useCallback, useRef } from 'react';
import { GraphData } from '@/types/essay';

interface GraphInteraction {
  hoveredDataPoint: { x: number; y: number; value: any } | null;
  selectedDataPoints: any[];
  zoom: number;
  pan: { x: number; y: number };
}

export function useGraphInteraction(graphData: GraphData) {
  const [interaction, setInteraction] = useState<GraphInteraction>({
    hoveredDataPoint: null,
    selectedDataPoints: [],
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
  
  const chartRef = useRef<any>(null);

  const handleHover = useCallback((event: any, elements: any[]) => {
    if (elements.length > 0) {
      const element = elements[0];
      const datasetIndex = element.datasetIndex;
      const index = element.index;
      const dataset = graphData.data.datasets[datasetIndex];
      const value = dataset.data[index];
      const label = graphData.data.labels[index];
      
      setInteraction(prev => ({
        ...prev,
        hoveredDataPoint: {
          x: index,
          y: datasetIndex,
          value: { label, value, datasetLabel: dataset.label },
        },
      }));
    } else {
      setInteraction(prev => ({
        ...prev,
        hoveredDataPoint: null,
      }));
    }
  }, [graphData]);

  const handleClick = useCallback((event: any, elements: any[]) => {
    if (elements.length > 0) {
      const element = elements[0];
      const datasetIndex = element.datasetIndex;
      const index = element.index;
      const dataset = graphData.data.datasets[datasetIndex];
      const value = dataset.data[index];
      const label = graphData.data.labels[index];
      
      const dataPoint = { label, value, datasetLabel: dataset.label };
      
      setInteraction(prev => {
        const isSelected = prev.selectedDataPoints.some(
          point => point.label === label && point.datasetLabel === dataset.label
        );
        
        return {
          ...prev,
          selectedDataPoints: isSelected
            ? prev.selectedDataPoints.filter(
                point => !(point.label === label && point.datasetLabel === dataset.label)
              )
            : [...prev.selectedDataPoints, dataPoint],
        };
      });
    }
  }, [graphData]);

  const resetInteraction = useCallback(() => {
    setInteraction({
      hoveredDataPoint: null,
      selectedDataPoints: [],
      zoom: 1,
      pan: { x: 0, y: 0 },
    });
  }, []);

  const exportGraphData = useCallback(() => {
    const exportData = {
      graphInfo: {
        title: graphData.title,
        type: graphData.type,
        source: graphData.source,
      },
      data: graphData.data,
      selectedPoints: interaction.selectedDataPoints,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graph-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [graphData, interaction.selectedDataPoints]);

  return {
    interaction,
    chartRef,
    handleHover,
    handleClick,
    resetInteraction,
    exportGraphData,
  };
}