import type { Metadata } from 'next'
import { DM_Sans, Fraunces } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Header } from '@/components/layout/header'
import './globals.css'

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const fraunces = Fraunces({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
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
    <html
      lang="pt-BR"
      className={`${dmSans.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark">
          <Header />
          <main className="pt-14">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
