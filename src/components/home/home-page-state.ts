export interface HomePageSelection {
  selectedBairro: string | null
  compareBairro: string | null
  isSelectingCompareBairro: boolean
}

interface SearchParamsLike {
  get(name: string): string | null
}

export function getSearchParamsFromLegacyPathname(pathname: string) {
  if (!pathname.startsWith('/bairro=')) {
    return null
  }

  return new URLSearchParams(pathname.slice(1))
}

export function getSelectionFromSearchParams(
  searchParams: SearchParamsLike,
  validBairros: Set<string>,
): HomePageSelection {
  const isSelectingCompareBairro =
    searchParams.get('compareMode') === 'select'
  const compareParam = searchParams.get('compare')

  if (compareParam) {
    const compareCodes = compareParam
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)

    if (compareCodes.length === 2) {
      const [selectedBairro, compareBairro] = compareCodes

      if (
        selectedBairro !== compareBairro &&
        validBairros.has(selectedBairro) &&
        validBairros.has(compareBairro)
      ) {
        return {
          selectedBairro,
          compareBairro,
          isSelectingCompareBairro: false,
        }
      }
    }
  }

  const bairroParam = searchParams.get('bairro')

  if (bairroParam && validBairros.has(bairroParam)) {
    return {
      selectedBairro: bairroParam,
      compareBairro: null,
      isSelectingCompareBairro,
    }
  }

  return {
    selectedBairro: null,
    compareBairro: null,
    isSelectingCompareBairro: false,
  }
}

export function getBairroHref(codigo: string) {
  return `/?bairro=${encodeURIComponent(codigo)}`
}

export function getCompareHref(selectedBairro: string, compareBairro: string) {
  const params = new URLSearchParams()
  params.set('compare', `${selectedBairro},${compareBairro}`)
  return `/?${params.toString()}`
}

export function getCompareSelectionHref(selectedBairro: string) {
  const params = new URLSearchParams()
  params.set('bairro', selectedBairro)
  params.set('compareMode', 'select')
  return `/?${params.toString()}`
}

export function getNormalizedHrefFromLegacyPathname(pathname: string) {
  const params = getSearchParamsFromLegacyPathname(pathname)

  if (!params) {
    return null
  }

  const compare = params.get('compare')
  if (compare) {
    return `/?compare=${encodeURIComponent(compare)}`
  }

  const bairro = params.get('bairro')
  if (!bairro) {
    return '/'
  }

  if (params.get('compareMode') === 'select') {
    return getCompareSelectionHref(bairro)
  }

  return getBairroHref(bairro)
}
