"use client"; // Forteller Next.js at dette er en interaktiv React-komponent
import { useState, useEffect } from 'react';

export default function Hjemmeside() {
  // Tradisjonell React-state for å lagre data fra backend
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // React-hook som henter data fra Node.js-serveren når siden laster
  useEffect(() => {
    fetch('/api/data')
      .then((res) => res.json())
      .then((apiData) => {
        setData(apiData);
        setLoading(false);
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-950 text-white">
      <div className="z-10 w-full max-w-md items-center justify-between font-mono text-sm border border-gray-8xl bg-gray-900 p-8 rounded-xl shadow-2xl">
        <h1 className="text-2xl font-bold mb-4 text-blue-400">Fullstack App</h1>
        
        {loading ? (
          <p className="text-gray-400 animate-pulse">Henter data fra Node.js-backend...</p>
        ) : (
          <div className="space-y-2">
            <p className="text-lg"><strong>Melding:</strong> {data?.tittel}</p>
            <p><strong>Status:</strong> <span className="text-green-400">{data?.status}</span></p>
            <p className="text-xs text-gray-500 mt-4">Generert av serveren kl: {data?.tidspunkt}</p>
          </div>
        )}
      </div>
    </main>
  );
}
