// src/App.jsx
import React, { useEffect, useState } from 'react';
import { postFeedback, fetchFeedbacks, fetchStats } from './api';
import { format } from 'date-fns';
import './styles.css';

// NEW — Toastify imports
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [form, setForm] = useState({ name: '', email: '', message: '', rating: 5 });
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({ total:0, avgRating:0, positive:0, negative:0 });
  const [loading, setLoading] = useState(false);
  const [filterRating, setFilterRating] = useState('');
  const [searchQ, setSearchQ] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const fbs = await fetchFeedbacks({ rating: filterRating || undefined, q: searchQ || undefined });
      setFeedbacks(fbs);
      const s = await fetchStats();
      setStats(s);
    } catch (err) {
      console.error(err);
      toast.error("Error loading data", { theme: "colored" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await postFeedback(form);
      setForm({ name:'', email:'', message:'', rating:5 });
      await load();

      // NEW — Clean success toast
      toast.success("Feedback submitted — thank you!", {
        theme: "colored",
        autoClose: 2000
      });

    } catch (err) {
      console.error(err);
      const message = err?.error || err.message || 'Server error';

      // NEW — Stylish error toast
      toast.error("Submit error: " + message, {
        theme: "colored"
      });
    }
  };

  const handleExport = () => {
    if (!feedbacks.length) {
      toast.info("No feedback to export", { theme: "colored" });
      return;
    }

    const rows = [
      ['Name','Email','Rating','Message','CreatedAt'],
      ...feedbacks.map(f => [
        f.name,
        f.email || '',
        String(f.rating),
        f.message.replace(/\n/g, ' '),
        new Date(f.createdAt).toISOString()
      ])
    ];

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedbacks_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("CSV exported successfully!", { theme: "colored" });
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      const fbs = await fetchFeedbacks({ rating: filterRating || undefined, q: searchQ || undefined });
      setFeedbacks(fbs);
      toast.info("Filters applied", { theme: "colored" });
    } catch (err) {
      console.error(err);
      toast.error("Filter error", { theme: "colored" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Toast container always visible */}
      <ToastContainer position="top-right" autoClose={2000} />

      <h1>Feedback Dashboard</h1>

      <div className="grid">
        <div className="card">
          <h2>Submit Feedback</h2>
          <form onSubmit={handleSubmit}>
            <label>Name (required)
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </label>

            <label>Email
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </label>

            <label>Message (required)
              <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} required />
            </label>

            <label>Rating
              <select value={form.rating} onChange={e => setForm({...form, rating: Number(e.target.value)})}>
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>

            <button type="submit">Send Feedback</button>
          </form>
        </div>

        <div className="card">
          <h2>Analytics</h2>
          <div className="analytics">
            <div className="stat"><div className="num">{stats.total}</div><div className="label">Total Feedbacks</div></div>
            <div className="stat"><div className="num">{stats.avgRating}</div><div className="label">Average Rating</div></div>
            <div className="stat"><div className="num">{stats.positive}</div><div className="label">Positive (4+)</div></div>
            <div className="stat"><div className="num">{stats.negative}</div><div className="label">Negative (&lt;3)</div></div>
          </div>

          <div className="filters">
            <input placeholder="Search name/email/message" value={searchQ} onChange={e => setSearchQ(e.target.value)} />

            <select value={filterRating} onChange={e => setFilterRating(e.target.value)}>
              <option value="">All ratings</option>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>

            <button onClick={applyFilters}>Apply</button>
            <button onClick={() => { setSearchQ(''); setFilterRating(''); load(); }}>Reset</button>
            <button onClick={handleExport}>Export CSV</button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>All Feedbacks {loading && '(loading...)'}</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Rating</th><th>Message</th><th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map(f => (
              <tr key={f._id}>
                <td>{f.name}</td>
                <td>{f.email || '-'}</td>
                <td>{f.rating}</td>
                <td>{f.message}</td>
                <td>{format(new Date(f.createdAt), 'yyyy-MM-dd HH:mm')}</td>
              </tr>
            ))}
            {!feedbacks.length && !loading && <tr><td colSpan="5">No feedbacks yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
