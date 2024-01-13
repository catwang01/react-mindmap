export const trimWord = (s: string, word: string) => {
    return trimWordEnd(trimWordStart(s, word), word)
}

export const trimWordStart = (s: string, word: string) => {
    const regExp = new RegExp(`^(${word})*`)
    return s.replace(regExp, '');
}

export const trimWordEnd = (s: string, word: string) => {
    const regExp = new RegExp(`(${word})*$`)
    return s.replace(regExp, '');
}