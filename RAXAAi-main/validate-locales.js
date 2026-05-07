#!/usr/bin/env node
/**
 * RAXA i18n Validator - Compare en.json vs hi.json
 * Checks: missing keys, extra keys, empty values
 * Run: node validate-locales.js
 */

const fs = require('fs');
const path = require('path');

const EN_PATH = path.join('frontend', 'app', 'locales', 'en.json');
const HI_PATH = path.join('frontend', 'app', 'locales', 'hi.json');

function loadJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`❌ Failed to load ${filePath}:`, err.message);
    process.exit(1);
  }
}

function validateLocales(en, hi) {
  const report = {
    total_en_keys: Object.keys(en).length,
    total_hi_keys: Object.keys(hi).length,
    missing_in_hi: [],
    extra_in_hi: [],
    empty_in_hi: [],
    summary: '✅'
  };

  // Check missing keys in HI
  Object.keys(en).forEach(key => {
    if (!hi.hasOwnProperty(key)) {
      report.missing_in_hi.push(key);
    } else if (!hi[key] || hi[key].trim() === '') {
      report.empty_in_hi.push(key);
    }
  });

  // Check extra keys in HI
  Object.keys(hi).forEach(key => {
    if (!en.hasOwnProperty(key)) {
      report.extra_in_hi.push(key);
    }
  });

  // Generate report
  if (report.missing_in_hi.length > 0) {
    report.summary = `❌ ${report.missing_in_hi.length} missing keys`;
  } else if (report.empty_in_hi.length > 0) {
    report.summary = `⚠️ ${report.empty_in_hi.length} empty translations`;
  } else if (report.extra_in_hi.length > 0) {
    report.summary = `ℹ️ ${report.extra_in_hi.length} extra keys`;
  }

  return report;
}

function printReport(report) {
  console.log('📊 RAXA i18n Validation Report');
  console.log('='.repeat(50));
  console.log(`EN keys: ${report.total_en_keys}`);
  console.log(`HI keys: ${report.total_hi_keys}`);
  console.log(`Status: ${report.summary}`);
  console.log('');

  if (report.missing_in_hi.length > 0) {
    console.log('❌ Missing in hi.json:');
    report.missing_in_hi.forEach(key => console.log(`  - ${key}`));
    console.log('');
  }

  if (report.empty_in_hi.length > 0) {
    console.log('⚠️ Empty in hi.json:');
    report.empty_in_hi.forEach(key => console.log(`  - ${key}: "${hi[key] || 'undefined'}"`));
    console.log('');
  }

  if (report.extra_in_hi.length > 0) {
    console.log('ℹ️ Extra in hi.json:');
    report.extra_in_hi.forEach(key => console.log(`  - ${key}`));
    console.log('');
  }

  if (report.missing_in_hi.length === 0 && report.empty_in_hi.length === 0) {
    console.log('🎉 All translations complete! Hindi i18n is solid.');
  }
}

// Main execution
console.log('🔍 Validating RAXA locales...\n');
const en = loadJSON(EN_PATH);
const hi = loadJSON(HI_PATH);

const report = validateLocales(en, hi);
printReport(report);

process.exit(report.missing_in_hi.length > 0 ? 1 : 0);
