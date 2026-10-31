import { useEffect, useState } from 'react'
import { readJSON, writeJSON } from '../utils/inventory'

/**
 * useState that is transparently persisted to localStorage.
 * `initialValue` may be a value or a lazy initializer function.
 */
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = readJSON(key, undefined)
    if (stored !== undefined) return stored
    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  useEffect(() => {
    writeJSON(key, value)
  }, [key, value])

  return [value, setValue]
}
