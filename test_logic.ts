import { generateWeeklyTable, UserProfile } from './lib/logic';

const mockTranslations = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun', break: 'Break'
};

const user: UserProfile = {
    name: 'Test',
    language: 'en',
    selectionMode: 'surah',
    selectedSurahs: [1, 2, 3],
    selectedJuzs: [],
    selectedHizbs: [],
    memPerDay: 5,
    breakDays: [],
    memSelectionMode: 'systematic',
};

const table = generateWeeklyTable(user, { recitation: 0, memorization: 0 }, mockTranslations);
