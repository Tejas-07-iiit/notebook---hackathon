import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import NoteCard from '../components/NoteCard';
import FilterBar from '../components/FilterBar';
import UploadModal from '../components/UploadModal';
import api from '../services/api';
import { FiPlus } from 'react-icons/fi';

const Notes = () => {
  
const userData = localStorage.getItem('user');
const user = userData ? JSON.parse(userData) : null;

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    semester: '',
    subject: '',
    type: '',
    year: '',
    examType: ''
  });
  

  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const types = ['note', 'pastpaper'];
  const examTypes = ['midsem', 'endsem', 'quiz', 'other'];

  useEffect(() => {
    fetchNotes();
  }, [filters]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await api.get(`/notes?${queryParams}`);
      setNotes(response);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <div className="main-content">
        <Header 
          title="Notes Library" 
          subtitle="Browse and download study materials"
        />
        
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          departments={departments}
          semesters={semesters}
          types={types}
          examTypes={examTypes}
        />
        
        <div className="section-header">
          <h2>All Study Materials ({notes.length})</h2>
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowUploadModal(true)}
            >
              <FiPlus /> Upload New
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="loading">Loading notes...</div>
        ) : notes.length > 0 ? (
          <div className="notes-grid">
            {notes.map((note) => (
              <NoteCard key={note._id} note={note} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No notes found matching your filters.</p>
          </div>
        )}
      </div>
      
      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} onSuccess={fetchNotes} />
      )}
    </div>
  );
};

export default Notes;