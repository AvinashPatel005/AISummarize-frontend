import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Notes({ setIsAuthenticated }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/notes');
      setNotes(res.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/notes/${editingId}`, { title, content });
      } else {
        await api.post('/notes', { title, content });
      }
      setTitle('');
      setContent('');
      setEditingId(null);
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (note) => {
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSummarize = async (id) => {
    setSummaryLoading(true);
    try {
      const res = await api.post(`/notes/${id}/summarize`);
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note._id === id ? { ...note, summary: res.data.summary } : note
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false)
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6">
      <div className="max-w-4xl mx-auto bg-base-100 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-primary">My Notes</h1>
          <button className="btn btn-error" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <form onSubmit={handleAddOrUpdate} className="mb-6 space-y-4">
          <input
            type="text"
            placeholder="Title (optional)"
            className="input input-bordered w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Write your note here..."
            className="textarea textarea-bordered w-full h-32"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary w-full">
            {editingId ? 'Update Note' : 'Add Note'}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-secondary w-full"
              onClick={() => {
                setEditingId(null);
                setTitle('');
                setContent('');
              }}
            >
              Cancel
            </button>
          )}
        </form>
        <div className="space-y-4">
          {notes.length === 0 && <p className="text-center">No notes yet.</p>}
          {notes.map((note) => (
            <div key={note._id} className="card bg-base-200 shadow-md">
              <div className="card-body">
                {note.title && <h2 className="card-title">{note.title}</h2>}
                <p>{note.content}</p>
                {note.summary && (
                  <div className="mt-4 p-4 bg-primary text-primary-content rounded-lg">
                    <h3 className="font-semibold mb-2">Summary:</h3>
                    <p>{note.summary}</p>
                  </div>
                )}
                <div className="card-actions justify-end mt-4 space-x-2">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleEdit(note)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-error"
                    onClick={() => handleDelete(note._id)}
                  >
                    Delete
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleSummarize(note._id)}
                    disabled={summaryLoading}
                  >
                    {summaryLoading ? 'Summarizing...' : 'Summarize'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
