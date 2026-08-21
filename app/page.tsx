"use client";
import { useState, useEffect } from 'react';

export default function TicketingSystem() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  // States for our simplified table parameters
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('PC problemer'); 
  const [priority, setPriority] = useState('lav'); 
  const [dueDate, setDueDate] = useState('');

  // Pull active ticket list from tasks table
  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/data?table=tasks');
      const result = await res.json();
      if (result.success) setTickets(result.data || []);
    } catch (err) {
      console.error("Feil ved henting av saker:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('Oppretter støttesak...');

    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'tasks', 
          insertData: {   
            content: content,
            category: category,
            priority: priority,
            due_date: dueDate || null, 
            status: 'not_started' // Defaulting fresh database entries to open status
          }
        })
      });

      const result = await res.json();

      if (result.success) {
        setStatusMessage('Støttesak opprettet!');
        setContent('');
        setDueDate('');
        fetchTickets(); 
      } else {
        setStatusMessage(`Databasefeil: ${result.error}`);
      }
    } catch (err) {
      setStatusMessage('Nettverksfeil oppstod.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 bg-gray-950 text-white font-sans">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-2xl space-y-6">
        <h1 className="text-2xl font-bold text-blue-400 border-b border-gray-800 pb-3">IT-Support Sakssystem</h1>

        {/* REGISTRATION FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Kategori</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-sm text-white bg-gray-900"
              >
                <option value="PC problemer">PC problemer</option>
                <option value="printer">Printer</option>
                <option value="Passord problemer">Passord problemer</option>
                <option value="Nettverk / Wi-Fi">Nettverk / Wi-Fi</option>
                <option value="Programvare lisens">Programvare lisens</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Prioritering</label>
              <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-sm text-white bg-gray-900"
              >
                <option value="low">Lav</option>
                <option value="medium">Medium</option>
                <option value="high">Høy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Frist (Valgfritt)</label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-sm text-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Beskrivelse av problemet (Innhold)</label>
            <textarea 
              rows={4}
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-sm resize-none"
              placeholder="Beskriv det tekniske problemet her..."
              required 
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg font-medium text-sm transition shadow-md">
            Send inn støttesak
          </button>
          
          {statusMessage && <p className="text-xs text-center text-yellow-400 mt-2 font-mono">{statusMessage}</p>}
        </form>

        {/* ACTIVE TICKETS ZONE */}
        <div className="border-t border-gray-800 pt-6">
          <h2 className="text-lg font-bold text-gray-300 mb-4">Aktive saker ({tickets.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {tickets.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">Ingen registrerte saker funnet.</p>
            ) : (
              tickets.map((t, idx) => (
                <div key={t.id || idx} className="bg-gray-800 border border-gray-700 p-4 rounded-lg flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-800">
                      {t.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                      t.priority === 'høy' ? 'bg-red-900/50 text-red-300 border border-red-800' : 'bg-gray-700 text-gray-300'
                    }`}>
                      Prioritet: {t.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200">{t.content}</p>
                  <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-700/50">
                    <span>Opprettet: {t.created_at ? new Date(t.created_at).toLocaleDateString('nb-NO') : 'Nylig'}</span>
                    {t.due_date && <span>Frist: {new Date(t.due_date).toLocaleDateString('nb-NO')}</span>}
                    <span className="capitalize text-green-400">Status: {t.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}