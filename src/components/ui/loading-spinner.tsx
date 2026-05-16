// src/components/ui/loading-spinner.tsx
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      <p className="ml-4 text-lg text-gray-700">ロード中...</p>
    </div>
  );
};

export default LoadingSpinner;
