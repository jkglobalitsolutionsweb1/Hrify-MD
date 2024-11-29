import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import { useAuth } from '../../auth/AuthContext';
import { Alert, Form, Col, Modal, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';


const PayrollReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payslips, setPayslips] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPayslip, setEditingPayslip] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchPayslips();
  }, [user]);

  const fetchPayslips = async () => {
    if (user) {
      setLoading(true);
      try {
        const employeesRef = collection(firestore, 'employees');
        const q = query(employeesRef, where("companyId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        const payslipData = [];
        for (const employeeDoc of querySnapshot.docs) {
          const payslipsRef = collection(employeeDoc.ref, 'payslips');
          const payslipsSnapshot = await getDocs(payslipsRef);
          payslipsSnapshot.forEach(payslipDoc => {
            payslipData.push({
              id: payslipDoc.id,
              employeeId: employeeDoc.id,
              employeeName: employeeDoc.data().name,
              ...payslipDoc.data(),
              status: payslipDoc.data().status || 'Pending'
            });
          });
        }
        setPayslips(payslipData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching payslips:", error);
        setError("Failed to fetch payslips. Please try again.");
        setLoading(false);
      }
    }
  };

  const filteredPayslips = payslips.filter(payslip => {
    const employeeName = payslip.employeeName.toLowerCase();
    const [month, year] = (payslip.month || '').split('-');
    const payslipDate = new Date(year, month - 1);
    const nameMatch = employeeName.includes(searchTerm.toLowerCase());
    const dateMatch = selectedMonth
      ? payslipDate.getFullYear() === parseInt(selectedMonth.split('-')[0]) &&
        payslipDate.getMonth() === parseInt(selectedMonth.split('-')[1]) - 1
      : true;
    return nameMatch && dateMatch;
  });

  const handleViewPayslip = (payslip) => {
    navigate(`/payslip-screen/${payslip.employeeId}/${payslip.month}`);
  };

  const handleEditClick = (payslip) => {
    setEditingPayslip(payslip);
    setNewStatus(payslip.status);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingPayslip(null);
    setNewStatus('');
  };

  const handleSaveStatus = async () => {
    try {
      const payslipRef = doc(firestore, 'employees', editingPayslip.employeeId, 'payslips', editingPayslip.id);
      await updateDoc(payslipRef, { status: newStatus });
      
      // Update the payslips state immediately
      setPayslips(prevPayslips => 
        prevPayslips.map(p => 
          p.id === editingPayslip.id ? { ...p, status: newStatus } : p
        )
      );
      
      handleCloseModal();
      await fetchPayslips();
    } catch (error) {
      console.error("Error updating payslip status:", error);
      setError("Failed to update payslip status. Please try again.");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const formatMonth = (monthYear) => {
    if (!monthYear) return 'N/A';
    const [month, year] = monthYear.split('-');
    if (!month || !year) return monthYear;
    return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="container my-3 d-flex flex-column min-vh-100">
      <div className="rounded-3">
        <div className="d-flex justify-content-between px-3 align-items-end">
          <div className="head-content">
            <h3>Payroll Reports</h3>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item active text-danger" aria-current="page">
                  <Link className="text-decoration-none text-danger" to="/PayslipRoute">
                    <b>Home</b>
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Payslip
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                Payroll Reports
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="container my-4">
          <div className="table-container p-3 rounded">
            <div className="row d-flex justify-content-between align-items-center mb-2">
              <Col xs={12} md={3} className="d-flex align-items-center mb-2 mb-md-0">
                <Form.Label htmlFor="rowsPerPage" className="me-2">Listings per page:</Form.Label>
                <Form.Select 
                  id="rowsPerPage"
                  className="w-auto"
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={filteredPayslips.length}>All</option>
                </Form.Select>
              </Col>
              <Col xs={12} md={4} className="align-items-center mb-2 mb-md-0">
                <Form.Label className="me-2">Filter Payslip List:</Form.Label>
                <Form.Control
                  type="month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </Col>
              <Col xs={12} md={5}>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    placeholder="Search by employee name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-outline-danger" type="button">Search</button>
                </div>
              </Col>
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
                      <th scope="col">Employee Name</th>
                      <th scope="col">Net Salary</th>
                      <th scope="col">Month</th>
                      <th scope="col">Status</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayslips.slice(0, rowsPerPage === filteredPayslips.length ? filteredPayslips.length : rowsPerPage).map(payslip => (
                      <tr key={`${payslip.employeeId}-${payslip.month}`}>
                        <td>{payslip.employeeName}</td>
                        <td>{formatCurrency(payslip.netSalary)}</td>
                        <td>{formatMonth(payslip.month)}</td>
                        <td>{payslip.status}</td>
                        <td>
                          <button className="btn btn-secondary btn-sm me-2" onClick={() => handleViewPayslip(payslip)}>
                            <i className="bi bi-eye"></i> View
                          </button>
                          <button className="btn btn-primary btn-sm" onClick={() => handleEditClick(payslip)}>
                            <i className="bi bi-pencil"></i> Edit
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

      <Modal show={showEditModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Payslip Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="payslipStatus">
              <Form.Label>Status</Form.Label>
              <Form.Select 
                value={newStatus} 
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveStatus}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
      <div className="mt-3">
        <div className="small text-muted text-center py-2">
          © 2024 HRIFY. Powered by JK Global IT Solutions.
        </div>
      </div>
    </div>
  );
};

export default PayrollReports;