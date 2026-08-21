"use client";
import { useState, useEffect } from 'react';

export default function TicketingSystem() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  // States matching your database columns
  const [senderId, setSenderId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('PC problemer'); 
  const [priority, setPriority] = useState('low'); 
  const [dueDate, setDueDate] = useState('');

  // Explicitly requesting the 'tasks' table from our master route handler
  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/data?table=tasks');
      const result = await res.json();
      if (result.success) setTickets(result.data || []);
    } catch (err) {
      console.error("Failed fetching tickets:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('Creating ticket...');

    try {
      // Sending a unified multi-table payload structure to our master route handler
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'tasks', // Tells the master API which table to target
          insertData: {   // Passes the exact column variables
            sender_id: senderId,
            receiver_id: receiverId || null, 
            content: content,
            category: category,
            priority: priority,
            due_date: dueDate || null, 
            status: 'open' 
          }
        })
      });

      const result = await res.json();

      if (result.success) {
        setStatusMessage('Ticket submitted successfully!');
        setSenderId('');
        setReceiverId('');
        setContent('');
        setDueDate('');
        fetchTickets(); 
      } else {
        setStatusMessage(`DB Error: ${result.error}`);
      }
    } catch (err) {
      setStatusMessage('Network communication failed.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 bg-gray-950 text-white font-sans">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-2xl space-y-6">
        <h1 className="text-2xl font-bold text-blue-400 border-b border-gray-800 pb-3">IT Support Helpdesk</h1>

        {/* INPUT FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Employee ID (Sender)</label>
              <input 
                type="text" 
                value={senderId} 
                onChange={(e) => setSenderId(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-sm"
                placeholder="e.g. EMP-402"
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Assign Technician (Optional Receiver)</label>
              <input 
                type="text" 
                value={receiverId} 
                onChange={(e) => setReceiverId(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-sm"
                placeholder="e.g. TECH-09"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Issue Category</label>
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
              <label className="block text-xs font-semibold text-gray-400 mb-1">Priority Level</label>
              <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-sm text-white bg-gray-900"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Criticality</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Resolution Due Date</label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-sm text-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Issue Description (Content)</label>
            <textarea 
              rows={4}
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-sm resize-none"
              placeholder="Describe the technical issue explicitly..."
              required 
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg font-medium text-sm transition shadow-md">
            File Official Support Ticket
          </button>
          
          {statusMessage && <p className="text-xs text-center text-yellow-400 mt-2 font-mono">{statusMessage}</p>}
        </form>

        {/* RENDERING ZONE FOR ACTIVE TICKETS */}
        <div className="border-t border-gray-800 pt-6">
          <h2 className="text-lg font-bold text-gray-300 mb-4">Active System Tickets ({tickets.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {tickets.map((t, idx) => (
              <div key={t.id || idx} className="bg-gray-800 border border-gray-700 p-4 rounded-lg flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-800">
                    {t.category}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                    t.priority === 'high' ? 'bg-red-900/50 text-red-300 border border-red-800' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {t.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-200">{t.content}</p>
                <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-700/50">
                  <span>From: {t.sender_id}</span>
                  {t.due_date && <span>Due: {new Date(t.due_date).toLocaleDateString()}</span>}
                  <span className="capitalize text-green-400">Status: {t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}