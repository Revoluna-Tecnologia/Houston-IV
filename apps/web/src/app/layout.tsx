import type { Metadata } from 'next'
import { Geologica } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '../lib/query-provider'

const geologica = Geologica({
  subsets: ['latin'],
  variable: '--font-geologica',
})

export const metadata: Metadata = {
  title: 'Houston IV',
  description: 'Sistema de gerenciamento de escalas médicas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${geologica.variable} font-sans antialiased`}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
