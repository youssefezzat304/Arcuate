import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { createClient } from '@/lib/supabase/server';
import { authUserSchema } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Arcuate',
  description: 'AI-generated reading material for language learners.',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const supabase = await createClient({ readOnly: true });
  const { data, error } = await supabase.auth.getUser();
  if (error && error.name !== 'AuthSessionMissingError') {
    console.error('Supabase account lookup failed:', error.code ?? error.name);
  }
  const user = authUserSchema.safeParse(data.user);
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <AppShell initialUser={user.success ? user.data : null}>{children}</AppShell>
      </body>
    </html>
  );
}
