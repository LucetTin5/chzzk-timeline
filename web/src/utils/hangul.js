const HANGUL_SYLLABLE_BASE = 0xac00;
const HANGUL_SYLLABLE_LAST = 0xd7a3;
const CHOSEONG_KEYS = ['r', 'R', 's', 'e', 'E', 'f', 'a', 'q', 'Q', 't', 'T', 'd', 'w', 'W', 'c', 'z', 'x', 'v', 'g'];
const JUNGSEONG_KEYS = ['k', 'o', 'i', 'O', 'j', 'p', 'u', 'P', 'h', 'hk', 'ho', 'hl', 'y', 'n', 'nj', 'np', 'nl', 'b', 'm', 'ml', 'l'];
const JONGSEONG_KEYS = ['', 'r', 'R', 'rt', 's', 'sw', 'sg', 'e', 'f', 'fr', 'fa', 'fq', 'ft', 'fx', 'fv', 'fg', 'a', 'q', 'qt', 't', 'T', 'd', 'w', 'c', 'z', 'x', 'v', 'g'];

const COMPATIBILITY_JAMO_TO_KEYS = (() => {
    const choseong = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const jungseong = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
    const jongseong = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

    const map = {};
    choseong.forEach((jamo, index) => {
        map[jamo] = (CHOSEONG_KEYS[index] ?? '').toLowerCase();
    });
    jungseong.forEach((jamo, index) => {
        map[jamo] = (JUNGSEONG_KEYS[index] ?? '').toLowerCase();
    });
    jongseong.forEach((jamo, index) => {
        if (!jamo) return;
        map[jamo] = (JONGSEONG_KEYS[index] ?? '').toLowerCase();
    });
    return map;
})();

const ASCII_ALPHANUMERIC = /[a-z0-9]/i;

export function hangulToKeystrokes(text = '') {
    if (!text) return '';

    let result = '';
    for (const char of text) {
        const code = char.charCodeAt(0);

        if (code >= HANGUL_SYLLABLE_BASE && code <= HANGUL_SYLLABLE_LAST) {
            const syllableIndex = code - HANGUL_SYLLABLE_BASE;
            const choIndex = Math.floor(syllableIndex / 588);
            const jungIndex = Math.floor((syllableIndex % 588) / 28);
            const jongIndex = syllableIndex % 28;

            result += (CHOSEONG_KEYS[choIndex] ?? '').toLowerCase();
            result += (JUNGSEONG_KEYS[jungIndex] ?? '').toLowerCase();
            if (jongIndex > 0) {
                result += (JONGSEONG_KEYS[jongIndex] ?? '').toLowerCase();
            }
            continue;
        }

        const mapped = COMPATIBILITY_JAMO_TO_KEYS[char];
        if (mapped) {
            result += mapped;
            continue;
        }

        if (ASCII_ALPHANUMERIC.test(char)) {
            result += char.toLowerCase();
            continue;
        }

        if (!/\s/.test(char)) {
            result += char.toLowerCase();
        }
    }

    return result;
}

export function levenshteinDistance(a = '', b = '', maxDistance = Infinity) {
    if (a === b) return 0;

    const aLength = a.length;
    const bLength = b.length;

    if (aLength === 0) return bLength;
    if (bLength === 0) return aLength;

    if (maxDistance !== Infinity && Math.abs(aLength - bLength) > maxDistance) {
        return maxDistance + 1;
    }

    let previousRow = new Array(bLength + 1);
    for (let j = 0; j <= bLength; j += 1) {
        previousRow[j] = j;
    }

    for (let i = 1; i <= aLength; i += 1) {
        const currentRow = new Array(bLength + 1);
        currentRow[0] = i;
        let rowMin = currentRow[0];
        const charA = a[i - 1];

        for (let j = 1; j <= bLength; j += 1) {
            const charB = b[j - 1];
            const insertCost = currentRow[j - 1] + 1;
            const deleteCost = previousRow[j] + 1;
            const replaceCost = previousRow[j - 1] + (charA === charB ? 0 : 1);
            const cell = Math.min(insertCost, deleteCost, replaceCost);

            currentRow[j] = cell;
            if (cell < rowMin) {
                rowMin = cell;
            }
        }

        if (maxDistance !== Infinity && rowMin > maxDistance) {
            return maxDistance + 1;
        }

        previousRow = currentRow;
    }

    return previousRow[bLength];
}

