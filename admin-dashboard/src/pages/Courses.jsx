import React, { useState, useEffect } from 'react';
import AdminAPI from '../api';
import { Search, Plus, Edit2, Trash2, X, Check } from 'lucide-react';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState(null);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await AdminAPI.getCourses(search);
            setCourses(res.data.courses || []);
        } catch (err) {
            console.error('Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCourses();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        try {
            await AdminAPI.deleteCourse(id);
            fetchCourses();
        } catch (err) {
            alert('Failed to delete course');
        }
    };

    return (
        <div className="p-8 courses-page">
            <header className="flex-header">
                <div>
                    <h1>Course Management</h1>
                    <p className="subtitle">Search, edit, and manage the course database</p>
                </div>
                <button className="add-btn">
                    <Plus size={18} />
                    <span>Add New Course</span>
                </button>
            </header>

            <div className="search-bar">
                <Search size={20} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search by course name, section, or lecturer..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="data-table-card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Course Name</th>
                                <th>Section</th>
                                <th>Lecturer</th>
                                <th>Faculty</th>
                                <th>Credits</th>
                                <th className="actions-header">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="loading-row">Searching database...</td>
                                </tr>
                            ) : courses.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="empty-row">No courses found matching your search.</td>
                                </tr>
                            ) : (
                                courses.map(course => (
                                    <tr key={course.id}>
                                        <td className="font-semibold">{course.course_name}</td>
                                        <td className="mono">{course.section_name}</td>
                                        <td>{course.lecturer}</td>
                                        <td className="text-muted">{course.faculty}</td>
                                        <td>{course.credits}</td>
                                        <td className="actions-cell">
                                            <div className="action-btns">
                                                <button className="icon-btn edit">
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

            <style>{`
                .courses-page {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .flex-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                }
                .subtitle {
                    color: #888;
                    margin-top: -1.5rem;
                }
                .add-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.25rem;
                    border-radius: 0.75rem;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .add-btn:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                }
                .search-bar {
                    position: relative;
                    margin-bottom: 1.5rem;
                }
                .search-icon {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #555;
                }
                .search-bar input {
                    width: 100%;
                    padding: 1rem 1rem 1rem 3rem;
                    background: #111114;
                    border: 1px solid #1f1f23;
                    border-radius: 1rem;
                    color: white;
                    font-size: 1rem;
                    transition: border-color 0.2s;
                    box-sizing: border-box;
                }
                .search-bar input:focus {
                    outline: none;
                    border-color: #3b82f6;
                }
                .data-table-card {
                    background: #111114;
                    border-radius: 1.25rem;
                    border: 1px solid #1f1f23;
                    overflow: hidden;
                }
                .table-wrapper {
                    overflow-x: auto;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                    font-size: 0.875rem;
                }
                th {
                    padding: 1.25rem 1.5rem;
                    color: #555;
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    border-bottom: 1px solid #1f1f23;
                }
                td {
                    padding: 1.125rem 1.5rem;
                    border-bottom: 1px solid #1f1f23;
                    color: #ccc;
                }
                .font-semibold { font-weight: 600; color: white; }
                .mono { font-family: ui-monospace, sans-serif; color: #888; }
                .text-muted { color: #666; font-size: 0.8125rem; }
                .actions-header { text-align: right; }
                .actions-cell { text-align: right; }
                .action-btns {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.5rem;
                }
                .icon-btn {
                    padding: 0.5rem;
                    border-radius: 0.5rem;
                    border: 1px solid #1f1f23;
                    background: #1a1a1e;
                    color: #888;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .icon-btn:hover { color: white; background: #25252b; }
                .icon-btn.delete:hover { color: #ef4444; border-color: #ef444440; background: #ef444410; }
                .loading-row, .empty-row {
                    padding: 4rem !important;
                    text-align: center;
                    color: #555;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
};

export default Courses;
