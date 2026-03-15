import { generateWeeklyTable, UserProfile } from './lib/logic';

const mockTranslations = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun', break: 'Break'
};

const user = {
    name: 'Test',
    language: 'ar',
    selectionMode: 'juz',
    selectedJuzs: [30],
    selectedSurahs: [],
    selectedHizbs: [],
    memPerDay: 1,
    breakDays: [],
    memSelectionMode: 'manual',
    manualMemSelectionMode: 'juz',
    manualMemJuzs: [30]
};

const table = generateWeeklyTable(user as UserProfile, { recitation: 0, memorization: 0 }, mockTranslations);
console.log(JSON.stringify(table.map(r => ({day: r.day, rec: r.recitation, mem: r.memorization})), null, 2));
