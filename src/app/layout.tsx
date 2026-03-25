import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/layout/header'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Meu Bairro CWB — Qualidade de vida nos bairros de Curitiba',
  description:
    'Explore a qualidade de vida nos 75 bairros de Curitiba com dados reais de saúde, educação, segurança, transporte e mais.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-zinc-950 font-sans antialiased">
        <Header />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  )
}
