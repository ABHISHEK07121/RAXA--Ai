export type DiseaseCategory =
  | 'Infectious'
  | 'Chronic'
  | 'Lifestyle'
  | 'Hormonal'
  | 'Cardiovascular'
  | 'Neurological'
  | 'Metabolic'
  | 'Respiratory'
  | 'Musculoskeletal'
  | 'Bone';

export type DiseaseGroup = 'Common in India' | 'Chronic & Lifestyle' | 'Advanced Conditions';

export interface DiseaseCatalogItem {
  name: string;
  label: string;
  category: DiseaseCategory;
  priority: 1 | 2 | 3;
  group: DiseaseGroup;
}

export const DISEASE_CATALOG: DiseaseCatalogItem[] = [
  { name: 'Dengue', label: 'Dengue Fever', category: 'Infectious', priority: 1, group: 'Common in India' },
  { name: 'Malaria', label: 'Malaria', category: 'Infectious', priority: 1, group: 'Common in India' },
  { name: 'Typhoid', label: 'Typhoid Fever', category: 'Infectious', priority: 1, group: 'Common in India' },
  { name: 'Influenza', label: 'Influenza', category: 'Respiratory', priority: 1, group: 'Common in India' },
  { name: 'Tuberculosis', label: 'Tuberculosis', category: 'Infectious', priority: 1, group: 'Common in India' },
  { name: 'COVID-19', label: 'COVID-19', category: 'Infectious', priority: 1, group: 'Common in India' },
  { name: 'Hepatitis B', label: 'Hepatitis B', category: 'Infectious', priority: 1, group: 'Common in India' },

  { name: 'Type 2 Diabetes', label: 'Diabetes', category: 'Chronic', priority: 2, group: 'Chronic & Lifestyle' },
  { name: 'Hypertension', label: 'Hypertension', category: 'Chronic', priority: 2, group: 'Chronic & Lifestyle' },
  { name: 'Thyroid Disorder', label: 'Thyroid Disorder', category: 'Hormonal', priority: 2, group: 'Chronic & Lifestyle' },
  { name: 'Asthma', label: 'Asthma', category: 'Respiratory', priority: 2, group: 'Chronic & Lifestyle' },
  { name: 'Obesity', label: 'Obesity', category: 'Lifestyle', priority: 2, group: 'Chronic & Lifestyle' },
  { name: 'PCOS', label: 'PCOS', category: 'Hormonal', priority: 2, group: 'Chronic & Lifestyle' },
  { name: 'High Cholesterol', label: 'High Cholesterol', category: 'Metabolic', priority: 2, group: 'Chronic & Lifestyle' },
  { name: 'Heart Disease', label: 'Heart Disease', category: 'Cardiovascular', priority: 2, group: 'Chronic & Lifestyle' },
  { name: 'Coronary Artery Disease', label: 'Coronary Artery Disease', category: 'Cardiovascular', priority: 2, group: 'Chronic & Lifestyle' },
  { name: 'Pneumonia', label: 'Pneumonia', category: 'Respiratory', priority: 2, group: 'Chronic & Lifestyle' },
  { name: 'COPD', label: 'COPD', category: 'Respiratory', priority: 2, group: 'Chronic & Lifestyle' },

  { name: 'Stroke', label: 'Stroke', category: 'Cardiovascular', priority: 3, group: 'Advanced Conditions' },
  { name: 'Arrhythmia', label: 'Arrhythmia', category: 'Cardiovascular', priority: 3, group: 'Advanced Conditions' },
  { name: "Alzheimer's Disease", label: "Alzheimer's Disease", category: 'Neurological', priority: 3, group: 'Advanced Conditions' },
  { name: "Parkinson's Disease", label: "Parkinson's Disease", category: 'Neurological', priority: 3, group: 'Advanced Conditions' },
  { name: 'Osteoporosis', label: 'Osteoporosis', category: 'Bone', priority: 3, group: 'Advanced Conditions' },
  { name: 'Epilepsy', label: 'Epilepsy', category: 'Neurological', priority: 3, group: 'Advanced Conditions' },
  { name: 'Arthritis', label: 'Arthritis', category: 'Musculoskeletal', priority: 3, group: 'Advanced Conditions' },
];

export const DISEASE_GROUPS: DiseaseGroup[] = [
  'Common in India',
  'Chronic & Lifestyle',
  'Advanced Conditions',
];

const catalogByName = new Map(DISEASE_CATALOG.map((disease) => [disease.name.toLowerCase(), disease]));

export function getDiseaseCatalogItem(name: string): DiseaseCatalogItem {
  return catalogByName.get(name.toLowerCase()) ?? {
    name,
    label: name,
    category: 'Chronic',
    priority: 3,
    group: 'Advanced Conditions',
  };
}

export function sortDiseasesByPriority(diseases: DiseaseCatalogItem[]): DiseaseCatalogItem[] {
  return [...diseases].sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label));
}
