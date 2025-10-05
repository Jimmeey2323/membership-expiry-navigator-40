import React from 'react';
import { FilterProvider } from '@/contexts/FilterContext';
import Index from './Index';

const IndexWithFilters = () => {
  return (
    <FilterProvider>
      <Index />
    </FilterProvider>
  );
};

export default IndexWithFilters;