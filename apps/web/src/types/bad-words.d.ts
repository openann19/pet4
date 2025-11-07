declare module 'bad-words' {
  export default class Filter {
    constructor(options?: { list?: string[], placeHolder?: string, regex?: RegExp, replaceRegex?: RegExp, splitRegex?: RegExp, emptyList?: boolean })
    isProfane(text: string): boolean
    replaceWord(word: string): string
    clean(text: string): string
    addWords(...words: string[]): void
    removeWords(...words: string[]): void
  }
}
