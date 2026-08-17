'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/browserClient';

export default function Header() {
  const [user, setUser] = useState(undefined); // undefined = not checked yet
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="app-header">
      <Link href="/" className="app-logo">Work Timer</Link>

      <nav className="app-nav">
        <Link href="/" className={pathname === '/' ? 'nav-link active' : 'nav-link'}>
          Timer
        </Link>
        <Link href="/logs" className={pathname === '/logs' ? 'nav-link active' : 'nav-link'}>
          Logs
        </Link>
      </nav>

      <div className="app-auth">
        {user === undefined ? null : user ? (
          <button className="btn-link" onClick={handleSignOut}>Sign out</button>
        ) : (
          <>
            <Link href="/login" className="btn-link">Log in</Link>
            <Link href="/signup" className="btn-link">Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}