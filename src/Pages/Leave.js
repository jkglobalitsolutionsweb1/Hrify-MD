import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Form, Modal, Breadcrumb } from 'react-bootstrap';
import { getFirestore, collection, query, where, addDoc, updateDoc, deleteDoc, doc, Timestamp, onSnapshot, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';

const db = getFirestore();

const Leave = () => {
  const { user } = useAuth();
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLeaveActionModal, setShowLeaveActionModal] = useState(false);
  const [showEditLeaveModal, setShowEditLeaveModal] = useState(false);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const [showCreateLeaveModal, setShowCreateLeaveModal] = useState(false);
  const [leaveData, setLeaveData] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [dateError, setDateError] = useState('');
  const [companySettings, setCompanySettings] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchCompanySettings = async () => {
      const snapshot = await getDoc(doc(db, 'companies', user.uid, 'company_settings', 'companyDetails'));
      setCompanySettings(snapshot.data());
    };

    const fetchEmployees = () => {
      const employeesRef = collection(db, 'employees');
      const employeesQuery = query(employeesRef, where("companyId", "==", user.uid));
      return onSnapshot(employeesQuery, (snapshot) => {
        const employeesList = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email
        }));
        setEmployees(employeesList);
      });
    };

    const fetchAllLeaveRequests = () => {
      const employeesRef = collection(db, 'employees');
      const employeesQuery = query(employeesRef, where("companyId", "==", user.uid));
      
      return onSnapshot(employeesQuery, (employeesSnapshot) => {
        const allLeaves = [];
        const leaveUnsubscribes = [];

        employeesSnapshot.docs.forEach((employeeDoc) => {
          const employeeData = employeeDoc.data();
          const leaveRequestsRef = collection(employeeDoc.ref, 'leave_requests');
          
          const leaveUnsubscribe = onSnapshot(leaveRequestsRef, (leaveSnapshot) => {
            leaveSnapshot.docs.forEach((leaveDoc) => {
              const leaveData = leaveDoc.data();
              const existingLeaveIndex = allLeaves.findIndex(leave => leave.leaveId === leaveDoc.id);
              const formattedLeave = {
                leaveId: leaveDoc.id,
                ...leaveData,
                employeeName: employeeData.name,
                employeeId: employeeDoc.id,
                fromDate: formatDate(leaveData.fromDate),
                toDate: formatDate(leaveData.toDate),
                requestDate: formatDate(leaveData.requestDate),
              };

              if (existingLeaveIndex > -1) {
                allLeaves[existingLeaveIndex] = formattedLeave;
              } else {
                allLeaves.push(formattedLeave);
              }
            });
            
            setLeaveData([...allLeaves]);
            setLoading(false);
          });

          leaveUnsubscribes.push(leaveUnsubscribe);
        });

        return () => leaveUnsubscribes.forEach(unsubscribe => unsubscribe());
      });
    };

    fetchCompanySettings();
    const employeesUnsubscribe = fetchEmployees();
    const leavesUnsubscribe = fetchAllLeaveRequests();

    return () => {
      employeesUnsubscribe();
      leavesUnsubscribe();
    };
  }, [user]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const parseDate = (dateString) => {
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
  };

  const filteredData = leaveData.filter(leave => 
    leave.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const rowsToShow = rowsPerPage === 'all' ? filteredData : filteredData.slice(0, Number(rowsPerPage));

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleRowsChange = (e) => {
    setRowsPerPage(e.target.value);
  };

  const validateDates = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setDateError('End date cannot be before start date');
      return false;
    }
    setDateError('');
    return true;
  };

  const calculateTotalWorkingDays = (fromDate, toDate) => {
    let totalWorkingDays = 0;
    const currentDate = new Date(fromDate);
    const endDate = new Date(toDate);

    while (currentDate <= endDate) {
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()];
      const isHoliday = companySettings.holidays.some(holiday => 
        holiday.toDate().toDateString() === currentDate.toDateString()
      );
      const isWorkingDay = companySettings.workingDays.includes(dayName);

      if (isWorkingDay && !isHoliday) {
        totalWorkingDays++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return totalWorkingDays;
  };

  const handleCreateLeave = async (leaveData) => {
    try {
      const fromDate = parseDate(leaveData.fromDate);
      const toDate = parseDate(leaveData.toDate);

      if (!validateDates(fromDate, toDate)) {
        return;
      }

      const employeeRef = doc(db, 'employees', leaveData.employeeId);
      const leaveRequestsRef = collection(employeeRef, 'leave_requests');
      const employee = employees.find(emp => emp.id === leaveData.employeeId);
      
      const totalDays = calculateTotalWorkingDays(fromDate, toDate);

      const newLeaveRequest = {
        employeeId: leaveData.employeeId,
        email: employee.email,
        employeeName: employee.name,
        fromDate: Timestamp.fromDate(fromDate),
        leaveType: leaveData.leaveType,
        reason: leaveData.reason,
        requestDate: Timestamp.fromDate(new Date()),
        status: 'Pending',
        toDate: Timestamp.fromDate(toDate),
        totalDays: totalDays.toString()
      };

      const docRef = await addDoc(leaveRequestsRef, newLeaveRequest);
      await updateDoc(doc(db, 'employees', leaveData.employeeId, 'leave_requests', docRef.id), { leaveId: docRef.id });

      setShowCreateLeaveModal(false);
    } catch (error) {
      console.error("Error creating leave request:", error);
    }
  };

  const handleUpdateLeave = async (leaveId, updatedData) => {
    try {
      const fromDate = parseDate(updatedData.fromDate);
      const toDate = parseDate(updatedData.toDate);

      if (!validateDates(fromDate, toDate)) {
        return;
      }

      const leaveRef = doc(db, 'employees', updatedData.employeeId, 'leave_requests', leaveId);
      const totalDays = calculateTotalWorkingDays(fromDate, toDate);

      await updateDoc(leaveRef, {
        ...updatedData,
        fromDate: Timestamp.fromDate(fromDate),
        toDate: Timestamp.fromDate(toDate),
        totalDays: totalDays.toString(),
        requestDate: Timestamp.fromDate(parseDate(updatedData.requestDate))
      });
      setShowEditLeaveModal(false);
    } catch (error) {
      console.error("Error updating leave request:", error);
    }
  };

  const handleDeleteLeave = async (leaveId, employeeId) => {
    try {
      const leaveRef = doc(db, 'employees', employeeId, 'leave_requests', leaveId);
      await deleteDoc(leaveRef);
      setShowDeleteConfirmationModal(false);
    } catch (error) {
      console.error("Error deleting leave request:", error);
    }
  };

  return (
    <div className="my-3 container-fluid d-flex flex-column min-vh-100">
      <Container fluid className="my-3">
        <div className="rounded-3">
          <div className="d-flex justify-content-between px-3 align-items-end">
            <div className="head-content">
              <h3>Manage Leave Requests</h3>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/dashboard" className="text-danger" style={{ textDecoration: 'none' }}>
                    <b>Home</b>
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Leave Requests</li>
              </ol>
            </div>
            <div className="button text-end m-2 mx-1">
              <Button variant="danger" onClick={() => setShowCreateLeaveModal(true)}>
                <i className="fa-solid fa-plus"></i>
              </Button>
            </div>
          </div>

          <Container className="my-4">
            <div className="table-container p-3 rounded">
              <Row className="d-flex justify-content-between align-items-center mb-2">
                <Col md={6} className="d-flex align-items-center mb-2 mb-md-0">
                  <Form.Select
                    id="rowsPerPage"
                    className="w-auto"
                    value={rowsPerPage}
                    onChange={handleRowsChange}
                  >
                    <option value="all">All</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                  </Form.Select>
                  <label htmlFor="rowsPerPage" className="ms-2">
                    Listings per page:
                  </label>
                </Col>
                <Col md={6} className="d-flex align-items-center mb-2 mb-md-0">
                  <Form className="input-group">
                    <Form.Control
                      id="searchInput"
                      type="text"
                      placeholder="Search by Employee Name"
                      onChange={handleSearch}
                    />
                    <Button variant="outline-danger">Search</Button>
                  </Form>
                </Col>
              </Row>

              <div className="table-responsive">
                <Table bordered className="text-center">
                  <thead>
                    <tr>
                      <th>EMPLOYEE</th>
                      <th>LEAVE TYPE</th>
                      <th>APPLIED ON</th>
                      <th>START DATE</th>
                      <th>END DATE</th>
                      <th>TOTAL DAYS</th>
                      <th>LEAVE REASON</th>
                      <th>STATUS</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody id="attendanceTable">
                    {loading ? (
                      <tr>
                        <td colSpan="9">Loading...</td>
                      </tr>
                    ) : rowsToShow.length > 0 ? (
                      rowsToShow.map((leave) => (
                        <tr key={leave.leaveId}>
                          <td>{leave.employeeName}</td>
                          <td>{leave.leaveType}</td>
                          <td>{leave.requestDate}</td>
                          <td>{leave.fromDate}</td>
                          <td>{leave.toDate}</td>
                          <td>{leave.totalDays}</td>
                          <td>{leave.reason}</td>
                          <td>{leave.status}</td>
                          <td>
                            <Button
                              variant="dark"
                              className="mx-1"
                              size="sm"
                              title="Manage Leave"
                              onClick={() => {
                                setSelectedLeave(leave);
                                setShowLeaveActionModal(true);
                              }}
                            >
                              <i className="bi bi-arrow-right"></i>
                            </Button>
                            <Button
                              variant="secondary"
                              className="mx-1"
                              size="sm"
                              title="Edit"
                              onClick={() => {
                                setSelectedLeave(leave);
                                setShowEditLeaveModal(true);
                              }}
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </Button>
                            <Button
                              variant="danger"
                              className="mx-1"
                              size="sm"
                              title="Delete"
                              onClick={() => {
                                setSelectedLeave(leave);
                                setShowDeleteConfirmationModal(true);
                              }}
                            >
                              <i className="bi bi-trash-fill"></i>
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9">No records found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </Container>

          <Modal
            show={showLeaveActionModal}
            onHide={() => setShowLeaveActionModal(false)}
          >
            <Modal.Header closeButton>
              <Modal.Title>Leave Action</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedLeave && (
                <Form>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Label>Employee</Form.Label>
                      <Form.Control type="text" value={selectedLeave.employeeName} readOnly />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Leave Type</Form.Label>
                      <Form.Control type="text" value={selectedLeave.leaveType} readOnly />
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Label>Applied On</Form.Label>
                      <Form.Control type="text" value={selectedLeave.requestDate} readOnly />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control type="text" value={selectedLeave.fromDate} readOnly />
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Label>End Date</Form.Label>
                      <Form.Control type="text" value={selectedLeave.toDate} readOnly />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Control type="text" value={selectedLeave.status} readOnly />
                    </Col>

                    <Col md={12} className="mb-3">
                      <Form.Label>Leave Reason</Form.Label>
                      <Form.Control as="textarea" rows={2} value={selectedLeave.reason} readOnly />
                    </Col>
                  </Row>
                </Form>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="success" onClick={() => {handleUpdateLeave(selectedLeave.leaveId, { ...selectedLeave, status: 'Approved' });setShowLeaveActionModal(false);}}>Approve</Button>
              <Button variant="secondary" onClick={() => {handleUpdateLeave(selectedLeave.leaveId, { ...selectedLeave, status: 'Pending' });setShowLeaveActionModal(false);}}>Pending</Button>
              <Button variant="danger" onClick={() => {handleUpdateLeave(selectedLeave.leaveId, { ...selectedLeave, status: 'Rejected' });setShowLeaveActionModal(false);}}>Reject</Button>
            </Modal.Footer>
          </Modal>

          <Modal
            show={showEditLeaveModal}
            onHide={() => setShowEditLeaveModal(false)}
          >
            <Modal.Header closeButton>
              <Modal.Title>Edit Leave</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedLeave && (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Employee</Form.Label>
                    <Form.Control type="text" value={selectedLeave.employeeName} readOnly />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Leave Type*</Form.Label>
                    <Form.Select
                      value={selectedLeave.leaveType}
                      onChange={(e) => setSelectedLeave({ ...selectedLeave, leaveType: e.target.value })}
                    >
                      <option value="Loss Of Pay">Loss Of Pay</option>
                      <option value="Paid Leave">Paid Leave</option>
                    </Form.Select>
                  </Form.Group>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Start Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={selectedLeave.fromDate.split('/').reverse().join('-')}
                          onChange={(e) => {
                            const newFromDate = formatDate(new Date(e.target.value));
                            setSelectedLeave({ ...selectedLeave, fromDate: newFromDate });
                            validateDates(e.target.value, selectedLeave.toDate.split('/').reverse().join('-'));
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>End Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={selectedLeave.toDate.split('/').reverse().join('-')}
                          onChange={(e) => {
                            const newToDate = formatDate(new Date(e.target.value));
                            setSelectedLeave({ ...selectedLeave, toDate: newToDate });
                            validateDates(selectedLeave.fromDate.split('/').reverse().join('-'), e.target.value);
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  {dateError && <p className="text-danger">{dateError}</p>}

                  <Form.Group className="mb-3">
                    <Form.Label>Leave Reason</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={selectedLeave.reason}
                      onChange={(e) => setSelectedLeave({ ...selectedLeave, reason: e.target.value })}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Request Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={selectedLeave.requestDate.split('/').reverse().join('-')}
                      onChange={(e) => setSelectedLeave({ ...selectedLeave, requestDate: formatDate(new Date(e.target.value)) })}
                    />
                  </Form.Group>
                </Form>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={() => handleUpdateLeave(selectedLeave.leaveId, selectedLeave)} disabled={!!dateError}>Save Changes</Button>
              <Button variant="danger" onClick={() => setShowEditLeaveModal(false)}>
                Cancel
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal
            show={showDeleteConfirmationModal}
            onHide={() => setShowDeleteConfirmationModal(false)}
          >
            <Modal.Header closeButton>
              <Modal.Title>Delete Leave Request</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Are you sure you want to delete this leave request?
            </Modal.Body>
            <Modal.Footer>
              <Button variant="danger" onClick={() => handleDeleteLeave(selectedLeave.leaveId, selectedLeave.employeeId)}>Delete</Button>
              <Button variant="secondary" onClick={() => setShowDeleteConfirmationModal(false)}>
                Cancel
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal
            show={showCreateLeaveModal}
            onHide={() => setShowCreateLeaveModal(false)}
          >
            <Modal.Header closeButton>
              <Modal.Title>Create Leave Request</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={(e) => {
                e.preventDefault();
                const startDate = e.target.startDate.value;
                const endDate = e.target.endDate.value;
                if (validateDates(startDate, endDate)) {
                  handleCreateLeave({
                    employeeId: e.target.employee.value,
                    leaveType: e.target.leaveType.value,
                    fromDate: formatDate(new Date(startDate)),
                    toDate: formatDate(new Date(endDate)),
                    reason: e.target.leaveReason.value,
                  });
                }
              }}>
                <Form.Group className="mb-3">
                  <Form.Label>Employee*</Form.Label>
                  <Form.Select name="employee" required>
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>{employee.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Leave Type*</Form.Label>
                  <Form.Select name="leaveType" required>
                    <option value="">Select Leave Type</option>
                    <option value="Loss Of Pay">Loss Of Pay</option>
                    <option value="Paid Leave">Paid Leave</option>
                  </Form.Select>
                </Form.Group>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control 
                        type="date" 
                        name="startDate" 
                        required 
                        onChange={(e) => validateDates(e.target.value, document.getElementsByName('endDate')[0].value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>End Date</Form.Label>
                      <Form.Control 
                        type="date" 
                        name="endDate" 
                        required 
                        onChange={(e) => validateDates(document.getElementsByName('startDate')[0].value, e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                {dateError && <p className="text-danger">{dateError}</p>}

                <Form.Group className="mb-3">
                  <Form.Label>Leave Reason*</Form.Label>
                  <Form.Control as="textarea" rows={2} name="leaveReason" required />
                </Form.Group>

                <Button variant="primary" type="submit" disabled={!!dateError}>Submit Leave Request</Button>
              </Form>
            </Modal.Body>
          </Modal>

        </div>
      </Container>
      <div className="mt-auto">
        <div className="small text-muted text-center py-2">
          © 2024 HRIFY. Powered by JK Global IT Solutions.
        </div>
      </div>
    </div>
  );
};

export default Leave;