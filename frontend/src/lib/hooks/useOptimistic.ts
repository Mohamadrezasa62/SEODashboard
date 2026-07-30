'use client'

import { useState, useCallback } from 'react'

export function useOptimisticUpdate<T>(initialData: T) {
  const [optimisticData, setOptimisticData] = useState<T>(initialData)
  const [isRollingBack, setIsRollingBack] = useState(false)

  const applyOptimistic = useCallback((updater: (prev: T) => T) => {
    setOptimisticData((prev) => updater(prev))
  }, [])

  const rollback = useCallback((originalData: T) => {
    setIsRollingBack(true)
    setOptimisticData(originalData)
    setTimeout(() => setIsRollingBack(false), 300)
  }, [])

  return { optimisticData, applyOptimistic, rollback, isRollingBack }
}

export function useOptimisticList<T extends { id: string }>(initialList: T[]) {
  const [list, setList] = useState<T[]>(initialList)

  const addItem = useCallback((item: T) => {
    setList((prev) => [item, ...prev])
  }, [])

  const removeItem = useCallback((id: string) => {
    setList((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const updateItem = useCallback((id: string, updater: (item: T) => T) => {
    setList((prev) =>
      prev.map((item) => (item.id === id ? updater(item) : item))
    )
  }, [])

  const syncWithServer = useCallback((serverList: T[]) => {
    setList(serverList)
  }, [])

  return { list, addItem, removeItem, updateItem, syncWithServer }
}