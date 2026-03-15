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

    const allSurasInfo = QuranMetadata.getSuraList();
    const getSurahIdsForPage = (p: number): number[] => {
        const range = QuranMetadata.getPageStartEndAyahIndex(p);
        if (!range) return [];
        const res: number[] = [];
        allSurasInfo.forEach((s: any) => {
            const sr = QuranMetadata.getSuraStartEndAyahIndex(s.index);
            // Use strict < to avoid false overlap at shared boundary indices between adjacent surahs
            if (Math.max(range.startAyahIndex, sr.startAyahIndex) < Math.min(range.endAyahIndex, sr.endAyahIndex)) {
                res.push(s.index);
            }
        });
        return res;
    };

    const selectedSurahIndices = new Set<number>();
    selectedPages.forEach(p => {
        const ids = getSurahIdsForPage(p);
        ids.forEach(id => selectedSurahIndices.add(id));
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

    // Pre-calculate full-surah Juz and Hizb mappings for condensation
    const juzSurahMap = new Map<number, number[]>();
    for (let j = 1; j <= 30; j++) {
        const juz = QuranMetadata.getJuzById(j);
        const startSura = juz.surahs[0];
        const lastSura = juz.surahs[juz.surahs.length - 1];
        const lastSuraInfo = QuranMetadata.getSuraByIndex(lastSura.id);
        
        // A Juz is 'Whole' if it starts at the beginning of its first surah
        // and ends at the end of its last surah.
        if (startSura.startAyah === 1 && lastSura.endAyah === lastSuraInfo.numberOfAyas) {
            const ids = juz.surahs.map((s: any) => s.id);
            juzSurahMap.set(j, ids);
        }
    }

    const hizbSurahMap = new Map<number, number[]>();
    for (let h = 1; h <= 60; h++) {
        const hRange = QuranMetadata.getHizbStartEndAyahIndex(h);
        const suras = QuranMetadata.getSuraList().filter((s: any) => {
            const sr = QuranMetadata.getSuraStartEndAyahIndex(s.index);
            return Math.max(hRange.startAyahIndex - 1, sr.startAyahIndex) < Math.min(hRange.endAyahIndex, sr.endAyahIndex);
        });
        
        if (suras.length > 0) {
            const ssr = QuranMetadata.getSuraStartEndAyahIndex(suras[0].index);
            const esr = QuranMetadata.getSuraStartEndAyahIndex(suras[suras.length - 1].index);
            if (hRange.startAyahIndex - 1 === ssr.startAyahIndex && hRange.endAyahIndex === esr.endAyahIndex) {
                const ids = suras.map((s: any) => s.index);
                hizbSurahMap.set(h, ids);
            }
        }
    }

    const getDetailedInfoForPages = (pages: number[], showVerses: boolean = true, dayIndex?: number, mapping?: Map<number, number>) => {
        if (pages.length === 0) return "";
        
        // Always show min-max regardless of traversal direction
        const minP = Math.min(...pages);
        const maxP = Math.max(...pages);
        const pageLabel = user.language === 'ar' ? 'ص' : 'p.';
        const pageRange = minP === maxP ? `${pageLabel} ${minP}` : `${pageLabel} ${minP}-${maxP}`;

        // Exact page range match for units (Juz/Hizb) - highest priority
        if (!mapping) {
            for (let j = 1; j <= 30; j++) {
                const range = getJuzRange(j);
                if (range[0] === minP && range[1] === maxP) {
                    const juzData = QuranMetadata.getJuzById(j);
                    const firstSura = QuranMetadata.getSuraByIndex(juzData.startSuraIndex);
                    const sName = user.language === 'ar' ? firstSura.name.arabic : firstSura.name.englishTranscription;
                    return `${translations.juz} ${sName} (${pageRange})`;
                }
            }
        }

        const surahsToProcess: number[] = [];
        if (mapping && dayIndex !== undefined) {
            mapping.forEach((assignedDay, sIdx) => {
                if (assignedDay === dayIndex) {
                    surahsToProcess.push(sIdx);
                }
            });
        } else {
            const allSuras = QuranMetadata.getSuraList();
            const rangeStart = QuranMetadata.getPageStartEndAyahIndex(minP);
            const rangeEnd = QuranMetadata.getPageStartEndAyahIndex(maxP);
            if (!rangeStart || !rangeEnd) return "";
            allSuras.forEach((s: any) => {
                const sr = QuranMetadata.getSuraStartEndAyahIndex(s.index);
                // Use strict < to avoid false overlap at shared boundary indices between adjacent surahs
                if (Math.max(rangeStart.startAyahIndex, sr.startAyahIndex) < Math.min(rangeEnd.endAyahIndex, sr.endAyahIndex)) {
                    surahsToProcess.push(s.index);
                }
            });
        }

        // Sort surahs relative to the sequence direction
        surahsToProcess.sort((a, b) => a - b);
        if (memDirection === 'backward' && !mapping) surahsToProcess.sort((a, b) => b - a);

        const processedLabels: string[] = [];
        const consumedIndices = new Set<number>();
        
        // Try to condense into Juz/Hizb units if they match exactly
        // Priority: Juz > Hizb
        for (let j = 1; j <= 30; j++) {
            const jSuras = juzSurahMap.get(j);
            if (jSuras && jSuras.every(id => surahsToProcess.includes(id))) {
                const firstOccurence = surahsToProcess.indexOf(jSuras[0]);
                // Ensure sequence is contiguous in current selection
                let contiguous = true;
                for (let k = 0; k < jSuras.length; k++) {
                    if (surahsToProcess[firstOccurence + k] !== jSuras[k]) { contiguous = false; break; }
                }
                
                if (contiguous) {
                    jSuras.forEach(id => consumedIndices.add(id));
                    // Construct label
                    const firstSura = QuranMetadata.getSuraByIndex(jSuras[0]);
                    const sName = user.language === 'ar' ? firstSura.name.arabic : firstSura.name.englishTranscription;
                    const label = `${translations.juz} ${sName}`;
                    // Insert label at its start position and mark others as consumed
                    processedLabels[firstOccurence] = label;
                }
            }
        }
        
        for (let h = 1; h <= 60; h++) {
            const hSuras = hizbSurahMap.get(h);
            if (hSuras && hSuras.length > 0 && hSuras.every(id => surahsToProcess.includes(id) && !consumedIndices.has(id))) {
                const firstOccurence = surahsToProcess.indexOf(hSuras[0]);
                let contiguous = true;
                for (let k = 0; k < hSuras.length; k++) {
                    if (surahsToProcess[firstOccurence + k] !== hSuras[k]) { contiguous = false; break; }
                }
                
                if (contiguous) {
                    hSuras.forEach(id => consumedIndices.add(id));
                    const firstSura = QuranMetadata.getSuraByIndex(hSuras[0]);
                    const sName = user.language === 'ar' ? firstSura.name.arabic : firstSura.name.englishTranscription;
                    const label = `${translations.hizb} ${sName}`;
                    processedLabels[firstOccurence] = label;
                }
            }
        }

        // Final label generation
        const labels: string[] = [];
        for (let i = 0; i < surahsToProcess.length; i++) {
            if (processedLabels[i]) {
                labels.push(processedLabels[i]);
            } else if (!consumedIndices.has(surahsToProcess[i])) {
                const idx = surahsToProcess[i];
                const s = QuranMetadata.getSuraByIndex(idx);
                const name = user.language === 'ar' ? s.name.arabic : s.name.englishTranscription;
                
                if (!showVerses) {
                    labels.push(name);
                } else {
                    const sr = QuranMetadata.getSuraStartEndAyahIndex(idx);
                    const rangeStart = QuranMetadata.getPageStartEndAyahIndex(minP);
                    const rangeEnd = QuranMetadata.getPageStartEndAyahIndex(maxP);
                    const pStart = Math.max(rangeStart.startAyahIndex, sr.startAyahIndex);
                    const pEnd = Math.min(rangeEnd.endAyahIndex, sr.endAyahIndex);
                    const relStart = pStart - sr.startAyahIndex + 1;
                    const relEnd = pEnd - sr.startAyahIndex + 1;
                    labels.push((relStart === 1 && relEnd >= s.numberOfAyas) ? name : `${name} (${relStart}-${relEnd})`);
                }
            }
        }

        if (labels.length === 0) return `(${pageRange})`;
        return `${labels.join('، ')} (${pageRange})`;
    };


    const computeSurahToDayMapping = (pageSequence: number[], perDayGoal: number) => {
        const toDay = new Map<number, number>();
        let tempIdx = 0;
        for (let dIdx = 0; dIdx < activeDays.length; dIdx++) {
            const nextIdx = tempIdx + perDayGoal;
            const pages = pageSequence.slice(Math.floor(tempIdx), Math.min(Math.ceil(nextIdx), pageSequence.length));
            pages.forEach(p => {
                getSurahIdsForPage(p).forEach(sIdx => {
                    if (!toDay.has(sIdx)) toDay.set(sIdx, dIdx);
                });
            });
            tempIdx = nextIdx;
        }
        return toDay;
    };

    const recMapping = computeSurahToDayMapping(selectedPages, recPerDay);
    const activeDayToGlobalIndex = activeDays.map(d => daysOfWeek.indexOf(d));

    return daysOfWeek.map((day) => {
        const globalIdx = daysOfWeek.indexOf(day);
        const activeIdx = activeDayToGlobalIndex.indexOf(globalIdx);
        const isBreak = activeIdx === -1;

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

        const recPages = selectedPages.slice(Math.floor(currentRecIdx), Math.min(Math.ceil(nextRecIdx), selectedPages.length));
        const memPages = memPageSequence.slice(Math.floor(currentMemSeqIdx), Math.min(Math.ceil(nextMemSeqIdx), memPageSequence.length));

        const row: TableRow = {
            day: translations[day],
            recitation: getDetailedInfoForPages(recPages, false, activeIdx, recMapping),
            memorization: "-",
            isBreak: false
        };

        if (showMemorization && memPages.length > 0) {
            // Memorization always shows actual verse content (no mapping), so every page has a label
            const currentPortion = getDetailedInfoForPages(memPages, true);
            const completedSurah = getLastCompletedSurahName(Math.floor(nextMemSeqIdx));
            
            if (completedSurah) {
                const reviewPrefix = user.language === 'ar' ? "مراجعة: " : "Review: ";
                const reviewLabel = `${reviewPrefix}${completedSurah}`;
                row.memorization = currentPortion.includes(completedSurah) ? currentPortion : `${currentPortion}\n(${reviewLabel})`;
            } else {
                row.memorization = currentPortion;
            }
        } else if (showMemorization) {
            const completedSurah = getLastCompletedSurahName(Math.floor(nextMemSeqIdx));
            if (completedSurah) {
                const reviewPrefix = user.language === 'ar' ? "مراجعة: " : "Review: ";
                row.memorization = `${reviewPrefix}${completedSurah}`;
            }
        }

        currentRecIdx = nextRecIdx;
        currentMemSeqIdx = nextMemSeqIdx;
        return row;
    });
};
