const surahCountsPerDay = new Map<number, number[]>();
surahCountsPerDay.set(77, [2, 0, 0, 0, 0, 0, 0]);

const surahToDay = new Map<number, number>();
surahCountsPerDay.forEach((counts, surahIndex) => {
    let maxCount = -1;
    let maxDay = -1;
    for (let i = 0; i < 7; i++) {
        if (counts[i] > maxCount) {
            maxCount = counts[i];
            maxDay = i;
        }
    }
    if (maxDay !== -1 && maxCount > 0) {
        surahToDay.set(surahIndex, maxDay);
    }
});
