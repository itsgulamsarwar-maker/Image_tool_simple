
import React from 'react';

export const Spinner: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-base-200 bg-opacity-75 flex items-center justify-center z-10">
      <div className="w-12 h-12 border-4 border-t-brand-primary border-r-brand-primary border-b-brand-primary border-l-transparent rounded-full animate-spin"></div>
    </div>
  );
};
