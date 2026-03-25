export default function MetodologiaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-zinc-100">Metodologia</h1>
      <p className="mb-8 text-sm text-zinc-400">
        Entenda como calculamos o índice de qualidade de vida de cada bairro.
      </p>

      {/* Sumário */}
      <nav className="mb-10 rounded-lg border border-zinc-800 bg-zinc-900/60 px-5 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Índice
        </p>
        <ol className="space-y-1 text-sm">
          {[
            ['#introducao', 'Introdução'],
            ['#formula', 'Como o Score é Calculado'],
            ['#saude', 'Saúde'],
            ['#educacao', 'Educação'],
            ['#seguranca', 'Segurança'],
            ['#transporte', 'Transporte'],
            ['#areas-verdes', 'Áreas Verdes'],
            ['#cultura', 'Cultura & Esporte'],
            ['#diversidade', 'Diversidade de Serviços'],
            ['#fontes', 'Fontes de Dados'],
            ['#limitacoes', 'Limitações'],
          ].map(([href, label]) => (
            <li key={href}>
              <a
                href={href}
                className="text-emerald-400 underline-offset-2 hover:underline"
              >
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-12 text-sm leading-relaxed text-zinc-300">
        {/* Introdução */}
        <section id="introducao">
          <SectionTitle>Introdução</SectionTitle>
          <p>
            Este app avalia a qualidade de vida dos 75 bairros de Curitiba
            usando dados públicos reais. Cada bairro recebe um índice geral de 0
            a 100 composto por sete categorias temáticas, calculadas a partir de
            equipamentos urbanos oficiais disponibilizados pelo IPPUC /
            GeoCuritiba.
          </p>
          <p className="mt-3">
            O objetivo é responder uma pergunta simples:{' '}
            <strong className="text-zinc-100">
              &quot;É um bom lugar para se viver?&quot;
            </strong>{' '}
            — com base em dados, não opiniões.
          </p>
        </section>

        {/* Fórmula */}
        <section id="formula">
          <SectionTitle>Como o Score é Calculado</SectionTitle>
          <p className="mb-4">
            O índice geral é a média ponderada das sete categorias:
          </p>
          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <Th>Categoria</Th>
                  <Th>Peso</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Saúde', '20%'],
                  ['Educação', '18%'],
                  ['Transporte', '18%'],
                  ['Segurança', '17%'],
                  ['Áreas Verdes', '12%'],
                  ['Cultura & Esporte', '8%'],
                  ['Diversidade de Serviços', '7%'],
                ].map(([cat, peso]) => (
                  <tr key={cat} className="border-b border-zinc-800/50">
                    <Td>{cat}</Td>
                    <Td>
                      <span className="font-semibold text-emerald-400">
                        {peso}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CodeBlock>
            {`índice_geral =
  (saúde × 0,20) +
  (educação × 0,18) +
  (transporte × 0,18) +
  (segurança × 0,17) +
  (áreas_verdes × 0,12) +
  (cultura × 0,08) +
  (diversidade × 0,07)`}
          </CodeBlock>
          <p className="mt-4 mb-2 text-zinc-400">Classificação do índice:</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ['85–100', 'Excelente', '#10b981'],
              ['70–84', 'Muito Bom', '#22c55e'],
              ['55–69', 'Bom', '#84cc16'],
              ['40–54', 'Regular', '#eab308'],
              ['25–39', 'Abaixo da Média', '#f97316'],
              ['0–24', 'Crítico', '#ef4444'],
            ].map(([range, label, color]) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-md border border-zinc-800 px-3 py-2"
              >
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs">
                  <span className="font-semibold text-zinc-100">{range}</span>{' '}
                  <span className="text-zinc-400">{label}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Saúde */}
        <section id="saude">
          <SectionTitle>
            Saúde <WeightBadge>20%</WeightBadge>
          </SectionTitle>
          <p className="mb-4">
            Mede o acesso a unidades de saúde pública: UBS, UPA, hospitais,
            centros de especialidades e CAPS.
          </p>
          <ThresholdTable
            rows={[
              {
                factor: 'UBS mais próxima (peso 40%)',
                thresholds: [
                  ['< 500 m', '100'],
                  ['< 1 km', '80'],
                  ['< 2 km', '50'],
                  ['< 3 km', '20'],
                  ['> 3 km', '5'],
                ],
              },
              {
                factor: 'Hospital / UPA mais próximo (peso 35%)',
                thresholds: [
                  ['< 1 km', '100'],
                  ['< 2 km', '80'],
                  ['< 3 km', '60'],
                  ['< 5 km', '30'],
                  ['> 5 km', '5'],
                ],
              },
              {
                factor: 'Densidade — unidades em 1 km (peso 25%)',
                thresholds: [
                  ['≥ 5', '100'],
                  ['4', '80'],
                  ['3', '60'],
                  ['2', '40'],
                  ['1', '20'],
                  ['0', '0'],
                ],
              },
            ]}
          />
        </section>

        {/* Educação */}
        <section id="educacao">
          <SectionTitle>
            Educação <WeightBadge>18%</WeightBadge>
          </SectionTitle>
          <p className="mb-4">
            Mede a proximidade a escolas municipais e CMEIs (educação infantil).
            O score é a média simples dos três fatores.
          </p>
          <ThresholdTable
            rows={[
              {
                factor: 'Escola municipal mais próxima',
                thresholds: [
                  ['< 500 m', '100'],
                  ['< 1 km', '80'],
                  ['< 1,5 km', '50'],
                  ['< 2 km', '30'],
                  ['> 2 km', '5'],
                ],
              },
              {
                factor: 'CMEI mais próximo',
                thresholds: [
                  ['< 500 m', '100'],
                  ['< 1 km', '80'],
                  ['< 1,5 km', '50'],
                  ['< 2 km', '30'],
                  ['> 2 km', '5'],
                ],
              },
              {
                factor: 'Densidade — unidades em 1 km',
                thresholds: [
                  ['≥ 6', '100'],
                  ['4–5', '80'],
                  ['3', '60'],
                  ['2', '40'],
                  ['1', '20'],
                  ['0', '0'],
                ],
              },
            ]}
          />
        </section>

        {/* Segurança */}
        <section id="seguranca">
          <SectionTitle>
            Segurança <WeightBadge>17%</WeightBadge>
          </SectionTitle>
          <p className="mb-4">
            Mede a proximidade a Polícia Militar, Guarda Municipal, delegacias e
            Corpo de Bombeiros.
          </p>
          <ThresholdTable
            rows={[
              {
                factor: 'PM / Guarda Municipal mais próximo (peso 35%)',
                thresholds: [
                  ['< 1 km', '100'],
                  ['< 2 km', '70'],
                  ['< 3 km', '40'],
                  ['> 3 km', '10'],
                ],
              },
              {
                factor: 'Delegacia mais próxima (peso 25%)',
                thresholds: [
                  ['< 2 km', '100'],
                  ['< 3 km', '70'],
                  ['< 5 km', '40'],
                  ['> 5 km', '10'],
                ],
              },
              {
                factor: 'Bombeiros mais próximos (peso 20%)',
                thresholds: [
                  ['< 2 km', '100'],
                  ['< 3 km', '70'],
                  ['< 5 km', '40'],
                  ['> 5 km', '10'],
                ],
              },
              {
                factor: 'Densidade — unidades em 2 km (peso 20%)',
                thresholds: [
                  ['≥ 4', '100'],
                  ['3', '75'],
                  ['2', '50'],
                  ['1', '25'],
                  ['0', '0'],
                ],
              },
            ]}
          />
        </section>

        {/* Transporte */}
        <section id="transporte">
          <SectionTitle>
            Transporte <WeightBadge>18%</WeightBadge>
          </SectionTitle>
          <p className="mb-4">
            Mede o acesso ao transporte público — paradas, terminais e variedade
            de linhas.
          </p>
          <ThresholdTable
            rows={[
              {
                factor: 'Paradas de ônibus em 500 m (peso 45%)',
                thresholds: [
                  ['≥ 15', '100'],
                  ['10–14', '85'],
                  ['5–9', '65'],
                  ['2–4', '40'],
                  ['1', '20'],
                  ['0', '0'],
                ],
              },
              {
                factor: 'Terminal mais próximo (peso 30%)',
                thresholds: [
                  ['< 500 m', '100'],
                  ['< 1 km', '80'],
                  ['< 2 km', '60'],
                  ['< 3 km', '30'],
                  ['> 3 km', '10'],
                ],
              },
              {
                factor: 'Linhas únicas pelo bairro (peso 25%)',
                thresholds: [
                  ['≥ 10', '100'],
                  ['7–9', '80'],
                  ['4–6', '60'],
                  ['2–3', '35'],
                  ['1', '15'],
                  ['0', '0'],
                ],
              },
            ]}
          />
        </section>

        {/* Áreas Verdes */}
        <section id="areas-verdes">
          <SectionTitle>
            Áreas Verdes <WeightBadge>12%</WeightBadge>
          </SectionTitle>
          <p className="mb-4">
            Mede o acesso a parques, bosques e áreas de conservação.
          </p>
          <ThresholdTable
            rows={[
              {
                factor: 'Parque / bosque mais próximo (peso 40%)',
                thresholds: [
                  ['< 300 m', '100'],
                  ['< 500 m', '85'],
                  ['< 1 km', '65'],
                  ['< 2 km', '35'],
                  ['> 2 km', '10'],
                ],
              },
              {
                factor: 'Cobertura verde — % da área do bairro (peso 35%)',
                thresholds: [
                  ['> 15%', '100'],
                  ['10–15%', '80'],
                  ['5–10%', '55'],
                  ['1–5%', '30'],
                  ['< 1%', '5'],
                ],
              },
              {
                factor: 'Parques em 2 km (peso 25%)',
                thresholds: [
                  ['≥ 4', '100'],
                  ['3', '75'],
                  ['2', '50'],
                  ['1', '25'],
                  ['0', '0'],
                ],
              },
            ]}
          />
        </section>

        {/* Cultura */}
        <section id="cultura">
          <SectionTitle>
            Cultura & Esporte <WeightBadge>8%</WeightBadge>
          </SectionTitle>
          <p className="mb-4">
            Mede o acesso a bibliotecas, museus, equipamentos esportivos e
            centros comunitários. O score é a média simples dos dois fatores.
          </p>
          <ThresholdTable
            rows={[
              {
                factor: 'Densidade — unidades no bairro + 1 km',
                thresholds: [
                  ['≥ 5', '100'],
                  ['3–4', '75'],
                  ['2', '50'],
                  ['1', '25'],
                  ['0', '0'],
                ],
              },
              {
                factor: 'Unidade mais próxima',
                thresholds: [
                  ['< 500 m', '100'],
                  ['< 1 km', '70'],
                  ['< 2 km', '40'],
                  ['> 2 km', '10'],
                ],
              },
            ]}
          />
        </section>

        {/* Diversidade */}
        <section id="diversidade">
          <SectionTitle>
            Diversidade de Serviços <WeightBadge>7%</WeightBadge>
          </SectionTitle>
          <p className="mb-4">
            Mede quantas <em>categorias diferentes</em> de serviços essenciais
            estão acessíveis — não a quantidade, mas a variedade.
          </p>
          <div className="mb-4 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <Th>Categoria verificada</Th>
                  <Th>Raio considerado</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Saúde (UBS / hospital / UPA)', '2 km'],
                  ['Educação (escola / CMEI)', '1,5 km'],
                  ['Segurança (PM / delegacia / bombeiros)', '3 km'],
                  ['Transporte (parada de ônibus)', '500 m'],
                  ['Área verde (parque)', '1 km'],
                  ['Cultura / esporte', '2 km'],
                ].map(([cat, raio]) => (
                  <tr key={cat} className="border-b border-zinc-800/50">
                    <Td>{cat}</Td>
                    <Td>{raio}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ThresholdTable
            rows={[
              {
                factor: 'Categorias presentes',
                thresholds: [
                  ['6 de 6', '100'],
                  ['5 de 6', '80'],
                  ['4 de 6', '60'],
                  ['3 de 6', '40'],
                  ['2 de 6', '20'],
                  ['≤ 1 de 6', '5'],
                ],
              },
            ]}
          />
        </section>

        {/* Fontes */}
        <section id="fontes">
          <SectionTitle>Fontes de Dados</SectionTitle>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-zinc-100">
                Limites dos Bairros (GeoJSON):
              </strong>{' '}
              IPPUC GeoCuritiba — MapaCadastral Layer 2.{' '}
              <a
                href="https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                ArcGIS REST API
              </a>
            </li>
            <li>
              <strong className="text-zinc-100">
                Equipamentos Urbanos (saúde, educação, segurança, cultura):
              </strong>{' '}
              IPPUC GeoCuritiba —{' '}
              <a
                href="https://geocuritiba.ippuc.org.br/server/rest/services/Publico_GeoCuritiba_Equipamentos_Urbanos/MapServer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                Equipamentos Urbanos MapServer
              </a>
            </li>
            <li>
              <strong className="text-zinc-100">
                Transporte Público (paradas, terminais, linhas):
              </strong>{' '}
              URBS / IPPUC —{' '}
              <a
                href="https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/URBS_Transporte_Publico/MapServer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                URBS Transporte Público MapServer
              </a>
            </li>
            <li>
              <strong className="text-zinc-100">
                Unidades de Conservação (áreas verdes):
              </strong>{' '}
              IPPUC —{' '}
              <a
                href="https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_Sistema_Municipal_de_Unidades_de_Conservacao/FeatureServer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                Sistema Municipal de Unidades de Conservação
              </a>
            </li>
            <li>
              <strong className="text-zinc-100">Geocodificação:</strong>{' '}
              <a
                href="https://nominatim.openstreetmap.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                Nominatim / OpenStreetMap
              </a>{' '}
              (busca de endereços)
            </li>
          </ul>
          <p className="mt-4 text-xs text-zinc-500">
            Todos os dados são públicos e não requerem autenticação. O app
            consulta as APIs diretamente no navegador do usuário.
          </p>
        </section>

        {/* Limitações */}
        <section id="limitacoes">
          <SectionTitle>Limitações</SectionTitle>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              As distâncias são calculadas a partir do{' '}
              <strong className="text-zinc-100">centroide do bairro</strong>{' '}
              (ponto central geométrico), não da borda mais próxima. Bairros
              grandes podem ter partes que estão mais próximas de um equipamento
              do que o centroide sugere.
            </li>
            <li>
              Os dados refletem os equipamentos públicos{' '}
              <strong className="text-zinc-100">cadastrados no IPPUC</strong>.
              Estabelecimentos privados (clínicas, escolas particulares, etc.)
              não são considerados.
            </li>
            <li>
              A data de atualização dos dados depende do IPPUC / GeoCuritiba.
              Novos equipamentos ou remoções podem não estar refletidos
              imediatamente.
            </li>
            <li>
              Fatores subjetivos de qualidade de vida — custo do aluguel,
              criminalidade, poluição sonora, calçadas — não são incluídos por
              falta de dados públicos estruturados.
            </li>
            <li>
              O score de <em>Diversidade</em> mede presença/ausência de
              categorias, não a qualidade dos serviços.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-100 border-b border-zinc-800 pb-2">
      {children}
    </h2>
  )
}

function WeightBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-xs font-semibold text-emerald-400">
      {children}
    </span>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2.5 text-zinc-300">{children}</td>
}

interface ThresholdTableProps {
  rows: Array<{
    factor: string
    thresholds: Array<[string, string]>
  }>
}

function ThresholdTable({ rows }: ThresholdTableProps) {
  return (
    <div className="space-y-4">
      {rows.map(({ factor, thresholds }) => (
        <div
          key={factor}
          className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/60"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th
                  colSpan={2}
                  className="px-4 py-2 text-left text-xs font-semibold text-zinc-400"
                >
                  {factor}
                </th>
              </tr>
              <tr className="border-b border-zinc-800">
                <Th>Condição</Th>
                <Th>Pontos</Th>
              </tr>
            </thead>
            <tbody>
              {thresholds.map(([cond, pts]) => (
                <tr
                  key={cond}
                  className="border-b border-zinc-800/50 last:border-0"
                >
                  <Td>{cond}</Td>
                  <Td>
                    <span
                      className="font-semibold tabular-nums"
                      style={{ color: scoreColor(Number(pts)) }}
                    >
                      {pts}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/80 px-5 py-4 text-xs leading-relaxed text-emerald-300">
      {children}
    </pre>
  )
}

function scoreColor(score: number): string {
  if (score >= 85) return '#10b981'
  if (score >= 70) return '#22c55e'
  if (score >= 55) return '#84cc16'
  if (score >= 40) return '#eab308'
  if (score >= 25) return '#f97316'
  return '#ef4444'
}
