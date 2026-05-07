"use client";

import React from 'react';
import Navbar from '../components/Navbar';
import MultiDiseaseDetector from '../components/MultiDiseaseDetector';

export default function MultiDiseasePage() {
    return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
            <Navbar />
            <div className="pt-8">
                <MultiDiseaseDetector />
            </div>
        </div>
    );
}