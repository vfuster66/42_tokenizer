'use client';

import dynamic from "next/dynamic";

const TokenInterface = dynamic(() => import("@/components/ui/Token"), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen">
      <TokenInterface />
    </main>
  );
}