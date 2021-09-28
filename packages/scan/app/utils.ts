import { Maybe } from './types'

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const notEmpty = <T>(value: Maybe<T>): value is T =>
  value !== null && value !== undefined
