'use client';

import React, { useState } from 'react';
import SchemaBuilder from './SchemaBuilder';

export default function SchemaButton() {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsBuilderOpen(true)}
        className="fixed bottom-24 right-36 z-10 bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        title="Database Schema Builder"
      >
        <i className="fas fa-database"></i>
      </button>
      
      <SchemaBuilder 
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
      />
    </>
  );
}