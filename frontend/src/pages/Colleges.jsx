import React, { useState, useEffect } from 'react';
import { getColleges, createCollege } from '../services/api';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import '../App.css';

const Colleges = ({ onLogout }) => {
    const [colleges, setColleges] = useState([]);
    const [formData, setFormData] = useState({
        collegeName: '',
        collegeCode: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async () => {
        try {
            setLoading(true);
            const data = await getColleges();
            setColleges(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch colleges');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Basic validation
        if (!formData.collegeName || !formData.collegeCode) {
            setError('Please fill in all fields');
            return;
        }

        try {
            await createCollege(formData);
            setSuccess('College added successfully!');
            setFormData({ collegeName: '', collegeCode: '' });
            fetchColleges(); // Refresh list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add college');
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar onLogout={onLogout} />
            <div className="main-content">
                <Header title="Colleges" />

                <div className="stats-grid">
                    {/* Add College Form */}
                    <div className="card">
                        <h3 className="mb-3">Add New College</h3>
                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>College Name</label>
                                <input
                                    type="text"
                                    name="collegeName"
                                    value={formData.collegeName}
                                    onChange={handleChange}
                                    placeholder="e.g. IIT Bombay"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>College Code</label>
                                <input
                                    type="text"
                                    name="collegeCode"
                                    value={formData.collegeCode}
                                    onChange={handleChange}
                                    placeholder="e.g. IITB"
                                    className="form-input"
                                />
                            </div>

                            <button type="submit" className="btn btn-primary w-100 mt-4">
                                <FiPlus /> Add College
                            </button>
                        </form>
                    </div>

                    {/* List Colleges */}
                    <div className="card">
                        <h3 className="mb-3">Existing Colleges</h3>
                        {loading ? (
                            <div className="text-center p-5">
                                <div className="spinner mx-auto"></div>
                                <p>Loading...</p>
                            </div>
                        ) : colleges.length === 0 ? (
                            <div className="empty-state">
                                <p>No colleges found.</p>
                            </div>
                        ) : (
                            <div>
                                <ul>
                                    {colleges.map((college) => (
                                        <li key={college._id} className="d-flex justify-between align-center p-3 border-bottom">
                                            <div>
                                                <strong>{college.collegeName}</strong>
                                                <div className="text-sm text-secondary">{college.collegeCode}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Colleges;
