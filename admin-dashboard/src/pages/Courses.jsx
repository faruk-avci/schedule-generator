import React, { useState, useEffect } from 'react';
import AdminAPI from '../api';
import { Search, Plus, Edit2, Trash2, X, Check, Filter } from 'lucide-react';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [terms, setTerms] = useState([]);
    const [selectedTerm, setSelectedTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingCourse, setEditingCourse] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [coursesRes, termsRes] = await Promise.all([
                AdminAPI.getCourses(search, selectedTerm),
                AdminAPI.getTerms()
            ]);
            setCourses(coursesRes.data.courses || []);
            setTerms(termsRes.data.terms || []);
        } catch (err) {
            console.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, selectedTerm]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        try {
            await AdminAPI.deleteCourse(id);
            fetchData();
        } catch (err) {
            alert('Failed to delete course');
        }
    };

    const handleEdit = (course) => {
        setEditingCourse({ ...course });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingCourse.id) {
                await AdminAPI.updateCourse(editingCourse.id, editingCourse);
            } else {
                await AdminAPI.addCourse(editingCourse);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert('Failed to save course');
        }
    };

    return (
        <div className="p-8 courses-page">
            <header className="flex-header">
                <div>
                    <h1>Course Management</h1>
                    <p className="subtitle">Search, edit, and manage the course database</p>
                </div>
                <button className="add-btn" onClick={() => { setEditingCourse({ course_code: '', course_name: '', section_name: '', faculty: '', term: '', lecturer: '', credits: 0, prerequisites: '', corequisites: '' }); setShowModal(true); }}>
                    <Plus size={18} />
                    <span>Add New Course</span>
                </button>
            </header>

            <div className="filters-row">
                <div className="search-bar">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name, section, or lecturer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="term-filter">
                    <Filter size={18} className="filter-icon" />
                    <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
                        <option value="">All Terms</option>
                        {terms.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <div className="data-table-card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Term</th>
                                <th>Code</th>
                                <th>Course Title</th>
                                <th>Section</th>
                                <th>Lecturer</th>
                                <th>Credits</th>
                                <th className="actions-header">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="loading-row">Updating list...</td></tr>
                            ) : courses.length === 0 ? (
                                <tr><td colSpan="7" className="empty-row">No courses found matching your criteria.</td></tr>
                            ) : (
                                courses.map(course => (
                                    <tr key={course.id}>
                                        <td className="term-tag"><span>{course.term || 'N/A'}</span></td>
                                        <td className="mono font-bold" style={{ color: '#3b82f6' }}>{course.course_code}</td>
                                        <td className="font-semibold">{course.course_name}</td>
                                        <td className="mono">{course.section_name}</td>
                                        <td>{course.lecturer}</td>
                                        <td>{course.credits}</td>
                                        <td className="actions-cell">
                                            <div className="action-btns">
                                                <button className="icon-btn edit" onClick={() => handleEdit(course)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="icon-btn delete" onClick={() => handleDelete(course.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2>{editingCourse.id ? 'Edit Course' : 'Add New Course'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-grid">
                                <div className="form-group">
                                    <label>Academic Term</label>
                                    <input type="text" value={editingCourse.term} onChange={e => setEditingCourse({ ...editingCourse, term: e.target.value })} placeholder="e.g. 2024-2025 Spring" required />
                                </div>
                                <div className="form-group">
                                    <label>Course Code</label>
                                    <input type="text" value={editingCourse.course_code} onChange={e => setEditingCourse({ ...editingCourse, course_code: e.target.value })} placeholder="e.g. MATH101" required />
                                </div>
                                <div className="form-group full-width">
                                    <label>Course Title</label>
                                    <input type="text" value={editingCourse.course_name} onChange={e => setEditingCourse({ ...editingCourse, course_name: e.target.value })} placeholder="e.g. Mathematics for Social Sciences I" required />
                                </div>
                                <div className="form-group">
                                    <label>Section Name</label>
                                    <input type="text" value={editingCourse.section_name} onChange={e => setEditingCourse({ ...editingCourse, section_name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Lecturer</label>
                                    <input type="text" value={editingCourse.lecturer} onChange={e => setEditingCourse({ ...editingCourse, lecturer: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Faculty</label>
                                    <input type="text" value={editingCourse.faculty} onChange={e => setEditingCourse({ ...editingCourse, faculty: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Credits</label>
                                    <input type="number" step="0.5" value={editingCourse.credits} onChange={e => setEditingCourse({ ...editingCourse, credits: parseFloat(e.target.value) })} required />
                                </div>
                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <textarea value={editingCourse.description} onChange={e => setEditingCourse({ ...editingCourse, description: e.target.value })} rows="3" />
                                </div>
                                <div className="form-group">
                                    <label>Prerequisites</label>
                                    <input type="text" value={editingCourse.prerequisites} onChange={e => setEditingCourse({ ...editingCourse, prerequisites: e.target.value })} placeholder="e.g. CS101" />
                                </div>
                                <div className="form-group">
                                    <label>Corequisites</label>
                                    <input type="text" value={editingCourse.corequisites} onChange={e => setEditingCourse({ ...editingCourse, corequisites: e.target.value })} placeholder="e.g. CS101L" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="save-btn">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .courses-page { max-width: 1200px; margin: 0 auto; }
                .flex-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
                .subtitle { color: #888; margin-top: -1.5rem; }
                .add-btn { display: flex; align-items: center; gap: 0.5rem; background: #3b82f6; color: white; border: none; padding: 0.75rem 1.25rem; border-radius: 0.75rem; cursor: pointer; font-weight: 600; }
                
                .filters-row { display: grid; grid-template-columns: 1fr 200px; gap: 1rem; margin-bottom: 1.5rem; }
                .search-bar { position: relative; }
                .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #555; }
                .search-bar input { width: 100%; padding: 0.75rem 1rem 0.75rem 3rem; background: #111114; border: 1px solid #1f1f23; border-radius: 0.75rem; color: white; }
                
                .term-filter { position: relative; }
                .filter-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #555; pointer-events: none; }
                .term-filter select { width: 100%; padding: 0.75rem 0.75rem 0.75rem 2.5rem; background: #111114; border: 1px solid #1f1f23; border-radius: 0.75rem; color: white; appearance: none; cursor: pointer; }
                
                .data-table-card { background: #111114; border-radius: 1.25rem; border: 1px solid #1f1f23; overflow: hidden; }
                table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; }
                th { padding: 1.25rem 1.5rem; color: #555; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; border-bottom: 1px solid #1f1f23; }
                td { padding: 1.125rem 1.5rem; border-bottom: 1px solid #1f1f23; color: #ccc; }
                
                .term-tag span { background: #3b82f620; color: #3b82f6; padding: 0.25rem 0.625rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 700; }
                .font-semibold { font-weight: 600; color: white; }
                .mono { font-family: monospace; color: #888; }
                .actions-cell { text-align: right; }
                .action-btns { display: flex; justify-content: flex-end; gap: 0.5rem; }
                .icon-btn { padding: 0.5rem; border-radius: 0.5rem; border: 1px solid #1f1f23; background: #1a1a1e; color: #888; cursor: pointer; }
                .icon-btn.edit:hover { background: #2563eb10; color: #3b82f6; border-color: #3b82f640; }
                .icon-btn.delete:hover { background: #ef444410; color: #ef4444; border-color: #ef444440; }
                
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
                .modal-card { background: #111114; border: 1px solid #1f1f23; border-radius: 1.5rem; width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; border-bottom: 1px solid #1f1f23; }
                .modal-grid { padding: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
                .full-width { grid-column: span 2; }
                .form-group label { display: block; font-size: 0.8125rem; font-weight: 600; color: #555; margin-bottom: 0.5rem; text-transform: uppercase; }
                .form-group input, .form-group textarea { width: 100%; background: #1a1a1e; border: 1px solid #2a2a2f; border-radius: 0.75rem; padding: 0.75rem 1rem; color: white; box-sizing: border-box; }
                .modal-footer { padding: 1.5rem 2rem; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #1f1f23; }
                .cancel-btn { background: none; border: 1px solid #1f1f23; color: #888; padding: 0.75rem 1.5rem; border-radius: 0.75rem; cursor: pointer; font-weight: 600; }
                .save-btn { background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; cursor: pointer; font-weight: 600; }
                .close-btn { background: none; border: none; color: #555; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default Courses;
