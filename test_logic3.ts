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
    memPerDay: 5,
    breakDays: [],
    memSelectionMode: 'systematic',
};

const table = generateWeeklyTable(user as UserProfile, { recitation: 0, memorization: 0 }, mockTranslations);
