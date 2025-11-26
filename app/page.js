'use client';

import { useState } from 'react';
import symptomData from './data/symptoms.json';

export default function Home() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [result, setResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [age, setAge] = useState('');

  // Get all unique symptoms from the data
  const allSymptoms = Object.keys(symptomData);

  // Enhanced search function with keyword matching
  const filteredSymptoms = allSymptoms.filter(symptom => {
    if (!searchTerm) return true;
    
    const symptomLower = symptom.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    // Direct substring match
    if (symptomLower.includes(searchLower)) return true;
    
    // Split search term into individual words
    const searchWords = searchLower.split(/\s+/);
    
    // Check if all search words appear somewhere in the symptom
    const allWordsFound = searchWords.every(word => 
      symptomLower.includes(word)
    );
    
    if (allWordsFound) return true;
    
    // Handle common variations and synonyms
    const variations = {
      'high': ['elevated', 'increased', 'raised'],
      'low': ['decreased', 'reduced', 'drop'],
      'pain': ['ache', 'aching', 'hurt', 'hurting', 'sore'],
      'blood pressure': ['bp', 'hypertension', 'hypotension'],
      'blood sugar': ['glucose', 'diabetes', 'diabetic'],
      'breathing': ['breath', 'respiratory'],
      'vision': ['sight', 'visual', 'eye'],
      'hearing': ['deaf', 'audio'],
      'stomach': ['abdominal', 'belly', 'gastric'],
      'heart': ['cardiac', 'cardio'],
      'kidney': ['renal'],
      'liver': ['hepatic'],
      'skin': ['dermal', 'rash']
    };
    
    // Check variations
    for (const [key, synonyms] of Object.entries(variations)) {
      if (searchLower.includes(key)) {
        for (const synonym of synonyms) {
          if (symptomLower.includes(synonym)) return true;
        }
      }
      
      // Check reverse - if symptom contains key and search contains synonym
      if (symptomLower.includes(key)) {
        for (const synonym of synonyms) {
          if (searchLower.includes(synonym)) return true;
        }
      }
    }
    
    return false;
  });

  // Toggle symptom selection
  const toggleSymptom = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
    setResult(null); // Clear result when changing symptoms
  };

  // Function to get age-appropriate specialist name
  const getAgeAppropriateSpecialist = (specialist, userAge) => {
    const ageNum = parseInt(userAge);
    
    // Specialists that don't apply to children/teens (under 18)
    const adultOnlySpecialists = ['ob-gyn', 'urologist', 'internal medicine'];
    
    // For young children (≤12), filter out reproductive/sexual health specialists
    if (ageNum <= 12) {
      if (specialist === 'ob-gyn') {
        return null;
      }
      
      // Filter urologist for sexual/reproductive symptoms only
      const sexualSymptoms = [
        'erectile dysfunction', 'impotence', 'premature ejaculation', 'sexual dysfunction',
        'blood in semen', 'penile discharge', 'penile pain', 'pain during intercourse',
        'genital sores', 'genital warts', 'sexually transmitted disease',
        'chlamydia symptoms', 'gonorrhea symptoms', 'syphilis symptoms'
      ];
      
      if (specialist === 'urologist' && selectedSymptoms.some(symptom => sexualSymptoms.includes(symptom))) {
        return null;
      }
    }
    
    // For all children/teens (≤17), filter out internal medicine
    if (ageNum <= 17 && specialist === 'internal medicine') {
      return null;
    }
    
    // For adults (≥18), filter out pediatrician
    if (ageNum >= 18 && specialist === 'pediatrician') {
      return null;
    }
    
    // For teenagers, some reproductive health specialists are appropriate
    if (ageNum <= 17) {
      // Specialists that should remain as pediatric versions
      const pediatricSpecialists = [
        'cardiologist', 'neurologist', 'dermatologist', 'gastroenterologist',
        'pulmonologist', 'endocrinologist', 'rheumatologist', 'hematologist',
        'oncologist', 'orthopedic', 'ent', 'ophthalmologist', 'psychiatrist',
        'allergist', 'nephrologist', 'urologist', 'neurosurgeon', 'general surgeon',
        'infectious disease', 'immunologist', 'vascular surgeon', 'plastic surgeon'
      ];
      
      if (pediatricSpecialists.includes(specialist)) {
        return `Pediatric ${specialist.charAt(0).toUpperCase() + specialist.slice(1)}`;
      }
      
      // Specialists that remain the same for children (but capitalized)
      const sameForChildren = [
        'pediatrician', 'dentist', 'family medicine',
        'podiatrist', 'plastic surgeon', 'sports medicine', 'pain management',
        'psychologist', 'vascular surgeon', 'diabetologist', 'nutritionist'
      ];
      
      if (sameForChildren.includes(specialist)) {
        return specialist.charAt(0).toUpperCase() + specialist.slice(1);
      }
      
      // Handle special cases for teenagers (13-17)
      if (ageNum >= 13) {
        if (specialist === 'ob-gyn') {
          return 'Adolescent Gynecologist';
        }
      }
    } else {
      // Adults (18+) - return specialist names as-is but capitalized
      return specialist.charAt(0).toUpperCase() + specialist.slice(1).replace(/-/g, '-');
    }
    
    // Default fallback
    return specialist.charAt(0).toUpperCase() + specialist.slice(1);
  };

  // Calculate which specialist to recommend
  const findSpecialist = () => {
    if (selectedSymptoms.length === 0) {
      alert('Please select at least one symptom');
      return;
    }
    
    if (!age || age < 0 || age > 120) {
      alert('Please enter a valid age');
      return;
    }


    // Check for red flags first
    const redFlags = ['chest pain spreading to arm', 'sudden severe headache', 'difficulty breathing', 'loss of consciousness'];
    const hasRedFlag = selectedSymptoms.some(symptom => redFlags.includes(symptom));
    
    if (hasRedFlag) {
      setResult({
        type: 'emergency',
        specialist: 'Emergency Department',
        reason: 'Your symptoms indicate a potential emergency. Please seek immediate medical attention.',
        alternatives: []
      });
      // Scroll to results after setting state
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
      return;
    }

    // Calculate specialist scores
    const specialistScores = {};
    
    selectedSymptoms.forEach(symptom => {
      const specialists = symptomData[symptom];
      if (specialists) {
        Object.keys(specialists).forEach(specialist => {
          const weight = specialists[specialist];
          specialistScores[specialist] = (specialistScores[specialist] || 0) + weight;
        });
      }
    });

    // Filter and map specialists based on age
    const ageFilteredSpecialists = {};
    Object.entries(specialistScores).forEach(([specialist, score]) => {
      const ageAppropriateSpecialist = getAgeAppropriateSpecialist(specialist, age);
      if (ageAppropriateSpecialist) {
        ageFilteredSpecialists[ageAppropriateSpecialist] = score;
      }
    });

    // Sort specialists by score
    const sortedSpecialists = Object.entries(ageFilteredSpecialists)
      .sort((a, b) => b[1] - a[1]);

    if (sortedSpecialists.length === 0) {
      const generalSpecialist = parseInt(age) <= 17 ? 'Pediatrician' : 'Internal Medicine / General Practitioner';
      setResult({
        type: 'general',
        specialist: generalSpecialist,
        reason: 'Your symptoms are general. Start with a general practitioner.',
        alternatives: []
      });
      // Scroll to results after setting state
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
      return;
    }

    const [topSpecialist, topScore] = sortedSpecialists[0];
    const alternatives = sortedSpecialists
      .slice(1, 3)
      .filter(([_, score]) => score >= topScore - 2)
      .map(([specialist]) => specialist);

    setResult({
      type: 'specialist',
      specialist: topSpecialist,
      score: topScore,
      reason: `Based on your symptoms (${selectedSymptoms.join(', ')}), a ${topSpecialist} is best suited to help you.`,
      alternatives
    });

    // Scroll to results after setting state
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold">WhoToConsult</h1>
          <p className="text-xl mt-2">Find the right medical specialist for your symptoms</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Age Input */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Your Age</h2>
            <p className="text-gray-700 mb-4">We need your age group to recommend the most appropriate type of specialist.</p>
            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select your age group</option>
              <option value="5">0-12 years (Child)</option>
              <option value="15">13-17 years (Teenager)</option>
              <option value="25">18+ years (Adult)</option>
            </select>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">How it works</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Select your age group above</li>
              <li>Select all symptoms you're experiencing from the list below</li>
              <li>Click "Find the Right Specialist" to get your recommendation</li>
              <li>See which doctor to consult and why</li>
            </ol>
            <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> This tool provides guidance only. It does not replace professional medical advice. 
                If you have severe or emergency symptoms, call emergency services immediately.
              </p>
            </div>
          </div>

          {/* Symptom Search */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Your Symptoms</h2>
            
            <input
              type="text"
              placeholder="Type to search symptoms... (e.g., headache, fever, cough)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoComplete="off"
              autoFocus={false}
            />

            {/* Selected Symptoms */}
            {selectedSymptoms.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Selected Symptoms ({selectedSymptoms.length}):</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSymptoms.map(symptom => (
                    <span
                      key={symptom}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {symptom}
                      <button
                        onClick={() => toggleSymptom(symptom)}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results Info */}
            {searchTerm && (
              <div className="mb-4 text-sm text-gray-600">
                Found {filteredSymptoms.length} symptom{filteredSymptoms.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </div>
            )}

            {/* Symptom List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
              {filteredSymptoms.map(symptom => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`text-left px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedSymptoms.includes(symptom)
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-200 hover:border-blue-300 text-gray-700'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>

            {filteredSymptoms.length === 0 && searchTerm && (
              <div className="text-center py-8">
                <p className="text-gray-500">No symptoms found matching "{searchTerm}"</p>
                <p className="text-sm text-gray-400 mt-2">Try searching for related terms or check your spelling</p>
              </div>
            )}

            {!searchTerm && (
              <p className="text-gray-400 text-center py-4">Start typing to search through {allSymptoms.length} available symptoms</p>
            )}
          </div>

          {/* Find Specialist Button */}
          <div className="text-center mb-6">
            <button
              onClick={findSpecialist}
              disabled={selectedSymptoms.length === 0 || !age}
              className={`px-8 py-4 rounded-lg text-lg font-bold transition-all ${
                selectedSymptoms.length === 0 || !age
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              Find the Right Specialist
            </button>
            {(!age || selectedSymptoms.length === 0) && (
              <p className="text-sm text-gray-500 mt-2">
                {!age && selectedSymptoms.length === 0 
                  ? 'Please select your age group and symptoms'
                  : !age 
                    ? 'Please select your age group'
                    : 'Please select at least one symptom'}
              </p>
            )}
          </div>

          {/* Results */}
          {result && (
            <div 
              id="results-section"
              className={`rounded-lg shadow-lg p-6 ${
              result.type === 'emergency' 
                ? 'bg-red-50 border-2 border-red-500' 
                : 'bg-green-50 border-2 border-green-500'
            }`}>
              {result.type === 'emergency' ? (
                <>
                  <h2 className="text-3xl font-bold text-red-700 mb-3">⚠️ Seek Emergency Care</h2>
                  <p className="text-lg text-red-800">{result.reason}</p>
                  <div className="mt-4 p-4 bg-red-100 rounded">
                    <p className="font-bold text-red-900">Call emergency services or go to the nearest hospital immediately.</p>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-green-700 mb-3">
                    Recommended Specialist: {result.specialist}
                  </h2>
                  <p className="text-lg text-gray-700 mb-4">{result.reason}</p>
                  
                  {result.alternatives && result.alternatives.length > 0 && (
                    <div className="mt-4 p-4 bg-white rounded border border-green-200">
                      <h3 className="font-semibold text-gray-800 mb-2">Alternative Specialists:</h3>
                      <ul className="list-disc list-inside text-gray-700">
                        {result.alternatives.map(alt => (
                          <li key={alt}>{alt}</li>
                        ))}
                      </ul>
                      <p className="text-sm text-gray-600 mt-2">
                        These specialists may also be able to help with your symptoms.
                      </p>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-blue-50 rounded">
                    <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
                    <ul className="list-decimal list-inside text-blue-800 space-y-1">
                      <li>Book an appointment with a {result.specialist}</li>
                      <li>Prepare a list of your symptoms and when they started</li>
                      <li>Bring any relevant medical records</li>
                      <li>Note any medications you're currently taking</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2025 WhoToConsult. This tool only serves as a guide and does not constitute actual medical advice. 
          </p>
          <p className="text-xs mt-2 text-gray-400">
            Diagnosis and treatment should be done by a qualified healthcare professional. 
          </p>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-300">
              Business inquiries: <a href="mailto:contact@whotoconsult.com" className="text-blue-400 hover:text-blue-300">contact@whotoconsult.com</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
