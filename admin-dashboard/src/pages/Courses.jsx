import React, { useState, useEffect } from 'react';
import AdminAPI from '../api';
import { Search, Plus, Edit2, Trash2, X, Check, Filter, Clock, Calendar } from 'lucide-react';

// Time slot ID mappings (14 slots per day)
const DAYS = [
    { name: 'Monday', offset: 1 },
    { name: 'Tuesday', offset: 15 },
    { name: 'Wednesday', offset: 29 },
    { name: 'Thursday', offset: 43 },
    { name: 'Friday', offset: 57 }
];

const TIME_HOURS = [
    { label: '08:40', hour: 8 },
    { label: '09:40', hour: 9 },
    { label: '10:40', hour: 10 },
    { label: '11:40', hour: 11 },
    { label: '12:40', hour: 12 },
    { label: '13:40', hour: 13 },
    { label: '14:40', hour: 14 },
    { label: '15:40', hour: 15 },
    { label: '16:40', hour: 16 },
    { label: '17:40', hour: 17 },
    { label: '18:40', hour: 18 },
    { label: '19:40', hour: 19 },
    { label: '20:40', hour: 20 },
    { label: '21:40', hour: 21 }
];

// Helper to convert time ID to readable format
const timeIdToReadable = (timeId) => {
    for (const day of DAYS) {
        const hourIndex = timeId - day.offset;
        if (hourIndex >= 0 && hourIndex < 14) {
            return { day: day.name, hour: TIME_HOURS[hourIndex]?.label || `${hourIndex + 8}:40` };
        }
    }
    return { day: 'Unknown', hour: 'Unknown' };
};

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [terms, setTerms] = useState([]);
    const [selectedTerm, setSelectedTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingCourse, setEditingCourse] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [timeSlots, setTimeSlots] = useState([]);
    const [newSlot, setNewSlot] = useState({ day: 'Monday', startHour: 9, endHour: 10 });
    const [loadingSlots, setLoadingSlots] = useState(false);

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

    const fetchTimeSlots = async (courseId, term) => {
        if (!courseId) {
            setTimeSlots([]);
            return;
        }
        setLoadingSlots(true);
        try {
            const res = await AdminAPI.getCourseSlots(courseId, term);
            setTimeSlots(res.data.slots || []);
        } catch (err) {
            console.error('Failed to fetch time slots');
            setTimeSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleDelete = async (course) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        try {
            await AdminAPI.deleteCourse(course.id, course.term);
            fetchData();
        } catch (err) {
            alert('Failed to delete course');
        }
    };

    const handleEdit = async (course) => {
        setEditingCourse({ ...course });
        setShowModal(true);
        await fetchTimeSlots(course.id, course.term);
    };

    const handleAddNew = () => {
        const defaultTerm = selectedTerm || (terms.length > 0 ? terms[0] : '');
        setEditingCourse({
            course_code: '',
            course_name: '',
            section_name: '',
            faculty: '',
            term: defaultTerm,
            lecturer: '',
            credits: 0,
            prerequisites: '',
            corequisites: '',
            description: ''
        });
        setTimeSlots([]);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            let courseId = editingCourse.id;
            if (editingCourse.id) {
                await AdminAPI.updateCourse(editingCourse.id, editingCourse);
            } else {
                const res = await AdminAPI.addCourse(editingCourse);
                courseId = res.data.course.id;
            }

            // Save new time slots for newly created courses
            if (!editingCourse.id && timeSlots.length > 0) {
                for (const slot of timeSlots) {
                    if (!slot.id) { // Only add new (unsaved) slots
                        await AdminAPI.addCourseSlot(courseId, {
                            term: editingCourse.term,
                            start_time_id: slot.start_time_id,
                            end_time_id: slot.end_time_id
                        });
                    }
                }
            }

            setShowModal(false);
            fetchData();
        } catch (err) {
            alert('Failed to save course: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleAddSlot = async () => {
        const dayData = DAYS.find(d => d.name === newSlot.day);
        if (!dayData) return;

        const start_time_id = (newSlot.startHour - 8) + dayData.offset;
        const end_time_id = (newSlot.endHour - 8) + dayData.offset;

        if (start_time_id >= end_time_id) {
            alert('End time must be after start time');
            return;
        }

        const slotToAdd = { start_time_id, end_time_id };

        if (editingCourse.id) {
            // Existing course - save to backend immediately
            try {
                const res = await AdminAPI.addCourseSlot(editingCourse.id, {
                    term: editingCourse.term,
                    ...slotToAdd
                });
                setTimeSlots([...timeSlots, res.data.slot]);
            } catch (err) {
                alert('Failed to add time slot');
            }
        } else {
            // New course - add to local state (will be saved when course is created)
            setTimeSlots([...timeSlots, slotToAdd]);
        }
    };

    const handleDeleteSlot = async (slot, index) => {
        if (slot.id && editingCourse.id) {
            // Existing slot - delete from backend
            try {
                await AdminAPI.deleteCourseSlot(editingCourse.id, slot.id, editingCourse.term);
                setTimeSlots(timeSlots.filter((_, i) => i !== index));
            } catch (err) {
                alert('Failed to delete time slot');
            }
        } else {
            // Local slot - just remove from state
            setTimeSlots(timeSlots.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="p-8 courses-page">
            <header className="flex-header">
                <div>
                    <h1>Course Management</h1>
                    <p className="subtitle">Search, edit, and manage the course database</p>
                </div>
                <button className="add-btn" onClick={handleAddNew}>
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
                                                <button className="icon-btn delete" onClick={() => handleDelete(course)}>
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
                                    <textarea value={editingCourse.description || ''} onChange={e => setEditingCourse({ ...editingCourse, description: e.target.value })} rows="3" />
                                </div>
                                <div className="form-group">
                                    <label>Prerequisites</label>
                                    <input type="text" value={editingCourse.prerequisites || ''} onChange={e => setEditingCourse({ ...editingCourse, prerequisites: e.target.value })} placeholder="e.g. CS101" />
                                </div>
                                <div className="form-group">
                                    <label>Corequisites</label>
                                    <input type="text" value={editingCourse.corequisites || ''} onChange={e => setEditingCourse({ ...editingCourse, corequisites: e.target.value })} placeholder="e.g. CS101L" />
                                </div>
                            </div>

                            {/* Time Slots Section */}
                            <div className="time-slots-section">
                                <div className="section-header">
                                    <Clock size={18} />
                                    <h3>Time Slots</h3>
                                </div>

                                {loadingSlots ? (
                                    <p className="loading-slots">Loading time slots...</p>
                                ) : (
                                    <>
                                        {timeSlots.length > 0 && (
                                            <div className="slots-list">
                                                {timeSlots.map((slot, index) => {
                                                    const start = timeIdToReadable(slot.start_time_id);
                                                    const end = timeIdToReadable(slot.end_time_id);
                                                    return (
                                                        <div key={index} className="slot-item">
                                                            <Calendar size={14} />
                                                            <span className="slot-day">{start.day}</span>
                                                            <span className="slot-time">{start.hour} - {end.hour}</span>
                                                            <button type="button" className="remove-slot-btn" onClick={() => handleDeleteSlot(slot, index)}>
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <div className="add-slot-form">
                                            <select value={newSlot.day} onChange={e => setNewSlot({ ...newSlot, day: e.target.value })}>
                                                {DAYS.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                            </select>
                                            <select value={newSlot.startHour} onChange={e => setNewSlot({ ...newSlot, startHour: parseInt(e.target.value) })}>
                                                {TIME_HOURS.map(t => <option key={t.hour} value={t.hour}>{t.label}</option>)}
                                            </select>
                                            <span className="to-separator">to</span>
                                            <select value={newSlot.endHour} onChange={e => setNewSlot({ ...newSlot, endHour: parseInt(e.target.value) })}>
                                                {TIME_HOURS.map(t => <option key={t.hour} value={t.hour}>{t.label}</option>)}
                                            </select>
                                            <button type="button" className="add-slot-btn" onClick={handleAddSlot}>
                                                <Plus size={16} />
                                                Add Slot
                                            </button>
                                        </div>
                                    </>
                                )}
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

                /* Time Slots Section */
                .time-slots-section { padding: 0 2rem 1.5rem; border-top: 1px solid #1f1f23; margin-top: 0.5rem; }
                .section-header { display: flex; align-items: center; gap: 0.5rem; padding: 1.25rem 0 1rem; color: #888; }
                .section-header h3 { margin: 0; font-size: 0.875rem; font-weight: 600; text-transform: uppercase; }
                .loading-slots { color: #555; font-style: italic; }
                
                .slots-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
                .slot-item { display: flex; align-items: center; gap: 0.75rem; background: #1a1a1e; border: 1px solid #2a2a2f; border-radius: 0.5rem; padding: 0.5rem 0.75rem; color: #ccc; }
                .slot-day { font-weight: 600; color: #3b82f6; min-width: 100px; }
                .slot-time { font-family: monospace; color: #888; }
                .remove-slot-btn { margin-left: auto; background: none; border: none; color: #ef4444; cursor: pointer; padding: 0.25rem; border-radius: 0.25rem; }
                .remove-slot-btn:hover { background: #ef444420; }

                .add-slot-form { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
                .add-slot-form select { background: #1a1a1e; border: 1px solid #2a2a2f; border-radius: 0.5rem; padding: 0.5rem 0.75rem; color: white; }
                .to-separator { color: #555; }
                .add-slot-btn { display: flex; align-items: center; gap: 0.25rem; background: #22c55e; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; font-size: 0.875rem; }
                .add-slot-btn:hover { background: #16a34a; }
            `}</style>
        </div>
    );
};

export default Courses;
