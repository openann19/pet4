export type OptionalWithUndef<T> = {
  [P in keyof T]?: T[P] | undefined
}

