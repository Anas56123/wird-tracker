const q = require('@kmaslesa/quran-metadata'); 
const translations = { monday: 'الاثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت', sunday: 'الأحد', juz: 'جزء', hizb: 'حزب', break: 'راحة' };
const { generateWeeklyTable } = require('./lib/logic');

const user = {
    selectionMode: 'juz',
    selectedJuzs: [30],
    selectedSurahs: [],
    selectedHizbs: [],
    memPerDay: 1,
    breakDays: ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    memSelectionMode: 'manual',
    manualMemSelectionMode: 'surah',
    manualMemSurahs: [1],
    mainGoal: 'revise',
    language: 'ar',
    hizbsPerWeek: 2 // Make it fit in one day
};

const table = generateWeeklyTable(user, { recitation: 0, memorization: 0 }, translations);
console.log('Recitation for Monday:', table[0].recitation);

// Now try Juz 29
user.selectedJuzs = [29];
const table29 = generateWeeklyTable(user, { recitation: 0, memorization: 0 }, translations);
console.log('Recitation for Juz 29:', table29[0].recitation);

// Now try Juz 28
user.selectedJuzs = [28];
const table28 = generateWeeklyTable(user, { recitation: 0, memorization: 0 }, translations);
console.log('Recitation for Juz 28:', table28[0].recitation);
