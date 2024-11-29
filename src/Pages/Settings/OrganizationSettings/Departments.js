import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form, Card, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../../auth/AuthContext'; // Import the AuthContext
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase'; // Import Firestore

const Departments = () => {
  const { user } = useAuth(); // Get the logged-in user
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [departmentData, setDepartmentData] = useState({ departmentName: '', branchId: '' });
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editingDepartmentId, setEditingDepartmentId] = useState('');

  useEffect(() => {
    fetchBranchesAndDepartments(); // Fetch branches and departments on component mount
  }, []);

  // Fetch all branches and departments from Firestore
  const fetchBranchesAndDepartments = async () => {
    const branchesCollection = collection(firestore, `companies/${user.uid}/branches`);
    const branchSnapshot = await getDocs(branchesCollection);
    const branchList = branchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBranches(branchList);

    let allDepartments = [];
    for (const branch of branchList) {
      const departmentsCollection = collection(firestore, `companies/${user.uid}/branches/${branch.id}/departments`);
      const departmentSnapshot = await getDocs(departmentsCollection);
      const departmentList = departmentSnapshot.docs.map(doc => ({ id: doc.id, branchId: branch.id, ...doc.data() }));
      allDepartments = [...allDepartments, ...departmentList];
    }
    setDepartments(allDepartments);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDepartmentData({ ...departmentData, [name]: value });
  };

  // Handle form submission for adding a department
  const handleSubmit = async () => {
    const departmentsCollection = collection(firestore, `companies/${user.uid}/branches/${departmentData.branchId}/departments`);
    await addDoc(departmentsCollection, {
      departmentName: departmentData.departmentName,
      branchId: departmentData.branchId,
      createdAt: serverTimestamp(),
    });
    fetchBranchesAndDepartments(); // Refresh after adding
    setShowModal(false);
    setDepartmentData({ departmentName: '', branchId: '' });
  };

  // Handle form submission for editing a department
  const handleEditSubmit = async () => {
    const departmentDoc = doc(firestore, `companies/${user.uid}/branches/${departmentData.branchId}/departments`, editingDepartmentId);
    await updateDoc(departmentDoc, {
      departmentName: departmentData.departmentName,
      branchId: departmentData.branchId,
      updatedAt: serverTimestamp(),
    });
    fetchBranchesAndDepartments(); // Refresh after editing
    setShowEditModal(false);
    setDepartmentData({ departmentName: '', branchId: '' });
  };

  // Handle delete department
  const handleDelete = async (departmentId, branchId) => {
    const departmentDoc = doc(firestore, `companies/${user.uid}/branches/${branchId}/departments`, departmentId);
    await deleteDoc(departmentDoc);
    fetchBranchesAndDepartments(); // Refresh after deletion
  };

  // Get the branch name by matching the branchId
  const getBranchName = (branchId) => {
    const branch = branches.find(branch => branch.id === branchId);
    return branch ? branch.branchName : 'Unknown Branch';
  };

  return (
    <div className="container my-3 d-flex flex-column min-vh-100">
      <div className="rounded-3">
        <div className="d-flex justify-content-between px-3 align-items-end">
          <div className="head-content">
            <h3>Departments Settings</h3>
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
                  Departments Settings
                </li>
              </ol>
            </nav>
          </div>
          <div className="button text-end m-2 mx-1">
            <Button
              className="align-items-center text-end custom-danger text-light fw-bold p-1 px-2 rounded"
              style={{ border: 'none' }}
              onClick={() => setShowModal(true)} // Open modal for adding a new department
            >
              <b>
                <i className="fa-solid fa-plus"></i> 
              </b>
            </Button>
          </div>
        </div>
      </div>

      {/* Modal for adding a department */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Department</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Department Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Department Name"
                name="departmentName"
                value={departmentData.departmentName}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Select Branch</Form.Label>
              <Form.Control
                as="select"
                name="branchId"
                value={departmentData.branchId}
                onChange={handleChange}
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" style={{ backgroundColor: '#ff0000', border: 'none' }} onClick={handleSubmit}>
            Add Department
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for editing a department */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Department</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Department Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Department Name"
                name="departmentName"
                value={departmentData.departmentName}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Select Branch</Form.Label>
              <Form.Control
                as="select"
                name="branchId"
                value={departmentData.branchId}
                onChange={handleChange}
              >
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" style={{ backgroundColor: '#ff0000', border: 'none' }} onClick={handleEditSubmit}>
            Update Department
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Display all departments in card format */}
      <div className="mt-4">
        <Row>
          {departments.map(department => (
            <Col md={6} key={department.id} className="mb-3">
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#fff' }}>
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="fw-bold">{department.departmentName}</h5>
                    <p className="mb-0">Branch Name: {getBranchName(department.branchId)}</p>
                  </div>
                  <div>
                    <Button variant="light" className="me-2" onClick={() => {
                      setDepartmentData(department);
                      setEditingDepartmentId(department.id);
                      setShowEditModal(true);
                    }}>
                      <i className="fa-solid fa-pen" style={{ color: '#000' }}></i>
                    </Button>
                    <Button variant="light" onClick={() => handleDelete(department.id, department.branchId)}>
                      <i className="fa-solid fa-trash" style={{ color: '#ff0000' }}></i>
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
      <div className="mt-auto">
        <div className="small text-muted text-center py-2">
          © 2024 HRIFY. Powered by JK Global IT Solutions.
        </div>
      </div>
    </div>
  );
};

export default Departments;
