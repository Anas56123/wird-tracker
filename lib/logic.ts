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
    hizbsPerWeek?: number;
    currentWeek?: number;
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

export const getTotalSelectedPages = (user: UserProfile): number => {
    let pages: number[] = [];
    if (user.selectionMode === 'surah') {
        (user.selectedSurahs || []).forEach(id => {
            const range = getSurahRange(id);
            for (let p = range[0]; p <= range[1]; p++) if (!pages.includes(p)) pages.push(p);
        });
    } else if (user.selectionMode === 'juz') {
        (user.selectedJuzs || []).forEach(id => {
            const range = getJuzRange(id);
            for (let p = range[0]; p <= range[1]; p++) if (!pages.includes(p)) pages.push(p);
        });
    } else if (user.selectionMode === 'hizb') {
        (user.selectedHizbs || []).forEach(id => {
            const range = getHizbRange(id);
            for (let p = range[0]; p <= range[1]; p++) if (!pages.includes(p)) pages.push(p);
        });
    }
    return pages.length;
};

export const generateWeeklyTable = (
    user: UserProfile,
    carryOver: { recitation: number; memorization: number } = { recitation: 0, memorization: 0 },
    translations: any,
    weekIndex: number = 1
): TableRow[] => {
    const activeDays = daysOfWeek.filter(d => !(user.breakDays || []).includes(d));
    const numActiveDays = activeDays.length;

    if (numActiveDays === 0) return [];

    let allSelectedPages: number[] = [];
    if (user.selectionMode === 'surah') {
        const suraList = QuranMetadata.getSuraList();
        const selected = (user.selectedSurahs || []).sort((a, b) => a - b);
        selected.forEach(id => {
            const s = suraList.find((item: any) => item.index === id);
            if (s) {
                for (let p = s.startPage; p <= s.endPage; p++) {
                    if (!allSelectedPages.includes(p)) allSelectedPages.push(p);
                }
            }
        });
    } else if (user.selectionMode === 'juz') {
        const sortedJuzs = (user.selectedJuzs || []).sort((a, b) => a - b);
        sortedJuzs.forEach(id => {
            const range = getJuzRange(id);
            for (let p = range[0]; p <= range[1]; p++) {
                if (!allSelectedPages.includes(p)) allSelectedPages.push(p);
            }
        });
    } else if (user.selectionMode === 'hizb') {
        const sortedHizbs = (user.selectedHizbs || []).sort((a, b) => a - b);
        sortedHizbs.forEach(id => {
            const range = getHizbRange(id);
            for (let p = range[0]; p <= range[1]; p++) {
                if (!allSelectedPages.includes(p)) allSelectedPages.push(p);
            }
        });
    }

    allSelectedPages.sort((a, b) => a - b);

    // Filter pages for current week if hizbsPerWeek is set
    let selectedPages = allSelectedPages;
    if (user.hizbsPerWeek && user.hizbsPerWeek > 0) {
        // approx 10.1 pages per hizb
        const pagesPerWeek = Math.round(user.hizbsPerWeek * 10.1);
        const startIdx = (weekIndex - 1) * pagesPerWeek;
        selectedPages = allSelectedPages.slice(Math.max(0, startIdx), Math.min(startIdx + pagesPerWeek, allSelectedPages.length));
    }

    if (selectedPages.length === 0) return [];

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
    allSelectedPages.forEach(p => {
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

    const suraList = QuranMetadata.getSuraList();
    const ayahMap: any[] = [];
    suraList.forEach((s: any) => {
        const sr = QuranMetadata.getSuraStartEndAyahIndex(s.index);
        let curPage = s.startPage;
        for (let a = 1; a <= s.numberOfAyas; a++) {
            // Find which page this ayah belongs to (approx)
            // A more accurate way is to check all pages
            ayahMap.push({ surah: s.index, ayah: a, page: curPage });
        }
    });

    const getAyahInfo = (idx: number) => {
        // Find surah by range
        const sIdx = suraList.findIndex((s: any) => {
            const sr = QuranMetadata.getSuraStartEndAyahIndex(s.index);
            return idx >= (sr.startAyahIndex - 1) && idx < sr.endAyahIndex;
        });
        if (sIdx === -1) return null;
        const s = suraList[sIdx];
        const sr = QuranMetadata.getSuraStartEndAyahIndex(s.index);
        const relAyah = idx - (sr.startAyahIndex - 1) + 1;
        
        // Find page
        let p = s.startPage;
        for (let i = s.startPage; i <= s.endPage; i++) {
            const pr = QuranMetadata.getPageStartEndAyahIndex(i);
            if (idx >= (pr.startAyahIndex - 1) && idx < pr.endAyahIndex) {
                p = i;
                break;
            }
        }
        return { surah: s.index, ayah: relAyah, page: p };
    };

    const getAyahsFromPageList = (pages: number[]) => {
        const ayahs: number[] = [];
        const sorted = [...pages].sort((a,b) => a - b);
        sorted.forEach(p => {
            const range = QuranMetadata.getPageStartEndAyahIndex(p);
            if (range) {
                for (let i = range.startAyahIndex; i <= range.endAyahIndex; i++) {
                    if (!ayahs.includes(i)) ayahs.push(i);
                }
            }
        });
        return ayahs;
    };

    const recAyahSeq = getAyahsFromPageList(selectedPages);
    const memAyahSeq = getAyahsFromPageList(memPageSequence);

    // Initial offset for memorization sequence based on week
    const memAyahGoalPerWeek = (user.memPerDay * numActiveDays) * 15; // approx 15 ayahs per page
    let totalMemAyahOffset = (weekIndex - 1) * memAyahGoalPerWeek;
    
    // Safety check to not exceed total ayahs
    if (totalMemAyahOffset >= memAyahSeq.length && memAyahSeq.length > 0) {
        totalMemAyahOffset = memAyahSeq.length - 1;
    }

    const currentMemAyahSeq = memAyahSeq.slice(totalMemAyahOffset);

    // Calculate goals in Ayahs
    const recAyahsPerDay = recAyahSeq.length / numActiveDays;
    const memAyahsPerDay = (user.memPerDay * 15); // goal in ayahs

    let curRecAyahIdx = 0;
    let curMemAyahIdx = 0;

    const getDetailedInfoForAyahs = (ayahIndices: number[], showVerses: boolean = true) => {
        if (ayahIndices.length === 0) return "";
        
        // Get unique surahs in this range
        const surahs = new Set<number>();
        ayahIndices.forEach(idx => {
            const info = getAyahInfo(idx);
            if (info) surahs.add(info.surah);
        });
        
        const sortedSurahs = Array.from(surahs).sort((a,b) => a - b);
        const parts: string[] = [];
        
        sortedSurahs.forEach(sIdx => {
            const s = QuranMetadata.getSuraByIndex(sIdx);
            const name = user.language === 'ar' ? s.name.arabic : s.name.englishTranscription;
            
            const firstInS = ayahIndices.find(idx => getAyahInfo(idx)?.surah === sIdx);
            const lastInS = [...ayahIndices].reverse().find(idx => getAyahInfo(idx)?.surah === sIdx);
            
            if (firstInS !== undefined && lastInS !== undefined) {
                const a1 = getAyahInfo(firstInS)!;
                const a2 = getAyahInfo(lastInS)!;
                
                if (!showVerses) {
                    parts.push(name);
                } else if (a1.ayah === 1 && a2.ayah === s.numberOfAyas) {
                    parts.push(name);
                } else {
                    parts.push(`${name} (${a1.ayah}-${a2.ayah})`);
                }
            }
        });

        // Add page range for reference
        const pages = new Set<number>();
        ayahIndices.forEach(idx => {
            const info = getAyahInfo(idx);
            if (info) pages.add(info.page);
        });
        const sortedP = Array.from(pages).sort((a,b) => a - b);
        const pLabel = user.language === 'ar' ? 'ص' : 'p.';
        const pStr = sortedP.length === 1 ? `${pLabel} ${sortedP[0]}` : `${pLabel} ${sortedP[0]}-${sortedP[sortedP.length - 1]}`;
        
        return `${parts.join('، ')} (${pStr})`;
    };

    return daysOfWeek.map((day) => {
        if ((user.breakDays || []).includes(day)) {
            return {
                day: translations[day],
                recitation: translations.break,
                memorization: translations.break,
                isBreak: true
            };
        }

        const nextRecIdx = curRecAyahIdx + recAyahsPerDay;
        const nextMemIdx = curMemAyahIdx + memAyahsPerDay;

        const recAyahs = recAyahSeq.slice(Math.round(curRecAyahIdx), Math.min(Math.round(nextRecIdx), recAyahSeq.length));
        const memAyahs = currentMemAyahSeq.slice(Math.round(curMemAyahIdx), Math.min(Math.round(nextMemIdx), currentMemAyahSeq.length));

        const row: TableRow = {
            day: translations[day],
            recitation: getDetailedInfoForAyahs(recAyahs, false),
            memorization: "-",
            isBreak: false
        };

        if (showMemorization && memAyahs.length > 0) {
            row.memorization = getDetailedInfoForAyahs(memAyahs, true);
        }

        curRecAyahIdx = nextRecIdx;
        curMemAyahIdx = nextMemIdx;
        return row;
    });
};
