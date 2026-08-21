"use client";
import { useState, useEffect } from 'react';

export default function Hjemmeside() {
  const [items, setItems] = useState<any[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // 1. Trigger the GET request to read database rows
  const fetchDatabaseData = async () => {
    try {
      const res = await fetch('/api/data?table=messages&select=text'); // Set your table name parameter here
      const result = await res.json();
      if (result.success) {
        setItems(result.data || []);
      } else {
        console.error("DB Error:", result.error);
      }
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
  }, []);

  // 2. Trigger the POST request to upload form inputs
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('Uploading to Supabase...');

    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        body: JSON.stringify({
          table: 'messages',
          insertData: { text: nameInput, }
        })
      })

      const result = await res.json();
      
      if (result.success) {
        setStatusMessage('Uploaded successfully!');
        setNameInput('');
        setPriceInput('');
        fetchDatabaseData(); // Re-fetch the data so the list refreshes automatically
      } else {
        setStatusMessage(`Error: ${result.error}`);
      }
    } catch (err) {
      setStatusMessage('Network error occurred.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-gray-950 text-white font-sans">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-2xl space-y-6">
        <h1 className="text-xl font-bold text-blue-400 text-center">Supabase Database Live</h1>

        {/* INPUT FORM (POST) */}
        <form onSubmit={handleSubmit} className="space-y-3 border-b border-gray-800 pb-6">
          <h2 className="text-sm font-semibold text-gray-400">Insert New Row</h2>
          <input 
            type="text" 
            placeholder="Product Name" 
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
            required 
          />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-medium text-sm transition">
            Add To Database
          </button>
          {statusMessage && <p className="text-xs text-center text-yellow-400 mt-1">{statusMessage}</p>}
        </form>

        {/* DATA DISPLAY (GET) */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Live Table Rows:</h2>
          {items.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No rows found or table is empty.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li key={item.id || index} className="flex justify-between bg-gray-800 p-2 rounded text-sm">
                  {/* Note: Make sure 'name' and 'price' match your database column names */}
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}