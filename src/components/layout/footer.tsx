import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-4 py-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center text-xs text-muted-foreground">
        <p>
          Dados:{' '}
          <a
            href="https://geocuritiba.ippuc.org.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            IPPUC / GeoCuritiba
          </a>
        </p>
        <nav className="flex gap-4">
          <Link
            href="/metodologia"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Metodologia
          </Link>
          <Link
            href="/ranking"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Ranking
          </Link>
        </nav>
        <p className="text-muted-foreground/60">Feito em Curitiba</p>
      </div>
    </footer>
  )
}
