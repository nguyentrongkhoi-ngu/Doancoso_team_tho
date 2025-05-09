'use client';

import React from 'react';

const SimpleLoader = () => {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="animate-pulse flex space-x-2">
        <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
        <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
        <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
      </div>
    </div>
  );
};

export default SimpleLoader; 