"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Activity, Heart, Brain, Thermometer, ShieldAlert, Zap, Pill, Wind, Bone } from 'lucide-react';
import {
    DISEASE_GROUPS,
    DiseaseCatalogItem,
    DiseaseCategory,
    getDiseaseCatalogItem,
    sortDiseasesByPriority,
} from '../data/diseaseCatalog';

interface DiseaseSelectorProps {
    diseases: string[];
    selectedDisease: string;
    onSelect: (disease: string) => void;
}

const getDiseaseIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('heart') || n.includes('cardio') || n.includes('stroke') || n.includes('arrhythmia')) return <Heart className="h-6 w-6 text-rose-500" />;
    if (n.includes('diabetes') || n.includes('glucose')) return <Activity className="h-6 w-6 text-primary" />;
    if (n.includes('pneumonia') || n.includes('respiratory') || n.includes('asthma') || n.includes('copd') || n.includes('influenza')) return <Wind className="h-6 w-6 text-blue-500" />;
    if (n.includes('dengue') || n.includes('malaria') || n.includes('fever')) return <Thermometer className="h-6 w-6 text-orange-500" />;
    if (n.includes('parkinson') || n.includes('alzheimer') || n.includes('epilepsy')) return <Brain className="h-6 w-6 text-purple-500" />;
    if (n.includes('liver') || n.includes('hepatitis')) return <Pill className="h-6 w-6 text-amber-600" />;
    if (n.includes('osteoporosis') || n.includes('arthritis')) return <Bone className="h-6 w-6 text-cyan-700" />;
    return <Zap className="h-6 w-6 text-slate-400" />;
};

const categoryStyles: Record<DiseaseCategory, string> = {
    Infectious: 'bg-blue-50 text-blue-700 border border-blue-100',
    Chronic: 'bg-orange-50 text-orange-700 border border-orange-100',
    Lifestyle: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    Hormonal: 'bg-purple-50 text-purple-700 border border-purple-100',
    Cardiovascular: 'bg-red-50 text-red-700 border border-red-100',
    Neurological: 'bg-violet-50 text-violet-700 border border-violet-100',
    Metabolic: 'bg-teal-50 text-teal-700 border border-teal-100',
    Respiratory: 'bg-sky-50 text-sky-700 border border-sky-100',
    Musculoskeletal: 'bg-lime-50 text-lime-700 border border-lime-100',
    Bone: 'bg-cyan-50 text-cyan-700 border border-cyan-100',
};

const DiseaseSelector: React.FC<DiseaseSelectorProps> = ({ diseases, selectedDisease, onSelect }) => {
    const [search, setSearch] = useState('');

    const groupedDiseases = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        const filteredDiseases = sortDiseasesByPriority(
            (diseases || [])
                .map(getDiseaseCatalogItem)
                .filter((disease) => {
                    if (!normalizedSearch) return true;
                    return [
                        disease.name,
                        disease.label,
                        disease.category,
                        disease.group,
                    ].some((value) => value.toLowerCase().includes(normalizedSearch));
                })
        );

        return DISEASE_GROUPS.map((group) => ({
            group,
            diseases: filteredDiseases.filter((disease) => disease.group === group),
        })).filter((section) => section.diseases.length > 0);
    }, [diseases, search]);

    const filteredDiseaseCount = groupedDiseases.reduce((count, section) => count + section.diseases.length, 0);

    const renderDiseaseCard = (disease: DiseaseCatalogItem) => (
        <motion.button
            key={disease.name}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ translateY: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(disease.name)}
            className={`flex min-h-40 flex-col items-start p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${
                selectedDisease === disease.name
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md'
            }`}
        >
            {selectedDisease === disease.name && (
                <motion.div
                    layoutId="selected-ring"
                    className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary"
                />
            )}

            <div className={`mb-4 p-3 rounded-xl transition-colors ${
                selectedDisease === disease.name ? 'bg-white shadow-sm' : 'bg-slate-50 group-hover:bg-white'
            }`}>
                {getDiseaseIcon(disease.name)}
            </div>

            <h4 className="font-bold text-slate-900 mb-2 line-clamp-2">{disease.label}</h4>

            <div className="mt-auto flex flex-wrap gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryStyles[disease.category]}`}>
                    {disease.category}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                    P{disease.priority}
                </span>
            </div>
        </motion.button>
    );

    return (
        <div className="space-y-6">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Search for a disease or symptom..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="max-h-[500px] overflow-y-auto p-2 scrollbar-hide">
                <AnimatePresence mode="popLayout">
                    {groupedDiseases.map((section) => (
                        <motion.section
                            key={section.group}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mb-8 last:mb-0"
                        >
                            <div className="sticky top-0 z-10 mb-3 bg-slate-50/95 py-2 backdrop-blur">
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">{section.group}</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {section.diseases.map(renderDiseaseCard)}
                            </div>
                        </motion.section>
                    ))}
                </AnimatePresence>
            </div>
            
            {filteredDiseaseCount === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <ShieldAlert className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No diseases found matching your search.</p>
                </div>
            )}
        </div>
    );
};

export default DiseaseSelector;
