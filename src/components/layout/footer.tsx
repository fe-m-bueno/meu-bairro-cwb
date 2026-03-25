import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 px-4 py-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center text-xs text-zinc-500">
        <p>
          Dados:{' '}
          <a
            href="https://geocuritiba.ippuc.org.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline"
          >
            IPPUC / GeoCuritiba
          </a>
        </p>
        <nav className="flex gap-4">
          <Link
            href="/metodologia"
            className="text-zinc-400 transition-colors hover:text-zinc-200"
          >
            Metodologia
          </Link>
          <Link
            href="/ranking"
            className="text-zinc-400 transition-colors hover:text-zinc-200"
          >
            Ranking
          </Link>
        </nav>
        <p className="text-zinc-600">Feito em Curitiba</p>
      </div>
    </footer>
  )
}
