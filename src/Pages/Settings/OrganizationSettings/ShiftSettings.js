import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form, Card, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../../auth/AuthContext'; // Import the AuthContext
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase'; // Import Firestore

const ShiftSettings = () => {
  const { user } = useAuth(); // Get the logged-in user
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [showEditShiftModal, setShowEditShiftModal] = useState(false);
  const [shiftData, setShiftData] = useState({
    shiftName: '',
    shiftStartTime: '',
    shiftEndTime: '',
    firstHalfEndTime: '',
    secondHalfStartTime: '',
    branchId: '' // Include branchId here
  });
  const [branches, setBranches] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [editingShiftId, setEditingShiftId] = useState('');

  useEffect(() => {
    fetchBranchesAndShifts(); // Fetch branches and shifts on component mount
  }, []);

  // Fetch all branches and shifts from Firestore
  const fetchBranchesAndShifts = async () => {
    const branchesCollection = collection(firestore, `companies/${user.uid}/branches`);
    const branchSnapshot = await getDocs(branchesCollection);
    const branchList = branchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBranches(branchList);

    let allShifts = [];
    for (const branch of branchList) {
      const shiftsCollection = collection(firestore, `companies/${user.uid}/branches/${branch.id}/shifts`);
      const shiftSnapshot = await getDocs(shiftsCollection);
      const shiftList = shiftSnapshot.docs.map(doc => ({ id: doc.id, branchId: branch.id, ...doc.data() }));
      allShifts = [...allShifts, ...shiftList];
    }
    setShifts(allShifts);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setShiftData({ ...shiftData, [name]: value });
  };

  // Handle form submission for adding a shift
  const handleAddShiftSubmit = async (branchId) => {
    const shiftsCollection = collection(firestore, `companies/${user.uid}/branches/${branchId}/shifts`);
    await addDoc(shiftsCollection, {
      shiftName: shiftData.shiftName,
      shiftStartTime: shiftData.shiftStartTime,
      shiftEndTime: shiftData.shiftEndTime,
      firstHalfEndTime: shiftData.firstHalfEndTime,
      secondHalfStartTime: shiftData.secondHalfStartTime,
      branchId: branchId // Include branchId here
    });
    fetchBranchesAndShifts(); // Refresh after adding
    setShowAddShiftModal(false);
    setShiftData({
      shiftName: '',
      shiftStartTime: '',
      shiftEndTime: '',
      firstHalfEndTime: '',
      secondHalfStartTime: '',
      branchId: ''
    });
  };

  // Handle form submission for editing a shift
  const handleEditShiftSubmit = async () => {
    const shiftDoc = doc(firestore, `companies/${user.uid}/branches/${shiftData.branchId}/shifts`, editingShiftId);
    await updateDoc(shiftDoc, {
      shiftName: shiftData.shiftName,
      shiftStartTime: shiftData.shiftStartTime,
      shiftEndTime: shiftData.shiftEndTime,
      firstHalfEndTime: shiftData.firstHalfEndTime,
      secondHalfStartTime: shiftData.secondHalfStartTime,
      branchId: shiftData.branchId // Include branchId here
    });
    fetchBranchesAndShifts(); // Refresh after editing
    setShowEditShiftModal(false);
    setShiftData({
      shiftName: '',
      shiftStartTime: '',
      shiftEndTime: '',
      firstHalfEndTime: '',
      secondHalfStartTime: '',
      branchId: ''
    });
  };

  // Handle delete shift
  const handleDeleteShift = async (shiftId, branchId) => {
    const shiftDoc = doc(firestore, `companies/${user.uid}/branches/${branchId}/shifts`, shiftId);
    await deleteDoc(shiftDoc);
    fetchBranchesAndShifts(); // Refresh after deletion
  };

  return (
    <div className="container my-3 d-flex flex-column min-vh-100">
      <div className="rounded-3">
        <div className="d-flex justify-content-between px-3 align-items-end">
          <div className="head-content">
            <h3>Shift Settings</h3>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/dashboard" className="text-danger" style={{ textDecoration: 'none' }}>
                    <b>Home</b>
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/Settings" className="text-dark" style={{ textDecoration: 'none' }}>
                    <b>Settings</b>
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/organization-settings" className="text-dark" style={{ textDecoration: 'none' }}>
                    Organization Settings
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Shift Settings
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      {/* Display all branches with their respective shifts */}
      <div className="mt-4">
        <Row>
          {branches.map(branch => (
            <Col md={6} key={branch.id} className="mb-3">
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#fff' }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold">{branch.branchName}</h5>
                    <Button
                      variant="light"
                      onClick={() => {
                        setShiftData({ ...shiftData, branchId: branch.id });
                        setShowAddShiftModal(true);
                      }}
                    >
                      <i className="fa-solid fa-plus" style={{ color: '#007bff' }}></i> Add Shift
                    </Button>
                  </div>
                  <div className="mt-3">
                    {shifts.filter(shift => shift.branchId === branch.id).map(shift => (
                      <Card key={shift.id} className="mb-2 shadow-sm border-0" style={{ backgroundColor: '#f9f9f9' }}>
                        <Card.Body>
                          <h6 className="fw-bold">{shift.shiftName}</h6>
                          <Card.Text className="text-muted">
                            Start: {shift.shiftStartTime} <br />
                            End: {shift.shiftEndTime} <br />
                            First Half End: {shift.firstHalfEndTime} <br />
                            Second Half Start: {shift.secondHalfStartTime}
                          </Card.Text>
                          <div className="d-flex justify-content-end">
                            <Button variant="light" className="me-2" onClick={() => {
                              setShiftData(shift);
                              setEditingShiftId(shift.id);
                              setShowEditShiftModal(true);
                            }}>
                              <i className="fa-solid fa-pen" style={{ color: '#000' }}></i>
                            </Button>
                            <Button variant="light" onClick={() => handleDeleteShift(shift.id, branch.id)}>
                              <i className="fa-solid fa-trash" style={{ color: '#ff0000' }}></i>
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>


      {/* Modal for adding a shift */}
      <Modal show={showAddShiftModal} onHide={() => setShowAddShiftModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Shift</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Shift Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Shift Name"
                name="shiftName"
                value={shiftData.shiftName}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="time"
                name="shiftStartTime"
                value={shiftData.shiftStartTime}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>End Time</Form.Label>
              <Form.Control
                type="time"
                name="shiftEndTime"
                value={shiftData.shiftEndTime}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>First Half End Time</Form.Label>
              <Form.Control
                type="time"
                name="firstHalfEndTime"
                value={shiftData.firstHalfEndTime}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Second Half Start Time</Form.Label>
              <Form.Control
                type="time"
                name="secondHalfStartTime"
                value={shiftData.secondHalfStartTime}
                onChange={handleChange}
              />
            </Form.Group>
            <Button
              variant="primary"
              onClick={() => handleAddShiftSubmit(shiftData.branchId)}
            >
              Add Shift
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal for editing a shift */}
      <Modal show={showEditShiftModal} onHide={() => setShowEditShiftModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Shift</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Shift Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Shift Name"
                name="shiftName"
                value={shiftData.shiftName}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="time"
                name="shiftStartTime"
                value={shiftData.shiftStartTime}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>End Time</Form.Label>
              <Form.Control
                type="time"
                name="shiftEndTime"
                value={shiftData.shiftEndTime}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>First Half End Time</Form.Label>
              <Form.Control
                type="time"
                name="firstHalfEndTime"
                value={shiftData.firstHalfEndTime}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Second Half Start Time</Form.Label>
              <Form.Control
                type="time"
                name="secondHalfStartTime"
                value={shiftData.secondHalfStartTime}
                onChange={handleChange}
              />
            </Form.Group>
            <Button variant="success" onClick={handleEditShiftSubmit}>
              Update Shift
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
      <div className="mt-auto">
        <div className="small text-muted text-center py-2">
          © 2024 HRIFY. Powered by JK Global IT Solutions.
        </div>
      </div>
    </div>
  );
};

export default ShiftSettings;
