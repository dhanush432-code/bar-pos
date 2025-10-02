// src/app/(admin)/admin/_components/SignOutButton.tsx
'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center w-full p-2 text-left rounded hover:bg-red-500 hover:text-white"
    >
      <LogOut className="mr-3" /> Sign Out
    </button>
  );
}