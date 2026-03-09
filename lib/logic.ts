import { Language } from "@/constants/translations";
// @ts-ignore
import * as QuranMetadata from '@kmaslesa/quran-metadata';

export type SelectionMode = 'surah' | 'juz' | 'hizb';

export interface UserProfile {
    name: string;
    gender: 'boy' | 'girl';
    language: Language;
    selectionMode: SelectionMode;
    selectedSurahs: number[];
    selectedJuzs: number[];
    selectedHizbs: number[];
    memPerDay: number;
    breakDays: string[];
}

export const getSurahRange = (id: number): [number, number] => {
    const sura = QuranMetadata.getSuraByIndex(id);
    return [sura.startPage, sura.endPage];
};

export const getJuzRange = (id: number): [number, number] => {
    const juz = QuranMetadata.getJuzById(id);
    return [juz.startPage, juz.endPage];
};

export const getHizbRange = (id: number): [number, number] => {
    // getHizbRange is not directly available in index.js, but we can compute it
    // from the data if we had it, or use the start page and end page logic.
    // Index.js has getHizbStartPage. 
    // Looking at the data.js check earlier, hizbs have startPage/endPage.
    // Index.js doesn't export getHizbById but let's approximate or check data.js again if needed.
    // Actually, I can use the same pattern as others if I verify the data.
    const startPage = QuranMetadata.getHizbStartPage(id);
    // End page is usually before the next hizb start page, except for the last one (60)
    let endPage = 604;
    if (id < 60) {
        endPage = QuranMetadata.getHizbStartPage(id + 1) - 1;
    }
    return [startPage, endPage];
};

export const overlaps = (r1: [number, number], r2: [number, number]) => {
    return Math.max(r1[0], r2[0]) <= Math.min(r1[1], r2[1]);
};

export interface TaskReport {
    weekNumber: number;
    missedRecitationPages: number;
    missedMemorizationPages: number;
}

export interface TableRow {
    day: string;
    recitation: string;
    memorization: string;
    isBreak: boolean;
}

export const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

export const generateWeeklyTable = (
    user: UserProfile,
    carryOver: { recitation: number; memorization: number } = { recitation: 0, memorization: 0 },
    translations: any
): TableRow[] => {
    const activeDays = daysOfWeek.filter(d => !(user.breakDays || []).includes(d));
    const numActiveDays = activeDays.length;

    if (numActiveDays === 0) return [];

    let selectedPages: number[] = [];
    if (user.selectionMode === 'surah') {
        const suraList = QuranMetadata.getSuraList();
        const selected = (user.selectedSurahs || []).sort((a, b) => a - b);
        selected.forEach(id => {
            const s = suraList.find((item: any) => item.index === id);
            if (s) {
                for (let p = s.startPage; p <= s.endPage; p++) {
                    if (!selectedPages.includes(p)) selectedPages.push(p);
                }
            }
        });
    } else if (user.selectionMode === 'juz') {
        const sortedJuzs = (user.selectedJuzs || []).sort((a, b) => a - b);
        sortedJuzs.forEach(id => {
            const range = getJuzRange(id);
            for (let p = range[0]; p <= range[1]; p++) {
                if (!selectedPages.includes(p)) selectedPages.push(p);
            }
        });
    } else if (user.selectionMode === 'hizb') {
        const sortedHizbs = (user.selectedHizbs || []).sort((a, b) => a - b);
        sortedHizbs.forEach(id => {
            const range = getHizbRange(id);
            for (let p = range[0]; p <= range[1]; p++) {
                if (!selectedPages.includes(p)) selectedPages.push(p);
            }
        });
    }

    selectedPages.sort((a, b) => a - b);
    const totalRecPortionPages = selectedPages.length;

    const totalRecPages = totalRecPortionPages + carryOver.recitation;
    const totalMemPagesPerWeek = (user.memPerDay * numActiveDays) + carryOver.memorization;

    const recPerDay = totalRecPages / numActiveDays;
    const memPerDay = totalMemPagesPerWeek / numActiveDays;

    let currentRecIdx = 0;
    // For memorization, we still use page-based logic but starting from the first selected page
    const startPage = selectedPages.length > 0 ? selectedPages[0] : 1;
    let currentMemPage = carryOver.memorization > 0 ? startPage + carryOver.memorization : startPage;

    const getInfoAtIdx = (idx: number) => {
        let safeIdx = Math.floor(idx);
        if (safeIdx >= selectedPages.length) safeIdx = selectedPages.length - 1;
        if (safeIdx < 0) safeIdx = 0;

        const absPage = selectedPages[safeIdx];
        const suras = QuranMetadata.getSuraByPageNumber(absPage);
        const sura = Array.isArray(suras) ? suras[0] : suras;
        const name = user.language === 'ar' ? sura.name.arabic : sura.name.englishTranscription;
        return { name, page: absPage };
    };

    return daysOfWeek.map((day) => {
        const isBreak = (user.breakDays || []).includes(day);
        if (isBreak) {
            return {
                day: translations[day],
                recitation: translations.break,
                memorization: translations.break,
                isBreak: true
            };
        }

        const nextRecIdx = currentRecIdx + recPerDay;
        const nextMemPage = currentMemPage + memPerDay;

        const recStartInfo = getInfoAtIdx(currentRecIdx);
        const recEndInfo = getInfoAtIdx(nextRecIdx - 0.1);

        // For memorization display
        const memStart = Math.floor(currentMemPage);
        const memEnd = Math.floor(nextMemPage - 0.1);

        const row: TableRow = {
            day: translations[day],
            recitation: recStartInfo.name === recEndInfo.name
                ? `${recStartInfo.name} (${recStartInfo.page}-${recEndInfo.page})`
                : `${recStartInfo.name} (${recStartInfo.page}) ... ${recEndInfo.name} (${recEndInfo.page})`,
            memorization: `${memStart} ${translations.to} ${memEnd}`,
            isBreak: false
        };

        currentRecIdx = nextRecIdx;
        currentMemPage = nextMemPage;

        return row;
    });
};
