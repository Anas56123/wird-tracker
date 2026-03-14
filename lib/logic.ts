import { Language } from "@/constants/translations";
// @ts-ignore
import * as QuranMetadata from '@kmaslesa/quran-metadata';

export type SelectionMode = 'surah' | 'juz' | 'hizb';

export interface UserProfile {
    name: string;
    language: Language;
    selectionMode: SelectionMode;
    selectedSurahs: number[];
    selectedJuzs: number[];
    selectedHizbs: number[];
    memPerDay: number;
    breakDays: string[];
    memSelectionMode: 'systematic' | 'manual';
    manualMemSelectionMode?: SelectionMode;
    manualMemSurahs?: number[]; 
    manualMemJuzs?: number[];
    manualMemHizbs?: number[];
    mainGoal?: 'memorize' | 'revise';
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
    const startPage = QuranMetadata.getHizbStartPage(id);
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

    const selectedSurahIndices = new Set<number>();
    selectedPages.forEach(p => {
        const info = QuranMetadata.getPageInfo(p);
        if (info && info.suras) {
            info.suras.forEach((s: any) => selectedSurahIndices.add(s.index));
        }
    });

    const getDifficultyScore = (idx: number) => {
        const s = QuranMetadata.getSuraByIndex(idx);
        let score = (s.numberOfAyas || 0) * 1.5 + (s.totalPages || 0) * 8;
        if (idx >= 78) score -= 30; 
        return score;
    };

    let targetMemSurah = 1;
    let memDirection: 'forward' | 'backward' = 'forward';

    if (selectedSurahIndices.size > 0) {
        const sortedSelected = Array.from(selectedSurahIndices).sort((a, b) => a - b);
        const firstIdx = sortedSelected[0];
        const lastIdx = sortedSelected[sortedSelected.length - 1];

        const beforeCandidate = firstIdx > 1 ? firstIdx - 1 : -1;
        const afterCandidate = lastIdx < 114 ? lastIdx + 1 : -1;

        if (beforeCandidate > 0 && afterCandidate > 0) {
            const scoreBefore = getDifficultyScore(beforeCandidate);
            const scoreAfter = getDifficultyScore(afterCandidate);
            if (scoreBefore <= scoreAfter) {
                targetMemSurah = beforeCandidate;
                memDirection = 'backward';
            } else {
                targetMemSurah = afterCandidate;
                memDirection = 'forward';
            }
        } else if (beforeCandidate > 0) {
            targetMemSurah = beforeCandidate;
            memDirection = 'backward';
        } else if (afterCandidate > 0) {
            targetMemSurah = afterCandidate;
            memDirection = 'forward';
        }
    }

    const memPageSequence: number[] = [];
    if (user.memSelectionMode === 'manual') {
        const mMode = user.manualMemSelectionMode || 'surah';
        if (mMode === 'surah' && user.manualMemSurahs) {
            user.manualMemSurahs.sort((a, b) => a - b).forEach(id => {
                const s = QuranMetadata.getSuraByIndex(id);
                for (let p = s.startPage; p <= s.endPage; p++) {
                    if (!memPageSequence.includes(p)) memPageSequence.push(p);
                }
            });
        } else if (mMode === 'juz' && user.manualMemJuzs) {
            user.manualMemJuzs.sort((a, b) => a - b).forEach(id => {
                const range = getJuzRange(id);
                for (let p = range[0]; p <= range[1]; p++) {
                    if (!memPageSequence.includes(p)) memPageSequence.push(p);
                }
            });
        } else if (mMode === 'hizb' && user.manualMemHizbs) {
            user.manualMemHizbs.sort((a, b) => a - b).forEach(id => {
                const range = getHizbRange(id);
                for (let p = range[0]; p <= range[1]; p++) {
                    if (!memPageSequence.includes(p)) memPageSequence.push(p);
                }
            });
        }
    } else {
        if (memDirection === 'backward') {
            for (let i = targetMemSurah; i >= 1; i--) {
                if (!selectedSurahIndices.has(i)) {
                    const s = QuranMetadata.getSuraByIndex(i);
                    for (let p = s.startPage; p <= s.endPage; p++) {
                        if (!memPageSequence.includes(p)) memPageSequence.push(p);
                    }
                }
            }
        } else {
            for (let i = targetMemSurah; i <= 114; i++) {
                if (!selectedSurahIndices.has(i)) {
                    const s = QuranMetadata.getSuraByIndex(i);
                    for (let p = s.startPage; p <= s.endPage; p++) {
                        if (!memPageSequence.includes(p)) memPageSequence.push(p);
                    }
                }
            }
        }
    }

    const isFullQuranSelected = selectedPages.length >= 604;
    const mMode = user.manualMemSelectionMode || 'surah';
    let isManualEmpty = false;
    if (user.memSelectionMode === 'manual') {
        if (mMode === 'surah' && (!user.manualMemSurahs || user.manualMemSurahs.length === 0)) isManualEmpty = true;
        if (mMode === 'juz' && (!user.manualMemJuzs || user.manualMemJuzs.length === 0)) isManualEmpty = true;
        if (mMode === 'hizb' && (!user.manualMemHizbs || user.manualMemHizbs.length === 0)) isManualEmpty = true;
    }
    const isReviseMode = user.mainGoal === 'revise';
    const showMemorization = !isFullQuranSelected && !isManualEmpty && memPageSequence.length > 0 && !isReviseMode;

    const totalRecPages = totalRecPortionPages + carryOver.recitation;
    const totalMemPagesPerWeek = (user.memPerDay * numActiveDays) + carryOver.memorization;

    const recPerDay = totalRecPages / numActiveDays;
    const memPerDayGoal = totalMemPagesPerWeek / numActiveDays;

    let currentRecIdx = 0;
    let currentMemSeqIdx = 0;

    const getLastCompletedSurahName = (upToSeqIdx: number) => {
        if (upToSeqIdx <= 0) return null;
        const coveredPages = new Set(memPageSequence.slice(0, upToSeqIdx));
        const suraList = QuranMetadata.getSuraList();
        let lastFinished = null;

        for (let i = 0; i < suraList.length; i++) {
            const s = suraList[i];
            let allPagesIn = true;
            for (let p = s.startPage; p <= s.endPage; p++) {
                if (!coveredPages.has(p)) {
                    allPagesIn = false;
                    break;
                }
            }
            if (allPagesIn) {
                lastFinished = user.language === 'ar' ? s.name.arabic : s.name.englishTranscription;
            }
        }
        return lastFinished;
    };

    const getDetailedInfoForPages = (pages: number[]) => {
        if (pages.length === 0) return "";
        const startPage = pages[0];
        const endPage = pages[pages.length - 1];

        // 1. Check for exact Juz match
        for (let j = 1; j <= 30; j++) {
            const range = getJuzRange(j);
            if (range[0] === startPage && range[1] === endPage) {
                const juzData = QuranMetadata.getJuzById(j);
                const firstSura = QuranMetadata.getSuraByIndex(juzData.startSuraIndex);
                const sName = user.language === 'ar' ? firstSura.name.arabic : firstSura.name.englishTranscription;
                return `${translations.juz} ${j} (${sName})`;
            }
        }

        // 2. Check for exact Hizb match
        for (let h = 1; h <= 60; h++) {
            const range = getHizbRange(h);
            if (range[0] === startPage && range[1] === endPage) {
                const pageInfo = QuranMetadata.getPageInfo(range[0]);
                const firstSura = QuranMetadata.getSuraByIndex(pageInfo.suras[0].index);
                const sName = user.language === 'ar' ? firstSura.name.arabic : firstSura.name.englishTranscription;
                return `${translations.hizb} ${h} (${sName})`;
            }
        }

        const startPageInfo = QuranMetadata.getPageInfo(startPage);
        const endPageInfo = QuranMetadata.getPageInfo(endPage);

        if (!startPageInfo || !endPageInfo) return "";

        const globalStart = startPageInfo.firstAyahIndex;
        const globalEnd = endPageInfo.lastAyahIndex;
        const results: string[] = [];
        const surasCovered: any[] = [];

        const allSuras = QuranMetadata.getSuraList();
        allSuras.forEach((s: any) => {
            const suraRange = QuranMetadata.getSuraStartEndAyahIndex(s.index);
            if (Math.max(globalStart, suraRange.startAyahIndex) <= Math.min(globalEnd, suraRange.endAyahIndex)) {
                surasCovered.push(s);
            }
        });

        surasCovered.forEach(s => {
            const suraRange = QuranMetadata.getSuraStartEndAyahIndex(s.index);
            const pStart = Math.max(globalStart, suraRange.startAyahIndex);
            const pEnd = Math.min(globalEnd, suraRange.endAyahIndex);
            const relStart = pStart - suraRange.startAyahIndex + 1;
            const relEnd = pEnd - suraRange.startAyahIndex + 1;
            const isFullSurah = relStart === 1 && relEnd >= s.numberOfAyas;
            const name = user.language === 'ar' ? s.name.arabic : s.name.englishTranscription;

            if (isFullSurah) {
                results.push(name);
            } else {
                results.push(`${name} (${relStart}-${relEnd})`);
            }
        });

        const pageLabel = user.language === 'ar' ? 'ص' : 'p.';
        const pageRange = startPage === endPage ? `${pageLabel} ${startPage}` : `${pageLabel} ${startPage}-${endPage}`;
        return `${results.join(', ')} (${pageRange})`;
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
        const nextMemSeqIdx = currentMemSeqIdx + memPerDayGoal;

        const recStartIdx = Math.floor(currentRecIdx);
        const recEndIdx = Math.min(Math.ceil(nextRecIdx), selectedPages.length);
        const recPagesForDay = selectedPages.slice(recStartIdx, recEndIdx);

        const memRangeStart = Math.floor(currentMemSeqIdx);
        const memRangeEnd = Math.min(Math.ceil(nextMemSeqIdx), memPageSequence.length);
        const memPagesForDay = memPageSequence.slice(memRangeStart, memRangeEnd);

        let memLabel = "-";
        if (showMemorization) {
            const completedSurah = getLastCompletedSurahName(Math.floor(nextMemSeqIdx));
            const currentPortionLabel = getDetailedInfoForPages(memPagesForDay);
            
            if (completedSurah) {
                const reviewPrefix = user.language === 'ar' ? "مراجعة: " : "Review: ";
                const reviewLabel = `${reviewPrefix}${completedSurah}`;
                
                if (memPagesForDay.length > 0) {
                    if (currentPortionLabel.includes(completedSurah)) {
                        memLabel = currentPortionLabel;
                    } else {
                        memLabel = `${currentPortionLabel}\n(${reviewLabel})`;
                    }
                } else {
                    memLabel = reviewLabel;
                }
            } else {
                memLabel = currentPortionLabel || "-";
            }
        }

        const row: TableRow = {
            day: translations[day],
            recitation: getDetailedInfoForPages(recPagesForDay),
            memorization: memLabel,
            isBreak: false
        };

        currentRecIdx = nextRecIdx;
        currentMemSeqIdx = nextMemSeqIdx;

        return row;
    });
};
