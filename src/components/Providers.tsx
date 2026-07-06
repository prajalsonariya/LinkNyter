"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster 
        theme="dark" 
        position="bottom-right" 
        toastOptions={{ 
          style: { background: '#1B1920', border: '1px solid #484452', color: '#E4E0EC', fontSize: '14px' } 
        }} 
      />
    </SessionProvider>
  );
}
