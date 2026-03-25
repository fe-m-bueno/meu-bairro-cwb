# Plano: Segurança com Dados Reais de Ocorrências

## Objetivo

Substituir o scorer de segurança atual (baseado apenas em proximidade de delegacias/PMs) por um sistema que incorpore **dados reais de ocorrências criminais por bairro**, tornando o score de segurança muito mais representativo da realidade.

## Fonte de Dados

### SiGesGuarda — Guarda Municipal de Curitiba
- **Portal:** https://dadosabertos.curitiba.pr.gov.br/conjuntodado/detalhe?chave=b16ead9d-835e-41e8-a4d7-dcc4f2b4b627
- **Arquivo CSV:** http://dadosabertos.c3sl.ufpr.br/curitiba/Sigesguarda/
- **Formato:** CSV (separador `;`, encoding Latin-1)
- **Licença:** CC BY 4.0
- **Atualização:** Mensal
- **Dados desde:** 2016

### Campos relevantes
| Campo | Descrição |
|-------|-----------|
| `ATENDIMENTO_BAIRRO_NOME` | Nome do bairro (já pronto para agrupar) |
| `REGIONAL_FATO_NOME` | Regional administrativa |
| `OCORRENCIA_DATA` | Data da ocorrência |
| `OCORRENCIA_ANO` | Ano |
| `NATUREZA1_DESCRICAO` | Tipo de ocorrência (até 5 naturezas) |
| `SUBCATEGORIA1_DESCRICAO` | Subtipo |
| `FLAG_FLAGRANTE` | Se houve flagrante |

### Limitações
- Cobre apenas Guarda Municipal (não inclui PM, PC, ou BOs completos)
- Para dados completos de BOs por bairro, seria necessário solicitar ao CAPE/SESP (`cape@sesp.pr.gov.br`) ou usar o dashboard Qlik: https://www.seguranca.pr.gov.br/CAPE/Estatisticas
- Mesmo parcial, é o melhor dado público disponível com granularidade por bairro

---

## Arquitetura Proposta

### Opção A: Pre-processamento estático (Recomendada)

Processar os CSVs offline e gerar um JSON agregado por bairro que o app consome diretamente. Simples, rápido, sem dependência de API externa.

```
CSVs SiGesGuarda → Script Node.js → public/data/ocorrencias-por-bairro.json → App consume
```

**Vantagens:** Zero latência, sem CORS, funciona offline
**Desvantagem:** Dados não atualizam automaticamente (precisa rodar script e rebuild)

### Opção B: API Route que processa sob demanda

Route Handler do Next.js que baixa o CSV mais recente, parseia, agrega e retorna JSON. Com cache de 30 dias.

**Vantagens:** Sempre atualizado
**Desvantagem:** Primeiro request lento (download de ~22MB CSV)

### Recomendação: Opção A com script de atualização

---

## Estrutura do JSON Agregado

```typescript
interface BairroCrimeData {
  bairro: string
  totalOcorrencias12m: number      // últimos 12 meses
  ocorrenciasPor1000hab?: number   // se tiver dados populacionais
  naturezas: Record<string, number> // contagem por tipo
  tendencia: 'subindo' | 'estavel' | 'descendo' // comparando com período anterior
}
```

Arquivo: `public/data/ocorrencias-por-bairro.json`

---

## Novo Scorer de Segurança

### Composição atual (só infraestrutura)
| Fator | Peso |
|-------|------|
| PM/Guarda mais próxima | 35% |
| Delegacia mais próxima | 25% |
| Bombeiros mais próximo | 20% |
| Densidade de segurança em 2km | 20% |

### Composição proposta (infraestrutura + ocorrências)
| Fator | Peso |
|-------|------|
| Taxa de ocorrências (por 1000 hab ou absoluta) | 40% |
| PM/Guarda mais próxima | 20% |
| Delegacia mais próxima | 15% |
| Bombeiros mais próximo | 10% |
| Densidade de segurança em 2km | 15% |

### Scoring da taxa de ocorrências

Calcular percentis entre os 75 bairros:
| Percentil | Score |
|-----------|-------|
| Menor 10% (mais seguro) | 100 |
| 10-25% | 85 |
| 25-50% | 65 |
| 50-75% | 40 |
| 75-90% | 20 |
| Maior 90% (mais perigoso) | 5 |

Usar percentis em vez de valores absolutos porque a distribuição de crime é muito desigual.

### Categorias de ocorrência com pesos diferentes

Nem toda ocorrência tem o mesmo impacto na percepção de segurança:

| Categoria | Peso | Exemplos |
|-----------|------|----------|
| Crimes contra pessoa | 3x | Agressão, ameaça, roubo |
| Crimes contra patrimônio | 2x | Furto, vandalismo |
| Perturbação/desordem | 1x | Perturbação do sossego, som alto |
| Trânsito | 0.5x | Acidentes, infrações |
| Outros | 0.5x | Alarmes, deposito irregular |

A classificação seria feita pelo campo `NATUREZA1_DESCRICAO`.

---

## Tasks de Implementação

### Task 1: Script de processamento CSV
- **Arquivo:** `scripts/process-sigesguarda.ts`
- Baixar CSVs dos últimos 12 meses
- Parsear (Latin-1, separador `;`)
- Agrupar por `ATENDIMENTO_BAIRRO_NOME`
- Classificar naturezas em categorias com pesos
- Calcular score ponderado por bairro
- Normalizar nomes dos bairros para casar com os do IPPUC
- Gerar `public/data/ocorrencias-por-bairro.json`

### Task 2: Tipo e loader
- **Arquivo:** `src/lib/types.ts` — adicionar `BairroCrimeData`
- **Arquivo:** `src/lib/api/crime-data.ts` — fetch do JSON estático
- Cache em localStorage

### Task 3: Atualizar scorer de segurança
- **Arquivo:** `src/lib/score/safety.ts`
- Aceitar `crimeData: BairroCrimeData[]` como parâmetro adicional
- Implementar scoring por percentil
- Ajustar pesos conforme tabela acima

### Task 4: Integrar no pipeline
- **Arquivo:** `src/lib/score/calculator.ts` — passar crime data ao safety scorer
- **Arquivo:** `src/hooks/use-scores.ts` — fetch crime data junto com outros dados
- **Arquivo:** `src/components/panel/category-card.tsx` — mostrar detalhes de ocorrências

### Task 5: UI para dados de ocorrências
- No painel de detalhes, mostrar:
  - Total de ocorrências nos últimos 12 meses
  - Top 3 tipos de ocorrência no bairro
  - Tendência (seta subindo/descendo)
  - Comparação com média da cidade

### Task 6: Atualizar metodologia
- **Arquivo:** `src/app/metodologia/page.tsx` — explicar a nova composição do score
- Citar fonte dos dados (SiGesGuarda, CC BY 4.0)
- Explicar limitações (só Guarda Municipal)

### Task 7: Script npm para atualização
- `package.json` script: `"update-crime-data": "tsx scripts/process-sigesguarda.ts"`
- Documentar no README como atualizar os dados

---

## Dados populacionais (opcional mas recomendado)

Para calcular ocorrências per capita, precisamos de população por bairro. Fontes:
- **IBGE Censo 2022** — dados por setor censitário, agregáveis por bairro
- **IPPUC** — pode ter estimativas populacionais por bairro em alguma layer

Se não houver dados populacionais facilmente acessíveis, usar contagem absoluta normalizada por área do bairro (ocorrências/km²) como alternativa.

---

## Estimativa de esforço

| Task | Complexidade |
|------|-------------|
| Script CSV | Média (parsing, encoding, normalização de nomes) |
| Tipo + loader | Baixa |
| Scorer atualizado | Média |
| Integração pipeline | Baixa |
| UI ocorrências | Média |
| Metodologia | Baixa |
| Script npm | Baixa |

---

## Riscos

1. **Nomes dos bairros no CSV podem não casar com IPPUC** — precisará de mapeamento manual para variações (ex: "CIC" vs "Cidade Industrial")
2. **CSV de 22MB pode ser pesado para processar** — script offline mitiga isso
3. **Dados só da Guarda Municipal** — pode subestimar crime em áreas com mais atuação da PM
4. **Sazonalidade** — usar 12 meses para suavizar
