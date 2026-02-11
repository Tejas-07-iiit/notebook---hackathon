import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import api from '../services/api';
import { FiUpload, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import '../App.css';

const Upload = ({ onLogout }) => {
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    const isStudent = user?.role === 'student';

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [file, setFile] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: '',
        department: user?.department || '',
        semester: '',
        type: 'note',
        year: '',
        examType: 'other',
    });

    const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];
    const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
    const examTypes = ['midsem', 'endsem', 'quiz', 'other'];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'type' && e.target.value === 'pastpaper') {
            setFormData((prev) => ({ ...prev, type: 'pastpaper', examType: 'endsem' }));
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError("File size must be less than 10MB");
                e.target.value = "";
                setFile(null);
                return;
            }
            const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
            if (!allowedTypes.includes(selectedFile.type)) {
                setError("Only PDF, PNG, JPG files are allowed");
                e.target.value = "";
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!file) {
            setError('Please select a file');
            setLoading(false);
            return;
        }

        const data = new FormData();
        data.append('file', file);
        Object.keys(formData).forEach(key => {
            if (formData[key]) data.append(key, formData[key]);
        });

        try {
            const endpoint = isStudent ? '/requests' : '/notes/upload';

            const response = await api.post(endpoint, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            console.log('Upload success:', response);
            setSuccess(isStudent ? 'Request submitted successfully! It will be reviewed by a teacher.' : 'Note uploaded successfully!');

            // Reset form
            setFormData({
                title: '',
                description: '',
                subject: '',
                department: user?.department || '',
                semester: '',
                type: 'note',
                year: '',
                examType: 'other',
            });
            setFile(null);
            const input = document.getElementById('file-upload');
            if (input) input.value = '';

        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar onLogout={onLogout} />
            <div className="main-content">
                <Header
                    title={isStudent ? "Request to Add Note" : "Upload Note"}
                    subtitle={isStudent ? "Submit a note for review" : "Add new study material to library"}
                />

                <div className="mx-auto" style={{ maxWidth: '800px' }}>
                    <div className="card">

                        {error && (
                            <div className="alert alert-error">
                                <FiAlertCircle /> {error}
                            </div>
                        )}

                        {success && (
                            <div className="alert alert-success">
                                <FiCheckCircle /> {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="d-grid grid-cols-2 gap-4">

                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Title *</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleChange} required className="form-input" placeholder="e.g. Engineering Mechanics Unit 1" />
                                </div>

                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="form-input" placeholder="Brief description of the content..." />
                                </div>

                                <div className="form-group">
                                    <label>Subject *</label>
                                    <input type="text" name="subject" value={formData.subject} onChange={handleChange} required className="form-input" />
                                </div>

                                <div className="form-group">
                                    <label>Department *</label>
                                    <select name="department" value={formData.department} onChange={handleChange} required className="form-input">
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Semester *</label>
                                    <select name="semester" value={formData.semester} onChange={handleChange} required className="form-input">
                                        <option value="">Select Semester</option>
                                        {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Type *</label>
                                    <select name="type" value={formData.type} onChange={handleChange} required className="form-input">
                                        <option value="note">Note</option>
                                        <option value="pastpaper">Past Paper</option>
                                    </select>
                                </div>

                                {formData.type === 'pastpaper' && (
                                    <>
                                        <div className="form-group">
                                            <label>Year</label>
                                            <input type="number" name="year" value={formData.year} onChange={handleChange} min="2000" max="2030" className="form-input" />
                                        </div>
                                        <div className="form-group">
                                            <label>Exam Type</label>
                                            <select name="examType" value={formData.examType} onChange={handleChange} className="form-input">
                                                {examTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>File * (PDF, Images - Max 10MB)</label>
                                    <div className={`file-upload-area ${file ? 'bg-primary-light' : ''}`}>
                                        <input type="file" id="file-upload" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
                                        <label htmlFor="file-upload">
                                            <FiUpload size={40} className="mb-2 text-primary" />
                                            <p className="text-secondary">{file ? file.name : 'Click to upload file'}</p>
                                        </label>
                                    </div>
                                </div>

                            </div>

                            <div className="mt-4 text-right">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Uploading...' : (isStudent ? 'Submit Request' : 'Upload Note')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Upload;
