'use client'

import { Loader2, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { type NominatimResult, searchAddress } from '@/lib/api/nominatim'

interface AddressSearchProps {
  onSelect: (result: { lat: number; lng: number; displayName: string }) => void
  onClear: () => void
}

export function AddressSearch({ onSelect, onClear }: AddressSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([])
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const found = await searchAddress(query)
        setResults(found)
        setIsOpen(found.length > 0)
      } catch {
        setResults([])
        setIsOpen(false)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(result: NominatimResult) {
    setQuery(result.displayName)
    setIsOpen(false)
    setResults([])
    onSelect({
      lat: result.lat,
      lng: result.lng,
      displayName: result.displayName,
    })
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setIsOpen(false)
    onClear()
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto absolute top-4 left-1/2 z-[1000] w-full max-w-[400px] -translate-x-1/2 px-4"
    >
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <Search className="h-4 w-4 text-zinc-400" />
        </div>

        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Buscar endereço em Curitiba..."
          className="h-10 rounded-xl border-zinc-700 bg-zinc-900 pl-9 pr-9 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:border-zinc-500 focus-visible:ring-zinc-500/30"
        />

        <div className="absolute inset-y-0 right-3 flex items-center">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          ) : query.length > 0 ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpar busca"
              className="text-zinc-400 transition-colors hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <ul className="mt-1 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-lg">
          {results.map((result) => (
            <li key={`${result.lat},${result.lng}`}>
              <button
                type="button"
                onClick={() => handleSelect(result)}
                className="w-full px-4 py-2.5 text-left text-sm text-zinc-200 transition-colors hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none"
              >
                <span className="block truncate" title={result.displayName}>
                  {result.displayName}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
