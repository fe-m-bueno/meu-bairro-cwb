import Link from 'next/link'

export function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-sm">
      <Link href="/" className="text-lg font-bold text-zinc-100">
        Meu Bairro CWB
      </Link>
      <nav className="flex items-center gap-6">
        <Link
          href="/ranking"
          className="text-sm text-zinc-400 transition-colors hover:text-white"
        >
          Ranking
        </Link>
        <Link
          href="/metodologia"
          className="text-sm text-zinc-400 transition-colors hover:text-white"
        >
          Metodologia
        </Link>
      </nav>
    </header>
  )
}
