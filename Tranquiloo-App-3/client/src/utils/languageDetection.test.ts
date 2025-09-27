import assert from 'node:assert/strict';
import { detectLanguage, validateLanguageConsistency } from './languageDetection';

const runTest = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    throw error;
  }
};

runTest('detects English sentence containing "son" as English', () => {
  const text =
    'She has a son from a previous relationship and wants advice about setting calmer, healthy boundaries for everyone.';
  const result = detectLanguage(text, { fallbackLanguage: 'en' });
  assert.equal(result, 'en');
});

runTest('respects fallback for short ambiguous messages', () => {
  const resultWhenEnglish = detectLanguage('ok', { fallbackLanguage: 'en' });
  const resultWhenSpanish = detectLanguage('ok', { fallbackLanguage: 'es' });

  assert.equal(resultWhenEnglish, 'en');
  assert.equal(resultWhenSpanish, 'es');
});

runTest('switches when user explicitly requests Spanish', () => {
  const text = 'I want to speak in Spanish, please.';
  const result = detectLanguage(text, { fallbackLanguage: 'en' });
  assert.equal(result, 'es');
});

runTest('switches when user explicitly requests English', () => {
  const text = 'Quiero hablar en inglés, por favor.';
  const result = detectLanguage(text, { fallbackLanguage: 'es' });
  assert.equal(result, 'en');
});

runTest('detects longer Spanish text and keeps mismatch warning behaviour', () => {
  const text =
    'Necesito hablar sobre mi ansiedad porque no puedo dormir bien por las noches y me siento muy cansado últimamente.';
  const result = detectLanguage(text, { fallbackLanguage: 'en' });
  assert.equal(result, 'es');
});

runTest('validateLanguageConsistency keeps English for ambiguous short text', () => {
  const result = validateLanguageConsistency('en', 'ok thanks');
  assert.equal(result, 'en');
});

runTest('validateLanguageConsistency switches to Spanish for confident long text', () => {
  const spanishText =
    'Durante las últimas semanas he tenido ataques de ansiedad cada noche y necesito hablar con alguien que me ayude a manejarlo mejor.';
  const result = validateLanguageConsistency('en', spanishText);
  assert.equal(result, 'es');
});
