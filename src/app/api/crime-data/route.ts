import { type NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// SiGesGuarda API Route — fetches real crime data from Curitiba open data portal
// and processes it into aggregated per-bairro statistics.
//
// Source: https://dadosabertos.curitiba.pr.gov.br (CC BY 4.0)
// ---------------------------------------------------------------------------

const MID_BASE_URL = 'https://mid.curitiba.pr.gov.br/dadosabertos/Sigesguarda/'

// In-memory server-side cache (persists across requests in the same process)
let cachedResult: { data: CrimeOutput[]; timestamp: number } | null = null
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CrimeOutput {
  bairro: string
  totalOcorrencias12m: number
  ocorrenciasPorKm2: number
  naturezas: Record<string, number>
  topNaturezas: { nome: string; count: number }[]
  tendencia: 'subindo' | 'estavel' | 'descendo'
  scorePercentil: number
}

// ---------------------------------------------------------------------------
// Bairro name normalization
// ---------------------------------------------------------------------------

const BAIRRO_NAME_MAP: Record<string, string> = {
  CIC: 'Cidade Industrial',
  'CIDADE INDUSTRIAL DE CURITIBA': 'Cidade Industrial',
  'CIDADE INDUSTRIAL': 'Cidade Industrial',
  'SAO FRANCISCO': 'São Francisco',
  'SAO LOURENCO': 'São Lourenço',
  'SAO BRAZ': 'São Braz',
  'SAO JOAO': 'São João',
  'SAO MIGUEL': 'São Miguel',
  'SANTO INACIO': 'Santo Inácio',
  'SITIO CERCADO': 'Sítio Cercado',
  BOQUEIRAO: 'Boqueirão',
  'CAPAO RASO': 'Capão Raso',
  'CAPAO DA IMBUIA': 'Capão da Imbuia',
  'CAMPO COMPRIDO': 'Campo Comprido',
  'CAMPO DE SANTANA': 'Campo de Santana',
  'SANTA CANDIDA': 'Santa Cândida',
  MERCES: 'Mercês',
  'AGUA VERDE': 'Água Verde',
  REBOUCAS: 'Rebouças',
  PORTAO: 'Portão',
  'ALTO DA GLORIA': 'Alto da Glória',
  'ALTO DA RUA XV': 'Alto da Rua XV',
  'CENTRO CIVICO': 'Centro Cívico',
  JUVEVE: 'Juvevê',
  LINDOIA: 'Lindóia',
  'PRACA 29 DE MARCO': 'Praça 29 de Março',
  'SANTA QUITERIA': 'Santa Quitéria',
  SEMINARIO: 'Seminário',
  TARUMA: 'Tarumã',
  UMBARA: 'Umbará',
  'JARDIM BOTANICO': 'Jardim Botânico',
  'JARDIM DAS AMERICAS': 'Jardim das Américas',
  GUAIRA: 'Guaíra',
  AHU: 'Ahú',
  AHUI: 'Ahú',
  MOSSUNGUE: 'Mossunguê',
  MOSSUNGUÉ: 'Mossunguê',
  PAJUCARA: 'Pajaçura',
  'SAO JOSE': 'São José',
  TABOAO: 'Taboão',
}

function normalizeBairroName(name: string): string {
  if (!name) return ''
  const trimmed = name.trim()
  if (BAIRRO_NAME_MAP[trimmed.toUpperCase()])
    return BAIRRO_NAME_MAP[trimmed.toUpperCase()]
  return trimmed
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase())
    .replace(/ Da /g, ' da ')
    .replace(/ De /g, ' de ')
    .replace(/ Do /g, ' do ')
    .replace(/ Das /g, ' das ')
    .replace(/ Dos /g, ' dos ')
}

// ---------------------------------------------------------------------------
// Crime weight classification
// ---------------------------------------------------------------------------

const CRIME_CONTRA_PESSOA = [
  'AGRESSAO',
  'AMEACA',
  'ROUBO',
  'ASSALTO',
  'LESAO CORPORAL',
  'ESTUPRO',
  'HOMICIDIO',
  'TENTATIVA DE HOMICIDIO',
  'SEQUESTRO',
  'VIOLENCIA DOMESTICA',
  'ABUSO',
  'MAUS TRATOS',
]
const CRIME_CONTRA_PATRIMONIO = [
  'FURTO',
  'VANDALISMO',
  'DANO',
  'ARROMBAMENTO',
  'INVASAO',
  'DEPREDACAO',
  'RECEPTACAO',
]
const PERTURBACAO = [
  'PERTURBACAO',
  'SOM ALTO',
  'BARULHO',
  'POLUICAO SONORA',
  'DESORDEM',
  'EMBRIAGUEZ',
]
const TRANSITO_KEYWORDS = ['ACIDENTE', 'TRANSITO', 'COLISAO', 'ATROPELAMENTO']

function getCrimeWeight(natureza: string): number {
  if (!natureza) return 0.5
  const upper = natureza.toUpperCase()
  if (CRIME_CONTRA_PESSOA.some((c) => upper.includes(c))) return 3
  if (CRIME_CONTRA_PATRIMONIO.some((c) => upper.includes(c))) return 2
  if (PERTURBACAO.some((c) => upper.includes(c))) return 1
  if (TRANSITO_KEYWORDS.some((c) => upper.includes(c))) return 0.5
  return 0.5
}

// ---------------------------------------------------------------------------
// Bairro areas (km²)
// ---------------------------------------------------------------------------

const BAIRRO_AREAS: Record<string, number> = {
  'Água Verde': 2.23,
  Ahú: 1.53,
  'Alto Boqueirão': 12.41,
  'Alto da Glória': 0.86,
  'Alto da Rua XV': 1.5,
  Abranches: 4.32,
  Atuba: 4.27,
  Augusta: 8.91,
  Bacacheri: 6.98,
  Barreirinha: 3.65,
  Batel: 1.76,
  Bigorrilho: 2.8,
  'Boa Vista': 5.07,
  'Bom Retiro': 1.93,
  Boqueirão: 14.8,
  Butiatuvinha: 11.72,
  Cabral: 2.04,
  Cachoeira: 3.24,
  Cajuru: 11.55,
  'Campina do Siqueira': 1.67,
  'Campo Comprido': 8.59,
  'Campo de Santana': 21.59,
  'Capão da Imbuia': 3.16,
  'Capão Raso': 5.04,
  Cascatinha: 2.98,
  Caximba: 28.56,
  Centro: 3.3,
  'Centro Cívico': 0.97,
  'Cidade Industrial': 43.38,
  'Cristo Rei': 1.44,
  Fanny: 1.02,
  Fazendinha: 3.72,
  Ganchinho: 11.4,
  Guabirotuba: 2.58,
  Guaíra: 2.32,
  Hauer: 2.04,
  'Hugo Lange': 1.18,
  'Jardim Botânico': 2.77,
  'Jardim das Américas': 3.87,
  'Jardim Social': 2.04,
  Juvevê: 1.07,
  'Lamenha Pequena': 3.4,
  Lindóia: 1.17,
  Mercês: 3.42,
  Mossunguê: 3.38,
  'Novo Mundo': 5.57,
  Orleans: 3.85,
  Pajaçura: 0.72,
  Parolin: 1.34,
  Pilarzinho: 7.13,
  Pinheirinho: 10.74,
  Portão: 5.69,
  'Prado Velho': 2.41,
  'Praça 29 de Março': 0.12,
  Rebouças: 2.99,
  Riviera: 3.14,
  'Santa Cândida': 10.33,
  'Santa Felicidade': 12.27,
  'Santa Quitéria': 2.09,
  'Santo Inácio': 2.57,
  'São Braz': 5.01,
  'São Francisco': 0.78,
  'São João': 2.87,
  'São José': 0.47,
  'São Lourenço': 2.26,
  'São Miguel': 4.08,
  Seminário: 2.13,
  'Sítio Cercado': 11.12,
  Taboão: 4.33,
  Tarumã: 4.5,
  Tatuquara: 11.23,
  Tingui: 2.05,
  Uberaba: 13.68,
  Umbará: 22.44,
  'Vista Alegre': 3.6,
  Xaxim: 8.97,
}

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

interface RawRecord {
  ATENDIMENTO_BAIRRO_NOME: string
  OCORRENCIA_DATA: string
  NATUREZA1_DESCRICAO: string
  NATUREZA2_DESCRICAO?: string
  NATUREZA3_DESCRICAO?: string
  NATUREZA4_DESCRICAO?: string
  NATUREZA5_DESCRICAO?: string
}

function parseCSV(content: string): RawRecord[] {
  const lines = content.split('\n')
  if (lines.length < 2) return []
  const header = lines[0].split(';').map((h) => h.trim().replace(/"/g, ''))
  const records: RawRecord[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = line.split(';').map((v) => v.trim().replace(/"/g, ''))
    const record: Record<string, string> = {}
    for (let j = 0; j < header.length; j++) {
      record[header[j]] = values[j] ?? ''
    }
    records.push(record as unknown as RawRecord)
  }
  return records
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
  }
  const d = new Date(dateStr)
  return Number.isNaN(d.getTime()) ? null : d
}

// ---------------------------------------------------------------------------
// Generate monthly CSV URLs for the last 24 months
// ---------------------------------------------------------------------------

function generateCSVUrls(): string[] {
  const urls: string[] = []
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(year, d.getMonth() + 1, 0).getDate()
    const filename = `${year}-${month}-01_${year}-${month}-${lastDay}_Sigesguarda.csv`
    urls.push(`${MID_BASE_URL}${filename}`)
  }
  return urls
}

// ---------------------------------------------------------------------------
// Process records into aggregated output
// ---------------------------------------------------------------------------

function processRecords(records: RawRecord[]): CrimeOutput[] {
  const now = new Date()
  const twelveMonthsAgo = new Date(now)
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  const twentyFourMonthsAgo = new Date(now)
  twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24)

  const current: Record<string, RawRecord[]> = {}
  const previous: Record<string, RawRecord[]> = {}

  for (const r of records) {
    const date = parseDate(r.OCORRENCIA_DATA)
    if (!date) continue
    const bairro = normalizeBairroName(r.ATENDIMENTO_BAIRRO_NOME)
    if (!bairro) continue
    if (date >= twelveMonthsAgo && date <= now) {
      if (!current[bairro]) current[bairro] = []
      current[bairro].push(r)
    } else if (date >= twentyFourMonthsAgo && date < twelveMonthsAgo) {
      if (!previous[bairro]) previous[bairro] = []
      previous[bairro].push(r)
    }
  }

  const allBairros = new Set([
    ...Object.keys(current),
    ...Object.keys(previous),
  ])
  const results: CrimeOutput[] = []
  const weightedScores: Record<string, number> = {}

  for (const bairro of allBairros) {
    const cur = current[bairro] ?? []
    const prev = previous[bairro] ?? []
    const naturezas: Record<string, number> = {}
    let totalWeighted = 0

    for (const r of cur) {
      for (const n of [
        r.NATUREZA1_DESCRICAO,
        r.NATUREZA2_DESCRICAO,
        r.NATUREZA3_DESCRICAO,
        r.NATUREZA4_DESCRICAO,
        r.NATUREZA5_DESCRICAO,
      ]) {
        if (!n) continue
        naturezas[n] = (naturezas[n] ?? 0) + 1
        totalWeighted += getCrimeWeight(n)
      }
    }

    const topNaturezas = Object.entries(naturezas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nome, count]) => ({ nome, count }))

    let tendencia: 'subindo' | 'estavel' | 'descendo' = 'estavel'
    if (prev.length > 0) {
      const change = (cur.length - prev.length) / prev.length
      if (change > 0.1) tendencia = 'subindo'
      else if (change < -0.1) tendencia = 'descendo'
    }

    const area = BAIRRO_AREAS[bairro] ?? 5
    weightedScores[bairro] = totalWeighted

    results.push({
      bairro,
      totalOcorrencias12m: cur.length,
      ocorrenciasPorKm2: Math.round((cur.length / area) * 10) / 10,
      naturezas,
      topNaturezas,
      tendencia,
      scorePercentil: 0,
    })
  }

  // Compute percentile scores (lower crime = higher score)
  const sorted = [...results].sort(
    (a, b) => (weightedScores[a.bairro] ?? 0) - (weightedScores[b.bairro] ?? 0),
  )
  const total = sorted.length
  for (let i = 0; i < total; i++) {
    const pct = total > 1 ? (i / (total - 1)) * 100 : 50
    const entry = results.find((r) => r.bairro === sorted[i].bairro)
    if (entry) {
      if (pct <= 10) entry.scorePercentil = 100
      else if (pct <= 25) entry.scorePercentil = 85
      else if (pct <= 50) entry.scorePercentil = 65
      else if (pct <= 75) entry.scorePercentil = 40
      else if (pct <= 90) entry.scorePercentil = 20
      else entry.scorePercentil = 5
    }
  }

  return results.sort((a, b) => a.bairro.localeCompare(b.bairro, 'pt-BR'))
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest) {
  // Return cached result if fresh
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
    return NextResponse.json(cachedResult.data, {
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=2592000' },
    })
  }

  try {
    const csvUrls = generateCSVUrls()
    const allRecords: RawRecord[] = []

    // Fetch CSVs in batches of 4 to avoid overwhelming the server
    for (let i = 0; i < csvUrls.length; i += 4) {
      const batch = csvUrls.slice(i, i + 4)
      const results = await Promise.allSettled(
        batch.map(async (url) => {
          const res = await fetch(url)
          if (!res.ok) return []
          const buf = await res.arrayBuffer()
          const content = new TextDecoder('latin1').decode(buf)
          return parseCSV(content)
        }),
      )
      for (const r of results) {
        if (r.status === 'fulfilled') allRecords.push(...r.value)
      }
    }

    if (allRecords.length === 0) {
      return NextResponse.json([], { status: 200 })
    }

    const data = processRecords(allRecords)
    cachedResult = { data, timestamp: Date.now() }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=2592000' },
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch crime data' },
      { status: 502 },
    )
  }
}
