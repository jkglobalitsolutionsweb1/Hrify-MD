import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form, Card, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../../auth/AuthContext'; // Import the AuthContext
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase'; // Import Firestore

const Branches = () => {
  const { user } = useAuth(); // Get the logged-in user
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchData, setBranchData] = useState({ name: '', location: '', contact: '' });
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetchBranches(); // Fetch branches on component mount
  }, []);

  // Fetch branches from Firestore
  const fetchBranches = async () => {
    const branchesCollection = collection(firestore, `companies/${user.uid}/branches`);
    const branchSnapshot = await getDocs(branchesCollection);
    const branchList = branchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBranches(branchList);
  };

  // Handle modal for adding/editing branches
  const handleModal = (branch = null) => {
    if (branch) {
      setBranchData({
        name: branch.branchName,
        location: branch.location,
        contact: branch.contact,
      });
      setSelectedBranch(branch); // Set the selected branch for editing
      setEditMode(true);
    } else {
      setBranchData({ name: '', location: '', contact: '' });
      setEditMode(false);
    }
    setShowModal(true);
  };

  // Handle delete modal
  const handleDeleteModal = (branch) => {
    setSelectedBranch(branch);
    setDeleteModal(true);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBranchData({ ...branchData, [name]: value });
  };

  // Handle form submission for add/edit
  const handleSubmit = async () => {
    const branchesCollection = collection(firestore, `companies/${user.uid}/branches`);
    
    if (editMode) {
      // Update the existing branch
      const branchRef = doc(firestore, `companies/${user.uid}/branches`, selectedBranch.id);
      await updateDoc(branchRef, {
        branchName: branchData.name,
        location: branchData.location,
        contact: branchData.contact,
      });
    } else {
      // Add a new branch
      await addDoc(branchesCollection, {
        branchName: branchData.name,
        location: branchData.location,
        contact: branchData.contact,
        createdAt: serverTimestamp(),
      });
    }
    fetchBranches(); // Refresh branches after submission
    setShowModal(false);
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    const branchRef = doc(firestore, `companies/${user.uid}/branches`, selectedBranch.id);
    await deleteDoc(branchRef);
    fetchBranches(); // Refresh branches after deletion
    setDeleteModal(false);
  };

  return (
    <div className="container my-3 d-flex flex-column min-vh-100">
      <div className="rounded-3">
        <div className="d-flex justify-content-between px-3 align-items-end">
          <div className="head-content">
            <h3>Branches Settings</h3>
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
                  Branches Settings
                </li>
              </ol>
            </nav>
          </div>
          <div className="button text-end m-2 mx-1">
            <Button
              className="align-items-center text-end custom-danger text-light fw-bold p-1 px-2 rounded"
              style={{ border: 'none' }}
              onClick={() => handleModal()} // Open modal for adding a new branch
            >
              <b>
                <i className="fa-solid fa-plus"></i>
              </b>
            </Button>
          </div>
        </div>
      </div>

      {/* Modal for adding/editing a branch */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Edit Branch' : 'Add New Branch'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Branch Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Branch Name"
                name="name"
                value={branchData.name}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Branch Location</Form.Label>
              <Form.Control
                type="text"
                placeholder="Branch Location"
                name="location"
                value={branchData.location}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Branch Contact</Form.Label>
              <Form.Control
                type="text"
                placeholder="Branch Contact"
                name="contact"
                value={branchData.contact}
                onChange={handleChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" style={{ backgroundColor: '#ff0000', border: 'none' }} onClick={handleSubmit}>
            {editMode ? 'Update' : 'Add'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal show={deleteModal} onHide={() => setDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Branch</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this branch?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" style={{ backgroundColor: '#ff0000', border: 'none' }} onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Display branches in card format */}
      <div className="mt-4">
        <Row>
          {branches.map((branch) => (
            <Col key={branch.id} md={6} className="mb-3">
              <Card className="shadow-sm border-0" style={{ backgroundColor: '#fff' }}>
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="fw-bold">{branch.branchName}</h5>
                    <p className="mb-0">Branch Location: {branch.location}</p>
                    <p className="mb-0">Contact: {branch.contact}</p>
                  </div>
                  <div>
                    <Button variant="light" className="me-2" onClick={() => handleModal(branch)}>
                      <i className="fa-solid fa-pen" style={{ color: '#000' }}></i>
                    </Button>
                    <Button variant="light" onClick={() => handleDeleteModal(branch)}>
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

export default Branches;
