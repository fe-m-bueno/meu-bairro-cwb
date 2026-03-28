# Meu Bairro CWB

Aplicação web para explorar a qualidade de vida dos bairros de Curitiba com base em dados públicos reais.

O projeto cruza geometrias dos bairros, equipamentos urbanos, transporte, áreas verdes e dados agregados de ocorrências para calcular um índice de qualidade de vida de `0` a `100` para cada bairro.

## Sumário

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Fluxo de Dados](#fluxo-de-dados)
- [Como o Score é Calculado](#como-o-score-é-calculado)
- [Rotas da Aplicação](#rotas-da-aplicação)
- [APIs Internas](#apis-internas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Rodar Localmente](#como-rodar-localmente)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Dados e Atualização](#dados-e-atualização)
- [Deploy na Vercel](#deploy-na-vercel)
- [Operação e Limitações](#operação-e-limitações)
- [Checklist Antes de Publicar](#checklist-antes-de-publicar)

## Visão Geral

O objetivo do app é responder, com dados, a pergunta:

> “É um bom bairro para viver em Curitiba?”

Para isso, o sistema:

- carrega os `75` bairros de Curitiba
- busca dados públicos oficiais de serviços e infraestrutura
- calcula scores temáticos por bairro
- gera um score geral ponderado
- apresenta os resultados em mapa, ranking e comparação direta

O app foi construído para uso exploratório e comparativo, não como laudo oficial.

## Funcionalidades

- mapa interativo com coroplético por score geral
- painel lateral com detalhes do bairro selecionado
- radar com comparação entre score do bairro e referência
- comparação entre dois bairros em modo versus
- ranking completo dos bairros
- detalhamento metodológico
- busca por endereço
- visualização de equipamentos próximos

## Stack

### Aplicação

- Next.js `16.2.1`
- React `19`
- TypeScript
- App Router

### UI e visualização

- Tailwind CSS v4
- Base UI
- Leaflet
- React Leaflet
- Recharts
- next-themes

### Qualidade

- Vitest
- Biome

## Arquitetura

O projeto usa uma arquitetura híbrida:

- o servidor monta os payloads principais da home e do ranking
- o cliente renderiza o mapa e as interações
- algumas integrações passam por rotas internas para evitar problemas de CORS

### Ponto de entrada dos dados

O carregamento central fica em:

- [`src/lib/server/city-data.ts`](./src/lib/server/city-data.ts)

Esse módulo:

- busca bairros
- busca serviços
- busca linhas de ônibus
- busca áreas verdes
- lê o JSON estático de ocorrências
- calcula os scores
- monta os payloads usados pelas páginas

### Cache

Existe cache em memória no servidor com TTL de `1 hora` para o conjunto principal de dados.

Isso reduz:

- latência
- repetição de chamadas externas
- custo de recomputação do ranking

## Fluxo de Dados

Fluxo simplificado:

1. o servidor busca geometrias e serviços públicos
2. os dados são normalizados em estruturas tipadas
3. os scores por categoria são calculados para cada bairro
4. o score geral ponderado é calculado
5. a home renderiza o mapa e os painéis
6. o ranking usa o mesmo conjunto de dados base

### Fontes principais consumidas

- GeoCuritiba / IPPUC
- dados agregados de ocorrências em `public/data/ocorrencias-por-bairro.json`

### Integração de dados geográficos

Os serviços e limites territoriais são carregados por:

- [`src/lib/api/geocuritiba.ts`](./src/lib/api/geocuritiba.ts)

Esse módulo faz:

- montagem de URLs de consulta ArcGIS
- paginação dos resultados
- retries em camadas críticas
- normalização de features em entidades de domínio

## Como o Score é Calculado

O cálculo central está em:

- [`src/lib/score/calculator.ts`](./src/lib/score/calculator.ts)
- [`src/lib/score/weights.ts`](./src/lib/score/weights.ts)

### Categorias

As sete categorias são:

- `saude`
- `educacao`
- `seguranca`
- `transporte`
- `areasVerdes`
- `cultura`
- `diversidade`

### Pesos do score geral

Pesos atuais:

- Saúde: `20%`
- Educação: `18%`
- Segurança: `17%`
- Transporte: `18%`
- Áreas Verdes: `12%`
- Cultura: `8%`
- Diversidade: `7%`

### Faixas de classificação

- `85–100`: Excelente
- `70–84`: Muito Bom
- `55–69`: Bom
- `40–54`: Regular
- `25–39`: Abaixo da Média
- `0–24`: Crítico

### Observação

Os detalhes completos da metodologia e dos thresholds estão na rota:

- [`/metodologia`](./src/app/metodologia/page.tsx)

## Rotas da Aplicação

### Páginas

- `/`
  - mapa principal
  - seleção de bairro
  - modo de comparação

- `/ranking`
  - tabela com todos os bairros
  - ordenação e filtros

- `/metodologia`
  - explicação de pesos, fatores e fontes

### Comportamento de URL

A home usa query params para manter estado de seleção:

- `/?bairro=<codigo>`
- `/?compare=<codigoA>,<codigoB>`
- `/?bairro=<codigo>&compareMode=select`

O app também normaliza formatos legados de URL quando necessário.

## APIs Internas

### Proxy para dados públicos

Arquivo:

- [`src/app/api/proxy/route.ts`](./src/app/api/proxy/route.ts)

Função:

- faz proxy controlado para hosts permitidos
- reduz problemas de CORS no navegador
- mantém cache em memória

### Dados de ocorrências

Arquivo:

- [`src/app/api/crime-data/route.ts`](./src/app/api/crime-data/route.ts)

Função:

- expõe dados agregados de ocorrências
- aplica cache em memória no servidor
- normaliza nomes de bairros

## Estrutura do Projeto

```text
src/
  app/
    api/
    metodologia/
    ranking/
    page.tsx
  components/
    home/
    layout/
    map/
    panel/
    ranking/
    search/
    ui/
  hooks/
  lib/
    api/
    geo/
    score/
    server/
    types.ts
public/
  data/
scripts/
```

### Pastas mais importantes

- `src/app/`
  - rotas do App Router

- `src/components/map/`
  - mapa, layers e marcadores

- `src/components/panel/`
  - painéis de bairro, comparação e gráficos

- `src/lib/api/`
  - integração com serviços externos

- `src/lib/score/`
  - cálculo dos índices

- `src/lib/server/`
  - montagem de payloads e cache server-side

- `public/data/`
  - dados estáticos agregados

- `scripts/`
  - utilitários de manutenção de dados

## Como Rodar Localmente

### Requisitos

- Node.js `20+`
- `pnpm`

### Instalação

```bash
pnpm install
```

### Desenvolvimento

```bash
pnpm dev
```

Abra:

```text
http://localhost:3000
```

### Build local

```bash
pnpm build
pnpm start
```

## Scripts Disponíveis

```bash
pnpm dev
pnpm build
pnpm start
pnpm test
pnpm test:watch
pnpm lint
pnpm format
pnpm check
pnpm update-crime-data
```

### Observações importantes sobre scripts

#### `pnpm check`

Executa:

```bash
biome check --write .
```

Ou seja:

- valida
- e também pode reformatar arquivos automaticamente

#### `pnpm update-crime-data`

Executa:

```bash
tsx scripts/process-sigesguarda.ts
```

Esse script atualiza o JSON agregado de ocorrências.

## Dados e Atualização

### Arquivo agregado de ocorrências

Arquivo atual:

- [`public/data/ocorrencias-por-bairro.json`](./public/data/ocorrencias-por-bairro.json)

Esse arquivo é usado pelo servidor para compor os payloads da aplicação.

### Script de processamento

Arquivo:

- [`scripts/process-sigesguarda.ts`](./scripts/process-sigesguarda.ts)

Responsabilidades:

- baixar ou listar CSVs públicos
- decodificar os arquivos
- normalizar nomes de bairros
- agregar ocorrências por bairro
- gerar o JSON final consumido pelo app

### Observação operacional

Se você atualizar os dados de ocorrências:

1. rode `pnpm update-crime-data`
2. revise o JSON gerado
3. valide a aplicação com `pnpm test` e `pnpm build`

## Deploy na Vercel

Sim, o projeto pode ser publicado na Vercel.

### Status atual

O projeto já passou por:

- `pnpm test`
- `pnpm build`

### Passo a passo

1. suba a branch para o GitHub
2. importe o repositório na Vercel
3. use as configurações padrão de projeto Next.js
4. mantenha `pnpm` como gerenciador de pacotes
5. faça o deploy

### Comando de build

```bash
pnpm build
```

### Variáveis de ambiente

Hoje não há variáveis obrigatórias para o funcionamento básico do app.

### Dependências externas de runtime

Mesmo com deploy funcionando, a aplicação depende de serviços externos:

- Google Fonts via `next/font/google`
- endpoints públicos do GeoCuritiba
- endpoints públicos da Prefeitura de Curitiba para parte dos dados

Se algum desses serviços estiver:

- lento
- fora do ar
- com bloqueio temporário

o app pode sofrer degradação parcial.

## Operação e Limitações

### Limitações conhecidas

- o score depende da disponibilidade e qualidade dos dados públicos
- dados externos podem mudar sem aviso
- tempo de resposta pode variar por causa das fontes públicas
- o índice é um modelo heurístico, não uma certificação oficial

### Renderização do mapa

O mapa usa Leaflet e depende do ambiente cliente. Por isso a renderização interativa ocorre no browser.

### Fontes Google

O projeto usa `DM Sans` e `Fraunces` em:

- [`src/app/layout.tsx`](./src/app/layout.tsx)

Em ambientes extremamente restritos, fontes externas podem afetar o build ou a renderização.

## Troubleshooting

### O mapa abriu, mas os dados falharam

Verifique:

- conectividade com os endpoints públicos
- se a rota `/api/proxy` está respondendo
- se houve mudança de schema ou disponibilidade no GeoCuritiba

### O ranking ou a home demoraram muito

Possíveis causas:

- chamada lenta às fontes externas
- cache expirado
- ambiente sem aquecimento de cache

### O build falhou na Vercel

Cheque:

- versão do Node
- lockfile
- disponibilidade de fontes externas
- eventuais mudanças locais não commitadas que não foram para o repositório

### O app local parece diferente do código

Reinicie o servidor local:

```bash
pnpm dev
```

E faça refresh completo no navegador.

## Checklist Antes de Publicar

Checklist recomendado:

- `pnpm install`
- `pnpm test`
- `pnpm build`
- validar home
- validar ranking
- validar metodologia
- validar comparação entre bairros
- revisar se o JSON de ocorrências está atualizado, se aplicável

## Créditos

Projeto construído sobre dados públicos da cidade de Curitiba.

Antes de redistribuir dados processados, verifique as condições de uso e atribuição das fontes originais.
