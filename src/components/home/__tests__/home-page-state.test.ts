import { describe, expect, it } from 'vitest'
import {
  getBairroHref,
  getCompareHref,
  getCompareSelectionHref,
  getNormalizedHrefFromLegacyPathname,
  getSearchParamsFromLegacyPathname,
  getSelectionFromSearchParams,
} from '../home-page-state'

const validBairros = new Set(['100', '200', '300'])

describe('getSelectionFromSearchParams', () => {
  it('restores compare mode from a valid compare query param', () => {
    const selection = getSelectionFromSearchParams(
      new URLSearchParams('compare=100,200'),
      validBairros,
    )

    expect(selection).toEqual({
      selectedBairro: '100',
      compareBairro: '200',
      isSelectingCompareBairro: false,
    })
  })

  it('falls back to the bairro param when compare is invalid', () => {
    const selection = getSelectionFromSearchParams(
      new URLSearchParams('bairro=300&compare=100,100'),
      validBairros,
    )

    expect(selection).toEqual({
      selectedBairro: '300',
      compareBairro: null,
      isSelectingCompareBairro: false,
    })
  })

  it('ignores unknown bairros in compare mode', () => {
    const selection = getSelectionFromSearchParams(
      new URLSearchParams('compare=100,999'),
      validBairros,
    )

    expect(selection).toEqual({
      selectedBairro: null,
      compareBairro: null,
      isSelectingCompareBairro: false,
    })
  })

  it('restores pending compare selection from URL state', () => {
    const selection = getSelectionFromSearchParams(
      new URLSearchParams('bairro=100&compareMode=select'),
      validBairros,
    )

    expect(selection).toEqual({
      selectedBairro: '100',
      compareBairro: null,
      isSelectingCompareBairro: true,
    })
  })

  it('parses legacy pathname params', () => {
    const legacyParams = getSearchParamsFromLegacyPathname(
      '/bairro=100&compareMode=select',
    )

    expect(legacyParams?.get('bairro')).toBe('100')
    expect(legacyParams?.get('compareMode')).toBe('select')
  })
})

describe('compare URLs', () => {
  it('builds a single-bairro URL', () => {
    expect(getBairroHref('100')).toBe('/?bairro=100')
  })

  it('builds a compare URL with two bairros', () => {
    expect(getCompareHref('100', '200')).toBe('/?compare=100%2C200')
  })

  it('builds a pending compare-selection URL', () => {
    expect(getCompareSelectionHref('100')).toBe('/?bairro=100&compareMode=select')
  })

  it('normalizes legacy compare-selection pathname URLs', () => {
    expect(getNormalizedHrefFromLegacyPathname('/bairro=100&compareMode=select')).toBe(
      '/?bairro=100&compareMode=select',
    )
  })

  it('normalizes legacy single-bairro pathname URLs', () => {
    expect(getNormalizedHrefFromLegacyPathname('/bairro=100')).toBe(
      '/?bairro=100',
    )
  })
})
