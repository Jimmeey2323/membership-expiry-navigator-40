import { useEffect, useState, useRef } from 'react';

interface UseLazyRenderingProps {
  items: any[];
  batchSize?: number;
  delay?: number;
}

export const useLazyRendering = ({ 
  items, 
  batchSize = 25, 
  delay = 50 
}: UseLazyRenderingProps) => {
  const [renderedItems, setRenderedItems] = useState<any[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const currentBatch = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Reset when items change
    setRenderedItems([]);
    setIsRendering(true);
    currentBatch.current = 0;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const renderNextBatch = () => {
      const startIndex = currentBatch.current * batchSize;
      const endIndex = Math.min(startIndex + batchSize, items.length);
      
      if (startIndex >= items.length) {
        setIsRendering(false);
        return;
      }

      const nextBatch = items.slice(startIndex, endIndex);
      
      setRenderedItems(prev => [...prev, ...nextBatch]);
      currentBatch.current += 1;

      if (endIndex < items.length) {
        timeoutRef.current = setTimeout(renderNextBatch, delay);
      } else {
        setIsRendering(false);
      }
    };

    // Start rendering with a small delay to allow UI to update
    timeoutRef.current = setTimeout(renderNextBatch, 10);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [items, batchSize, delay]);

  return { renderedItems, isRendering };
};

export default useLazyRendering;