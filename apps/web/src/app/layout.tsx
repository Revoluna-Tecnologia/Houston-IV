import type { Metadata } from 'next'
import { Geologica } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '../lib/query-provider'
import { ThemeProvider } from '../components/providers/theme-provider'

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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geologica.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
