'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { CATEGORY_NAMES } from '@/components/panel/category-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getScoreLabel } from '@/lib/score/weights'
import type { Bairro, BairroScore, CategoryKey } from '@/lib/types'

type SortColumn = 'rank' | 'nome' | 'regional' | 'overall' | CategoryKey

interface RankingTableProps {
  scores: BairroScore[]
  bairros: Bairro[]
}

const CATEGORY_KEYS: CategoryKey[] = [
  'saude',
  'educacao',
  'seguranca',
  'transporte',
  'areasVerdes',
  'cultura',
  'diversidade',
]

function ScoreBar({ score }: { score: number }) {
  const { color } = getScoreLabel(score)
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="min-w-[1.75rem] text-right text-xs font-medium tabular-nums"
        style={{ color }}
      >
        {Math.round(score)}
      </span>
    </div>
  )
}

function SortIcon({
  column,
  sortCol,
  sortDir,
}: {
  column: SortColumn
  sortCol: SortColumn
  sortDir: 'asc' | 'desc'
}) {
  if (column !== sortCol) {
    return (
      <svg
        className="ml-1 inline-block h-3 w-3 text-muted-foreground/50"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          d="M7 15l5 5 5-5M7 9l5-5 5 5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  return (
    <svg
      className="ml-1 inline-block h-3 w-3 text-primary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      {sortDir === 'asc' ? (
        <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

export function RankingTable({ scores, bairros }: RankingTableProps) {
  const router = useRouter()
  const [sortCol, setSortCol] = useState<SortColumn>('rank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')
  const [regionalFilter, setRegionalFilter] = useState('all')

  const bairroMap = useMemo(
    () => new Map(bairros.map((b) => [b.codigo, b])),
    [bairros],
  )

  const regionals = useMemo(() => {
    const set = new Set(bairros.map((b) => b.nmRegional))
    return Array.from(set).sort()
  }, [bairros])

  const rows = useMemo(() => {
    return scores
      .map((score) => {
        const bairro = bairroMap.get(score.bairroCode)
        return { score, bairro }
      })
      .filter(({ bairro }) => {
        if (!bairro) return false
        const matchSearch = bairro.nome
          .toLowerCase()
          .includes(search.toLowerCase())
        const matchRegional =
          regionalFilter === 'all' || bairro.nmRegional === regionalFilter
        return matchSearch && matchRegional
      })
  }, [scores, bairroMap, search, regionalFilter])

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let aVal: number | string
      let bVal: number | string

      switch (sortCol) {
        case 'rank':
          aVal = a.score.rank
          bVal = b.score.rank
          break
        case 'nome':
          aVal = a.bairro?.nome ?? ''
          bVal = b.bairro?.nome ?? ''
          break
        case 'regional':
          aVal = a.bairro?.nmRegional ?? ''
          bVal = b.bairro?.nmRegional ?? ''
          break
        case 'overall':
          aVal = a.score.overall
          bVal = b.score.overall
          break
        default:
          aVal = a.score.categories[sortCol]?.score ?? 0
          bVal = b.score.categories[sortCol]?.score ?? 0
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal, 'pt-BR')
          : bVal.localeCompare(aVal, 'pt-BR')
      }
      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
  }, [rows, sortCol, sortDir])

  function handleSort(col: SortColumn) {
    if (col === sortCol) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir(col === 'nome' || col === 'regional' ? 'asc' : 'desc')
    }
  }

  function handleRowClick(codigo: string) {
    router.push(`/?bairro=${codigo}`)
  }

  function SortableHead({
    col,
    children,
    className,
  }: {
    col: SortColumn
    children: React.ReactNode
    className?: string
  }) {
    return (
      <TableHead
        className={`cursor-pointer select-none whitespace-nowrap text-muted-foreground hover:text-foreground ${className ?? ''}`}
        onClick={() => handleSort(col)}
      >
        {children}
        <SortIcon column={col} sortCol={sortCol} sortDir={sortDir} />
      </TableHead>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Buscar bairro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <Select
          value={regionalFilter}
          onValueChange={(v) => setRegionalFilter(v ?? 'all')}
        >
          <SelectTrigger className="w-full border-border bg-card text-foreground sm:w-56">
            <SelectValue placeholder="Todas as regionais" />
          </SelectTrigger>
          <SelectContent className="border-border bg-card text-foreground">
            <SelectItem
              value="all"
              className="focus:bg-accent focus:text-foreground"
            >
              Todas as regionais
            </SelectItem>
            {regionals.map((r) => (
              <SelectItem
                key={r}
                value={r}
                className="focus:bg-accent focus:text-foreground"
              >
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        {sorted.length} bairro{sorted.length !== 1 ? 's' : ''} encontrado
        {sorted.length !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <SortableHead col="rank" className="w-12 text-center">
                #
              </SortableHead>
              <SortableHead col="nome">Bairro</SortableHead>
              <SortableHead col="regional">Regional</SortableHead>
              <SortableHead col="overall">Geral</SortableHead>
              {CATEGORY_KEYS.map((key) => (
                <SortableHead key={key} col={key} className="min-w-[7rem]">
                  {CATEGORY_NAMES[key]}
                </SortableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map(({ score, bairro }) => {
              if (!bairro) return null
              const { color, label } = getScoreLabel(score.overall)
              return (
                <TableRow
                  key={score.bairroCode}
                  className="cursor-pointer border-border transition-colors hover:bg-accent/50"
                  onClick={() => handleRowClick(score.bairroCode)}
                  title={`Ver ${bairro.nome} no mapa`}
                >
                  <TableCell className="text-center text-sm font-medium text-muted-foreground">
                    {score.rank}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">
                        {bairro.nome}
                      </p>
                      <p
                        className="text-xs font-semibold"
                        style={{ color }}
                        title={label}
                      >
                        {label}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {bairro.nmRegional}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${score.overall}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                      <span
                        className="min-w-[2rem] text-right text-sm font-bold tabular-nums"
                        style={{ color }}
                      >
                        {Math.round(score.overall)}
                      </span>
                    </div>
                  </TableCell>
                  {CATEGORY_KEYS.map((key) => (
                    <TableCell key={key}>
                      <ScoreBar score={score.categories[key]?.score ?? 0} />
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4 + CATEGORY_KEYS.length}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhum bairro encontrado com os filtros selecionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
