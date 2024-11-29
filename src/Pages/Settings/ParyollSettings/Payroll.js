import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase';
import { useAuth } from '../../../auth/AuthContext';
import { Alert } from 'react-bootstrap';

const PayrollSettings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let unsubscribe;

        const fetchEmployees = async () => {
            if (user) {
                setLoading(true);
                try {
                    const employeesRef = collection(firestore, 'employees');
                    const q = query(employeesRef, where("companyId", "==", user.uid));
                    
                    unsubscribe = onSnapshot(q, (querySnapshot) => {
                        const employeeData = querySnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            Designation: doc.data().designation?.name || 'N/A',
                            Department: doc.data().department?.name || 'N/A'
                        }));
                        setEmployees(employeeData);
                        setLoading(false);
                    });
                } catch (error) {
                    console.error("Error fetching employees:", error);
                    setLoading(false);
                }
            }
        };

        fetchEmployees();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user]);

    const filteredEmployees = employees.filter(emp => {
        return (
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.Designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.Department.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const handleDeleteEmployee = async (employeeId) => {
        if (window.confirm("Are you sure you want to delete this employee?")) {
            try {
                await deleteDoc(doc(firestore, 'employees', employeeId));
            } catch (error) {
                console.error("Error deleting employee:", error);
                setError("Failed to delete employee. Please try again.");
            }
        }
    };

    const handleViewEmployee = (emp) => {
        navigate(`/Payroll-Settings/${emp.id}`);
    };

    return (
        <div className="container my-3 d-flex flex-column min-vh-100">
            <div className="rounded-3">
                <div className="d-flex justify-content-between px-3 align-items-end">
                    <div className="head-content">
                        <h3>Payroll Settings</h3>
                        <nav style={{ '--bs-breadcrumb-divider': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'8\'%3E%3Cpath d=\'M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z\' fill=\'currentColor\'/%3E%3C/svg%3E")' }} aria-label="breadcrumb">
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item active text-danger" aria-current="page"><b>Payroll</b></li>
                                <li className="breadcrumb-item active" aria-current="page">Payroll Settings</li>
                            </ol>
                        </nav>
                    </div>
                </div>

                <div className="container my-4">
                    <div className="table-container p-3 rounded">
                        <div className="row d-flex justify-content-between align-items-center mb-2">
                            <div className="col-12 col-md-6 d-flex align-items-center mb-2 mb-md-0">
                                <label htmlFor="rowsPerPage" className="me-2">Listings per page:</label>
                                <select id="rowsPerPage" className="form-select w-auto" value={rowsPerPage} onChange={(e) => setRowsPerPage(parseInt(e.target.value))}>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                    <option value={20}>20</option>
                                    <option value={filteredEmployees.length}>All</option>
                                </select>
                            </div>
                            <div className="col-12 col-md-6">
                                <div className="input-group">
                                    <input 
                                        id="searchInput" 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Search in all columns ( Employee )" 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)} 
                                    />
                                    <button className="btn btn-outline-danger" type="button">Search</button>
                                </div>
                            </div>
                        </div>

                        {error && <Alert variant="danger">{error}</Alert>}

                        <div className="table-responsive">
                            {loading ? (
                                <div className="text-center my-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <table className="table table-bordered text-center">
                                    <thead>
                                        <tr>
                                            <th scope="col">NAME</th>
                                            <th scope="col">Designation</th>
                                            <th scope="col">Department</th>
                                            <th scope="col">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEmployees.slice(0, rowsPerPage === filteredEmployees.length ? filteredEmployees.length : rowsPerPage).map(emp => (
                                            <tr key={emp.id}>
                                                <td>{emp.name}</td>
                                                <td>{emp.Designation}</td>
                                                <td>{emp.Department}</td>
                                                <td>
                                                    <button className="btn btn-secondary btn-sm me-2" onClick={() => handleViewEmployee(emp)}>
                                                        <i className="bi bi-pencil "></i>
                                                    </button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEmployee(emp.id)}>
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-auto">
                <div className="small text-muted text-center py-2">
                © 2024 HRIFY. Powered by JK Global IT Solutions.
                </div>
            </div>
        </div>
    );
};

export default PayrollSettings;

// Export functionality
export const exportEmployeeData = async () => {
    try {
        const employeesRef = collection(firestore, 'employees');
        const querySnapshot = await getDocs(employeesRef);
        const employeeData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            Designation: doc.data().designation?.name || 'N/A',
            Department: doc.data().department?.name || 'N/A'
        }));

        // Convert to CSV or any other format as needed
        const csvContent = convertToCSV(employeeData);

        // Create a Blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "employee_data.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        console.error("Error exporting employee data:", error);
    }
};

// Helper function to convert data to CSV
const convertToCSV = (data) => {
    const header = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(','));
    return [header, ...rows].join('\n');
};