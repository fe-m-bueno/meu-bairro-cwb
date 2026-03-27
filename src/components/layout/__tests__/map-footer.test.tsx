// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MapFooter } from '../map-footer'

describe('MapFooter', () => {
  it('renders GitHub link with correct href', () => {
    render(<MapFooter />)
    const githubLink = screen.getByRole('link', { name: /github/i })
    expect(githubLink).toBeDefined()
    expect(githubLink.getAttribute('href')).toBe('https://github.com/fe-m-bueno/meu-bairro-cwb')
  })

  it('renders author link with correct href', () => {
    render(<MapFooter />)
    const authorLink = screen.getByRole('link', { name: /felipe bueno/i })
    expect(authorLink).toBeDefined()
    expect(authorLink.getAttribute('href')).toBe('https://felipe-bueno.com')
  })

  it('GitHub link opens in new tab', () => {
    render(<MapFooter />)
    const githubLink = screen.getByRole('link', { name: /github/i })
    expect(githubLink.getAttribute('target')).toBe('_blank')
    expect(githubLink.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('author link opens in new tab', () => {
    render(<MapFooter />)
    const authorLink = screen.getByRole('link', { name: /felipe bueno/i })
    expect(authorLink.getAttribute('target')).toBe('_blank')
    expect(authorLink.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('renders Felipe Bueno text', () => {
    render(<MapFooter />)
    expect(screen.getByText('Felipe Bueno')).toBeDefined()
  })
})
