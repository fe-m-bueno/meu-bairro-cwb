/**
 * Script para processar dados do SiGesGuarda (Guarda Municipal de Curitiba)
 * e gerar JSON agregado de ocorrências por bairro.
 *
 * Fonte: https://dadosabertos.curitiba.pr.gov.br
 * Licença: CC BY 4.0
 *
 * Uso: npx tsx scripts/process-sigesguarda.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawRecord {
  ATENDIMENTO_BAIRRO_NOME: string
  REGIONAL_FATO_NOME: string
  OCORRENCIA_DATA: string
  OCORRENCIA_ANO: string
  NATUREZA1_DESCRICAO: string
  NATUREZA2_DESCRICAO?: string
  NATUREZA3_DESCRICAO?: string
  NATUREZA4_DESCRICAO?: string
  NATUREZA5_DESCRICAO?: string
  SUBCATEGORIA1_DESCRICAO?: string
  FLAG_FLAGRANTE?: string
}

interface BairroCrimeOutput {
  bairro: string
  totalOcorrencias12m: number
  ocorrenciasPorKm2: number
  naturezas: Record<string, number>
  topNaturezas: { nome: string; count: number }[]
  tendencia: 'subindo' | 'estavel' | 'descendo'
  scorePercentil: number
}

// ---------------------------------------------------------------------------
// Bairro name normalization (SiGesGuarda → IPPUC)
// ---------------------------------------------------------------------------

const BAIRRO_NAME_MAP: Record<string, string> = {
  'CIC': 'Cidade Industrial',
  'CIDADE INDUSTRIAL DE CURITIBA': 'Cidade Industrial',
  'CIDADE INDUSTRIAL': 'Cidade Industrial',
  'SAO FRANCISCO': 'São Francisco',
  'SAO LOURENCO': 'São Lourenço',
  'SAO BRAZ': 'São Braz',
  'SAO JOAO': 'São João',
  'SAO MIGUEL': 'São Miguel',
  'SANTO INACIO': 'Santo Inácio',
  'SITIO CERCADO': 'Sítio Cercado',
  'XAXIM': 'Xaxim',
  'TATUQUARA': 'Tatuquara',
  'BOQUEIRAO': 'Boqueirão',
  'CAJURU': 'Cajuru',
  'CAPAO RASO': 'Capão Raso',
  'CAPAO DA IMBUIA': 'Capão da Imbuia',
  'CAMPO COMPRIDO': 'Campo Comprido',
  'CAMPO DE SANTANA': 'Campo de Santana',
  'SANTA CANDIDA': 'Santa Cândida',
  'MERCES': 'Mercês',
  'AGUA VERDE': 'Água Verde',
  'REBOUCAS': 'Rebouças',
  'PORTAO': 'Portão',
  'PINHEIRINHO': 'Pinheirinho',
  'TINGUI': 'Tingui',
  'BACACHERI': 'Bacacheri',
  'BIGORRILHO': 'Bigorrilho',
  'ALTO DA GLORIA': 'Alto da Glória',
  'ALTO DA RUA XV': 'Alto da Rua XV',
  'BATEL': 'Batel',
  'BARREIRINHA': 'Barreirinha',
  'BOA VISTA': 'Boa Vista',
  'CABRAL': 'Cabral',
  'CENTRO': 'Centro',
  'CENTRO CIVICO': 'Centro Cívico',
  'CIDADE INDUSTRIAL ': 'Cidade Industrial',
  'CRISTO REI': 'Cristo Rei',
  'FANNY': 'Fanny',
  'FAZENDINHA': 'Fazendinha',
  'GUABIROTUBA': 'Guabirotuba',
  'GUAIRA': 'Guaíra',
  'HAUER': 'Hauer',
  'HUGO LANGE': 'Hugo Lange',
  'JUVEVE': 'Juvevê',
  'LINDOIA': 'Lindóia',
  'NOVO MUNDO': 'Novo Mundo',
  'ORLEANS': 'Orleans',
  'PAROLIN': 'Parolin',
  'PILARZINHO': 'Pilarzinho',
  'PRACA 29 DE MARCO': 'Praça 29 de Março',
  'RIVIERA': 'Riviera',
  'SANTA FELICIDADE': 'Santa Felicidade',
  'SANTA QUITERIA': 'Santa Quitéria',
  'SEMINARIO': 'Seminário',
  'TARUMA': 'Tarumã',
  'UBERABA': 'Uberaba',
  'UMBARA': 'Umbará',
  'VISTA ALEGRE': 'Vista Alegre',
  'JARDIM BOTANICO': 'Jardim Botânico',
  'JARDIM DAS AMERICAS': 'Jardim das Américas',
  'JARDIM SOCIAL': 'Jardim Social',
  'ABRANCHES': 'Abranches',
  'AHUI': 'Ahú',
  'AHU': 'Ahú',
  'ATUBA': 'Atuba',
  'AUGUSTA': 'Augusta',
  'BUTIATUVINHA': 'Butiatuvinha',
  'CACHOEIRA': 'Cachoeira',
  'CAMPINA DO SIQUEIRA': 'Campina do Siqueira',
  'CASCATINHA': 'Cascatinha',
  'GANCHINHO': 'Ganchinho',
  'LAMENHA PEQUENA': 'Lamenha Pequena',
  'MOSSUNGUE': 'Mossunguê',
  'MOSSUNGUÉ': 'Mossunguê',
  'PAJUCARA': 'Pajaçura',
  'PRADO VELHO': 'Prado Velho',
  'SAO JOSE': 'São José',
  'TABOAO': 'Taboão',
}

function normalizeBairroName(name: string): string {
  if (!name) return ''
  const trimmed = name.trim()
  // Check exact match in mapping first
  if (BAIRRO_NAME_MAP[trimmed.toUpperCase()]) {
    return BAIRRO_NAME_MAP[trimmed.toUpperCase()]
  }
  // Title case the name as fallback
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
// Crime category classification
// ---------------------------------------------------------------------------

const CRIME_CONTRA_PESSOA = [
  'AGRESSAO', 'AMEACA', 'ROUBO', 'ASSALTO', 'LESAO CORPORAL',
  'ESTUPRO', 'HOMICIDIO', 'TENTATIVA DE HOMICIDIO', 'SEQUESTRO',
  'VIOLENCIA DOMESTICA', 'ABUSO', 'MAUS TRATOS',
]

const CRIME_CONTRA_PATRIMONIO = [
  'FURTO', 'VANDALISMO', 'DANO', 'ARROMBAMENTO', 'INVASAO',
  'DEPREDACAO', 'RECEPTACAO',
]

const PERTURBACAO = [
  'PERTURBACAO', 'SOM ALTO', 'BARULHO', 'POLUICAO SONORA',
  'DESORDEM', 'EMBRIAGUEZ',
]

const TRANSITO = [
  'ACIDENTE', 'TRANSITO', 'COLISAO', 'ATROPELAMENTO',
]

function getCrimeWeight(natureza: string): number {
  if (!natureza) return 0.5
  const upper = natureza.toUpperCase()
  if (CRIME_CONTRA_PESSOA.some((c) => upper.includes(c))) return 3
  if (CRIME_CONTRA_PATRIMONIO.some((c) => upper.includes(c))) return 2
  if (PERTURBACAO.some((c) => upper.includes(c))) return 1
  if (TRANSITO.some((c) => upper.includes(c))) return 0.5
  return 0.5
}

// ---------------------------------------------------------------------------
// Approximate bairro areas (km²) for density calculation
// Source: IPPUC estimates
// ---------------------------------------------------------------------------

const BAIRRO_AREAS: Record<string, number> = {
  'Água Verde': 2.23,
  'Ahú': 1.53,
  'Alto Boqueirão': 12.41,
  'Alto da Glória': 0.86,
  'Alto da Rua XV': 1.5,
  'Abranches': 4.32,
  'Atuba': 4.27,
  'Augusta': 8.91,
  'Bacacheri': 6.98,
  'Barreirinha': 3.65,
  'Batel': 1.76,
  'Bigorrilho': 2.80,
  'Boa Vista': 5.07,
  'Bom Retiro': 1.93,
  'Boqueirão': 14.80,
  'Butiatuvinha': 11.72,
  'Cabral': 2.04,
  'Cachoeira': 3.24,
  'Cajuru': 11.55,
  'Campina do Siqueira': 1.67,
  'Campo Comprido': 8.59,
  'Campo de Santana': 21.59,
  'Capão da Imbuia': 3.16,
  'Capão Raso': 5.04,
  'Cascatinha': 2.98,
  'Caximba': 28.56,
  'Centro': 3.30,
  'Centro Cívico': 0.97,
  'Cidade Industrial': 43.38,
  'Cristo Rei': 1.44,
  'Fanny': 1.02,
  'Fazendinha': 3.72,
  'Ganchinho': 11.40,
  'Guabirotuba': 2.58,
  'Guaíra': 2.32,
  'Hauer': 2.04,
  'Hugo Lange': 1.18,
  'Jardim Botânico': 2.77,
  'Jardim das Américas': 3.87,
  'Jardim Social': 2.04,
  'Juvevê': 1.07,
  'Lamenha Pequena': 3.40,
  'Lindóia': 1.17,
  'Mercês': 3.42,
  'Mossunguê': 3.38,
  'Novo Mundo': 5.57,
  'Orleans': 3.85,
  'Pajaçura': 0.72,
  'Parolin': 1.34,
  'Pilarzinho': 7.13,
  'Pinheirinho': 10.74,
  'Portão': 5.69,
  'Prado Velho': 2.41,
  'Praça 29 de Março': 0.12,
  'Rebouças': 2.99,
  'Riviera': 3.14,
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
  'Seminário': 2.13,
  'Sítio Cercado': 11.12,
  'Taboão': 4.33,
  'Tarumã': 4.50,
  'Tatuquara': 11.23,
  'Tingui': 2.05,
  'Uberaba': 13.68,
  'Umbará': 22.44,
  'Vista Alegre': 3.60,
  'Xaxim': 8.97,
}

// ---------------------------------------------------------------------------
// CSV Parsing (simple, handles ; separator and Latin-1)
// ---------------------------------------------------------------------------

function parseCSV(content: string): RawRecord[] {
  const lines = content.split('\n')
  if (lines.length < 2) return []

  // Auto-detect separator: check if header has more commas or semicolons
  const headerLine = lines[0]
  const sep = (headerLine.match(/,/g) ?? []).length > (headerLine.match(/;/g) ?? []).length ? ',' : ';'

  const header = headerLine.split(sep).map((h) => h.trim().replace(/"/g, ''))
  const records: RawRecord[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = line.split(sep).map((v) => v.trim().replace(/"/g, ''))
    const record: Record<string, string> = {}
    for (let j = 0; j < header.length; j++) {
      record[header[j]] = values[j] ?? ''
    }
    records.push(record as unknown as RawRecord)
  }

  return records
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  // DD/MM/YYYY
  const slashParts = dateStr.split('/')
  if (slashParts.length === 3 && slashParts[2].length === 4) {
    const [day, month, year] = slashParts
    return new Date(Number(year), Number(month) - 1, Number(day))
  }
  // YYYY-MM-DD or YYYY-MM-DD HH:MM:SS.sss
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
  }
  return null
}

// ---------------------------------------------------------------------------
// Main processing
// ---------------------------------------------------------------------------

async function downloadCSV(url: string): Promise<string> {
  console.log(`  Downloading: ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`)
  const buffer = await res.arrayBuffer()
  // Try Latin-1 decoding first (the CSVs are typically in Latin-1)
  const decoder = new TextDecoder('latin1')
  return decoder.decode(buffer)
}

async function listAvailableCSVs(): Promise<string[]> {
  // Primary source: Curitiba official open data portal (actively maintained)
  const portalBaseUrl = 'https://mid-dadosabertos.curitiba.pr.gov.br/Sigesguarda/'
  const apiUrl = 'https://dadosabertos.curitiba.pr.gov.br/ConjuntoDado/DownloadArquivos/?conjuntoDadoChave=b16ead9d-835e-41e8-a4d7-dcc4f2b4b627&conjuntoDadoExtensao=377f4e23-0e4f-4f11-954f-ae06ba689558&pagina=1&tamanhoPagina=100'
  console.log('Fetching file listing from Curitiba open data portal...')

  try {
    const res = await fetch(apiUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { htmlPaginacao?: string; htmlArquivos?: string }
    const html = json.htmlArquivos ?? ''
    // Extract download links from the HTML response
    const urlRegex = /href="(https?:\/\/[^"]*\.csv)"/gi
    const files: string[] = []
    for (const match of html.matchAll(urlRegex)) {
      files.push(match[1])
    }
    if (files.length > 0) {
      console.log(`Found ${files.length} CSV file(s) on official portal`)
      return files
    }
  } catch (err) {
    console.warn(`Portal API failed: ${err}`)
  }

  // Fallback: C3SL mirror (may be stale)
  const fallbackUrl = 'http://dadosabertos.c3sl.ufpr.br/curitiba/Sigesguarda/'
  console.log('Falling back to C3SL mirror...')
  const res = await fetch(fallbackUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching index`)
  const html = await res.text()

  const csvRegex = /href="([^"]*\.csv)"/gi
  const files: string[] = []
  for (const match of html.matchAll(csvRegex)) {
    files.push(match[1])
  }

  return files.map((f) => `${fallbackUrl}${f}`)
}

function processRecords(records: RawRecord[]) {
  // Find the most recent date in the data to use as reference
  // (data may lag behind the current date)
  let maxDate = new Date(0)
  for (const r of records) {
    const d = parseDate(r.OCORRENCIA_DATA)
    if (d && d > maxDate) maxDate = d
  }
  const now = maxDate.getTime() > 0 ? maxDate : new Date()
  console.log(`  Data date range ends at: ${now.toISOString().slice(0, 10)}`)
  const twelveMonthsAgo = new Date(now)
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  const twentyFourMonthsAgo = new Date(now)
  twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24)

  // Group by bairro and period
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

  // Calculate weighted scores per bairro
  const allBairros = new Set([...Object.keys(current), ...Object.keys(previous)])
  const results: BairroCrimeOutput[] = []

  const weightedScores: Record<string, number> = {}

  for (const bairro of allBairros) {
    const currentRecords = current[bairro] ?? []
    const previousRecords = previous[bairro] ?? []

    // Count naturezas
    const naturezas: Record<string, number> = {}
    let totalWeighted = 0

    for (const r of currentRecords) {
      const allNaturezas = [
        r.NATUREZA1_DESCRICAO,
        r.NATUREZA2_DESCRICAO,
        r.NATUREZA3_DESCRICAO,
        r.NATUREZA4_DESCRICAO,
        r.NATUREZA5_DESCRICAO,
      ].filter(Boolean)

      for (const n of allNaturezas) {
        if (!n) continue
        naturezas[n] = (naturezas[n] ?? 0) + 1
        totalWeighted += getCrimeWeight(n)
      }
    }

    // Top naturezas
    const topNaturezas = Object.entries(naturezas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nome, count]) => ({ nome, count }))

    // Tendência
    const currentCount = currentRecords.length
    const previousCount = previousRecords.length
    let tendencia: 'subindo' | 'estavel' | 'descendo' = 'estavel'
    if (previousCount > 0) {
      const change = (currentCount - previousCount) / previousCount
      if (change > 0.1) tendencia = 'subindo'
      else if (change < -0.1) tendencia = 'descendo'
    }

    // Density (per km²)
    const area = BAIRRO_AREAS[bairro] ?? 5 // default 5 km² if unknown
    const ocorrenciasPorKm2 = Math.round((currentCount / area) * 10) / 10

    weightedScores[bairro] = totalWeighted

    results.push({
      bairro,
      totalOcorrencias12m: currentCount,
      ocorrenciasPorKm2,
      naturezas,
      topNaturezas,
      tendencia,
      scorePercentil: 0, // computed below
    })
  }

  // Compute percentile scores (lower crime = higher score)
  const sortedByWeighted = [...results].sort(
    (a, b) => (weightedScores[a.bairro] ?? 0) - (weightedScores[b.bairro] ?? 0),
  )

  const total = sortedByWeighted.length
  for (let i = 0; i < total; i++) {
    const percentile = total > 1 ? (i / (total - 1)) * 100 : 50
    // Lower crime = higher percentile rank, so invert is NOT needed
    // i=0 is least crime → highest score
    const bairro = sortedByWeighted[i].bairro
    const entry = results.find((r) => r.bairro === bairro)
    if (entry) {
      // Percentile to score mapping
      if (percentile <= 10) entry.scorePercentil = 5
      else if (percentile <= 25) entry.scorePercentil = 20
      else if (percentile <= 50) entry.scorePercentil = 40
      else if (percentile <= 75) entry.scorePercentil = 65
      else if (percentile <= 90) entry.scorePercentil = 85
      else entry.scorePercentil = 100
    }
  }

  return results
}

async function main() {
  console.log('=== SiGesGuarda Data Processor ===\n')

  const allRecords: RawRecord[] = []

  try {
    // Each CSV is cumulative (contains ALL records up to that month),
    // so we only need the most recent one.
    // Try direct download from official portal first (has most recent data)
    const portalBase = 'https://mid-dadosabertos.curitiba.pr.gov.br/Sigesguarda/'
    let latestUrl: string | null = null

    // Try recent months from official portal (newest first)
    const now = new Date()
    for (let i = 0; i < 6 && !latestUrl; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      const url = `${portalBase}${dateStr}_sigesguarda_-_Base_de_Dados.csv`
      console.log(`  Trying: ${url}`)
      const head = await fetch(url, { method: 'HEAD' })
      if (head.ok) {
        latestUrl = url
      }
    }

    // Fallback: list from C3SL mirror
    if (!latestUrl) {
      console.log('Official portal files not found, falling back to C3SL mirror...')
      const csvUrls = await listAvailableCSVs()
      console.log(`Found ${csvUrls.length} CSV file(s)\n`)
      const datedUrls = csvUrls.filter((u) => /\d{4}-\d{2}-\d{2}/.test(u))
      datedUrls.sort().reverse()
      latestUrl = datedUrls[0]
    }

    console.log(`\nUsing most recent: ${latestUrl}\n`)

    const content = await downloadCSV(latestUrl)
    const records = parseCSV(content)
    console.log(`  → Parsed ${records.length} records`)
    for (const r of records) {
      allRecords.push(r)
    }
  } catch (err) {
    console.warn(`Failed to list CSVs: ${err}`)
    console.log('\nTrying to read local CSV files from scripts/data/ ...')

    // Fallback: try reading local files
    const localDir = join(import.meta.dirname ?? '.', 'data')
    if (existsSync(localDir)) {
      const { readdirSync } = await import('node:fs')
      const files = readdirSync(localDir).filter((f: string) => f.endsWith('.csv'))
      for (const file of files) {
        const content = readFileSync(join(localDir, file), 'latin1')
        const records = parseCSV(content)
        console.log(`  → ${file}: ${records.length} records`)
        allRecords.push(...records)
      }
    }
  }

  console.log(`\nTotal records: ${allRecords.length}`)

  if (allRecords.length === 0) {
    console.log('\nNo records found. Generating empty output file.')
    const outDir = join(process.cwd(), 'public', 'data')
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'ocorrencias-por-bairro.json'), '[]', 'utf-8')
    return
  }

  const results = processRecords(allRecords)

  // Sort by bairro name for readability
  results.sort((a, b) => a.bairro.localeCompare(b.bairro, 'pt-BR'))

  const outDir = join(process.cwd(), 'public', 'data')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, 'ocorrencias-por-bairro.json')
  writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8')

  console.log(`\n✓ Output: ${outPath}`)
  console.log(`✓ Bairros with data: ${results.length}`)
  console.log(
    `✓ Total ocorrências (12m): ${results.reduce((s, r) => s + r.totalOcorrencias12m, 0)}`,
  )
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
