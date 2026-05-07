"use client";

import SymptomPredictor from '../components/SymptomPredictor';
import Navbar from '../components/Navbar';
import ErrorBoundary from '../components/ErrorBoundary';

export default function SymptomCheckPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      <ErrorBoundary>
        <SymptomPredictor />
      </ErrorBoundary>
    </div>
  );
}

