declare module '@kmaslesa/quran-metadata' {
    export function getSuraList(): any[];
    export function searchSuraByName(name: string): any[];
    export function searchSuraByBosnianName(name: string): any[];
    export function searchSuraByEnglishName(name: string): any[];
    export function searchSuraByArabicName(name: string): any[];
    export function getSuraByIndex(index: number): any;
    export function getSuraByPageNumber(page: number): any[];
    export function getJuzByPageNumber(page: number): any;
    export function sortSuraListByFirstPublished(): any[];
    export function sortSuraListByLastPublished(): any[];
    export function getSuraListPublishedInMekka(): any[];
    export function getSuraListPublishedInMedina(): any[];
    export function getSuraListByJuz(juzIndex: number): any[];
    export function getJuzList(): any[];
    export function getJuzById(id: number): any;
    export function searchJuzListById(id: any): any[];
    export function getNumberOfWordsAndLettersPerPage(page: number): any;
    export function getPageInfo(page: number): any;
    export function getSuraStartPage(suraNumber: number): number;
    export function getJuzStartPage(juzNumber: number): number;
    export function getHizbStartPage(hizbNumber: number): number;
    export function getManzilStartPage(manzilNumber: number): number;
    export function getSuraStartEndAyahIndex(suraNumber: number): any;
    export function getJuzStartEndAyahIndex(juzNumber: number): any;
    export function getHizbStartEndAyahIndex(hizbNumber: number): any;
    export function getPageStartEndAyahIndex(page: number): any;
}
