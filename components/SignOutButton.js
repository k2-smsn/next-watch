'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/browserClient';

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button className="btn-link sign-out-btn" onClick={handleSignOut}>
      Sign out
    </button>
  );
}