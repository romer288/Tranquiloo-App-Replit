import assert from 'node:assert/strict';
import { detectPsychosisIndicators } from './psychosis';

const assertDetection = (message: string, expected: boolean) => {
  const result = detectPsychosisIndicators(message);
  assert.equal(
    result.hasIndicators,
    expected,
    `Expected "${message}" to ${expected ? '' : 'not '}trigger psychosis detection (got ${result.hasIndicators} with matches ${result.matches.join(', ')})`
  );
  return result;
};

// Should not trigger for unrelated words containing "cia"
assertDetection('Tanto a mi madre como a mí nos estafaron, el piso está pendiente de desahucio.', false);
assertDetection('La policía vino a preguntar por mis vecinos.', false);

// Should trigger for classic hallucination language
const voicesResult = assertDetection('I keep hearing voices in my head telling me secrets.', true);
assert.ok(voicesResult.matches.length > 0, 'Expected voice hallucination to record matches');

// Should trigger when surveillance agency and persecution cues appear together
const agencyResult = assertDetection('The CIA is following me everywhere I go.', true);
assert.ok(agencyResult.matches.includes('agency+surveillance'), 'Expected agency+surveillance match to be recorded');

// Should have higher confidence for multiple explicit cues
const multiCue = detectPsychosisIndicators('I am hallucinating shadows, hearing voices, and I feel like people are after me.');
assert.equal(multiCue.hasIndicators, true, 'Expected multi-cue description to trigger detection');
assert.equal(multiCue.confidence, 'high', 'Expected high confidence for multiple explicit cues');

console.log('✅ psychosis detection tests passed');
