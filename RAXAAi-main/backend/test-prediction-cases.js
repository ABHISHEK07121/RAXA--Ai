const { predictDiseases } = require('./services/predictionEngine');

function topDisease(result) {
  return result?.predictions?.[0]?.disease;
}

function runCase(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(`  ${error.message}`);
    process.exitCode = 1;
  }
}

runCase('fever + chills => Malaria top', () => {
  const result = predictDiseases(['fever', 'chills', 'sweating']);
  if (topDisease(result) !== 'Malaria') {
    throw new Error(`Expected Malaria, got ${topDisease(result) || 'none'}`);
  }
});

runCase('fever + rash => Dengue top', () => {
  const result = predictDiseases(['fever', 'rash', 'joint pain'], { platelet_count: 130000 });
  if (topDisease(result) !== 'Dengue') {
    throw new Error(`Expected Dengue, got ${topDisease(result) || 'none'}`);
  }
});

runCase('cough + weight_loss => Tuberculosis top', () => {
  const result = predictDiseases(['chronic cough', 'weight loss', 'night sweats']);
  if (topDisease(result) !== 'Tuberculosis') {
    throw new Error(`Expected Tuberculosis, got ${topDisease(result) || 'none'}`);
  }
});

runCase('fatigue + thirst => Diabetes top', () => {
  const result = predictDiseases(['fatigue', 'increased thirst', 'frequent urination'], { blood_glucose: 220 });
  if (topDisease(result) !== 'Type 2 Diabetes') {
    throw new Error(`Expected Type 2 Diabetes, got ${topDisease(result) || 'none'}`);
  }
});

runCase('breathlessness + chest pain => emergency triggered', () => {
  const result = predictDiseases(['severe breathlessness', 'chest pain']);
  if (!result?.emergency?.isEmergency) {
    throw new Error('Expected emergency response');
  }
});

if (!process.exitCode) {
  console.log('All prediction smoke tests passed.');
}
