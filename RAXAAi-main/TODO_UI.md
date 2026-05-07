# UI Enhancement for Normal Users - Easy Symptom Detection
**Goal:** Make symptom input intuitive for non-medical users (no typing, visual selection)

## Current UI Issues:
- Free text input → typos/misspelling ("fever" vs "feverr")
- No guidance for common symptoms
- Severity not captured easily

## Planned Changes:

### 1. SymptomPredictor.tsx ✅ Main changes
```
- Add COMMON_SYMPTOMS chips (20 most common, categorized)
- Symptom severity selector (Mild/Normal/Severe) per symptom
- Auto-suggest dropdown as user types
- Hindi symptom names (from locales)
- One-tap "Common Cold" / "Fever" quick sets
```

### 2. New Component: SymptomChipSelector.tsx
```
- Popular symptoms grid (fever, cough, headache, etc.)
- Category tabs (Fever, Pain, Digestive, Respiratory)
- Drag-drop to selected area
```

### 3. Visual Improvements
```
- Color-coded severity badges on chips
- Progress indicator (symptoms selected)
- "Quick Check" button for 3-click diagnosis
```

## Implementation Status:
- [ ] Create SymptomChipSelector.tsx
- [ ] Update SymptomPredictor.tsx input → chips
- [ ] Add severity slider per symptom
- [ ] Test Hindi symptoms
- [ ] Mobile responsive grid

**Next: Create common symptoms list from dataset + synonyms**

