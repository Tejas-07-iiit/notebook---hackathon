import React from 'react';
import { FiDownload, FiCalendar, FiUser, FiBook } from 'react-icons/fi';

const NoteCard = ({ note }) => {
  const getTypeLabel = (type) => {
    return type === 'pastpaper' ? 'Past Paper' : 'Note';
  };

  const getExamTypeLabel = (examType) => {
    const labels = {
      midsem: 'Mid Sem',
      endsem: 'End Sem',
      quiz: 'Quiz',
      other: 'Other'
    };
    return labels[examType] || examType;
  };

  const handleDownload = () => {
    if (note.fileUrl) {
      window.open(`${process.env.REACT_APP_API_URL}${note.fileUrl}`, '_blank');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="note-card">
      <div className="note-header">
        <span className={`note-type ${note.type}`}>
          {getTypeLabel(note.type)}
        </span>
        <h3>{note.title || 'Untitled Note'}</h3>
        <p>{note.description || 'No description'}</p>
      </div>

      <div className="note-body">
        <div className="note-meta">
          <span><FiBook /> {note.subject || 'Unknown Subject'}</span>
          <span>Sem {note.semester || 'N/A'}</span>
          {note.year && <span>Year: {note.year}</span>}
          {note.examType && note.examType !== 'other' && (
            <span>{getExamTypeLabel(note.examType)}</span>
          )}
        </div>

        <div className="note-meta">
          <span><FiUser /> {note.uploadedBy?.name || 'Unknown User'}</span>
          <span><FiCalendar /> {note.createdAt ? formatDate(note.createdAt) : 'Unknown Date'}</span>
        </div>
      </div>

      <div className="note-footer">
        <button className="btn btn-sm btn-primary" onClick={handleDownload}>
          <FiDownload /> Download
        </button>
        <span className="department-badge">
          {note.department || 'Unknown Dept'}
        </span>
      </div>
    </div>
  );
};

export default NoteCard; // Make sure this is default export!