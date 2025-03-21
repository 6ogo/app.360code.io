'use client';

import React, { useState } from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';

export default function AnalyticsButton() {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsDashboardOpen(true)}
        className="fixed bottom-96 right-4 z-10 bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        title="Project Analytics"
      >
        <i className="fas fa-chart-bar"></i>
      </button>
      
      <AnalyticsDashboard 
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
      />
    </>
  );
}