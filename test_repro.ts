import { generateWeeklyTable, UserProfile } from './lib/logic';

const t = {
    monday: 'الاثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء', 
    thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت', sunday: 'الأحد',
    break: 'راحة', juz: 'جزء', hizb: 'حزب'
};

const user: UserProfile = {
    name: 'Test',
    language: 'ar',
    selectionMode: 'juz',
    selectedJuzs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    selectedSurahs: [],
    selectedHizbs: [],
    memPerDay: 5,
    breakDays: ['friday', 'saturday'],
    memSelectionMode: 'systematic',
    mainGoal: 'revise',
};

const table = generateWeeklyTable(user, { recitation: 0, memorization: 0 }, t);
table.forEach(r => {
    console.log(`${r.day}: ${r.recitation}`);
});
