import { generateWeeklyTable, UserProfile } from './lib/logic';

const mockTranslations = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun', 
    break: 'Break', juz: 'Juz', hizb: 'Hizb'
};

const user = {
    name: 'Test',
    language: 'ar',
    selectionMode: 'surah',
    selectedSurahs: [17, 18], // Isra and Kahf
    selectedJuzs: [],
    selectedHizbs: [],
    memPerDay: 5,
    breakDays: [],
    memSelectionMode: 'systematic',
};

const table = generateWeeklyTable(user as UserProfile, { recitation: 0, memorization: 0 }, mockTranslations);
console.log(JSON.stringify(table.map(r => ({day: r.day, rec: r.recitation})), null, 2));
