# RAXA Accuracy Enhancement TODO
Status: ✅ Approved by user - No extra features, enhance existing

## Breakdown of Implementation Steps:

### Phase 1: Dataset Enhancement (Priority 1) ✅
- [✅] **Add 12 new diseases** to `backend/data/diseaseDataset.js` (Now 37 total)
  * Chikungunya (Tier 1)
  * Jaundice (Tier 2) 
  * Chickenpox (Tier 2)
  * Measles (Tier 2)
  * Mumps (Tier 2)
  * Urinary Tract Infection (Tier 2)
  * Kidney Stones (Tier 2)
  * Appendicitis (Tier 1)
  * Peptic Ulcer (Tier 2)
  * Sinusitis (Tier 3)
  * Conjunctivitis (Tier 3)
  * Gastroenteritis (Tier 2)
- [ ] **Add symptom synonyms** (3-5 per symptom across dataset)
- [ ] **Add duration/severity modifiers** to scoring logic

### Phase 2: Prediction Engine Improvements (Priority 2) ✅
- [✅] **Enhanced fuzzy matching** with synonyms (`backend/services/symptomSynonyms.js` + integration)
- [✅] **Severity multiplier** (severe=1.5x, mild=0.7x keyword detection)
- [✅] **Duration weighting** (chronic=1.3x keyword detection)
- [✅] **Cross-symptom boost** (+8 for 3+ core matches, new categories: Very Likely)

### Phase 3: Confidence & Config Updates (Priority 3) 
- [✅] **Expand REQUIRED_FIELDS** in `backend/services/confidenceEngine.js` to 37 diseases (tiered by priority)
- [ ] **Add configs** for new diseases in `backend/config/diagnosticConfig.js`
- [ ] **Update SymptomAnalysisService.js** (minor)

### Phase 4: Testing & Validation (Priority 4)
- [ ] Run `node backend/test-recalculate.js`
- [ ] Execute `test-api.ps1`
- [ ] Manual validation with sample symptom sets
- [ ] Update this TODO with completion status

**Current Progress: Phase 1 ✅ Dataset (37 diseases), Phase 2 ✅ Prediction Engine enhanced**

**Next Action: Phase 3 - ConfidenceEngine & diagnosticConfig updates**

