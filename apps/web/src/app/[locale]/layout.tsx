import type { Metadata } from 'next';
import { Geologica } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { QueryProvider } from '@/lib/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import '../globals.css';

const geologica = Geologica({
  subsets: ['latin'],
  variable: '--font-geologica',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Houston IV',
  description: 'Sistema de gerenciamento de escalas médicas',
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geologica.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
