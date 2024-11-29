import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form, Card, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../../auth/AuthContext';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase';

const EmployeeDesignation = () => {
  const { user } = useAuth(); 
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [designationData, setDesignationData] = useState({
    branchId: '',
    branchName: '',
    departmentId: '',
    departmentName: '',
    designationName: ''
  });
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [editingDesignationId, setEditingDesignationId] = useState('');
  const [updatedFields, setUpdatedFields] = useState({}); // For tracking updated fields

  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch branches
  const fetchBranches = async () => {
    const branchesCollection = collection(firestore, `companies/${user.uid}/branches`);
    const branchSnapshot = await getDocs(branchesCollection);
    const branchList = branchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBranches(branchList);
    // Fetch designations after fetching branches
    if (branchList.length > 0) {
      fetchDesignations(branchList);
    }
  };

  // Fetch departments based on selected branch
  const fetchDepartments = async (branchId) => {
    const departmentsCollection = collection(firestore, `companies/${user.uid}/branches/${branchId}/departments`);
    const departmentSnapshot = await getDocs(departmentsCollection);
    const departmentList = departmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setDepartments(departmentList);
  };

  // Fetch designations based on branches and their departments
  const fetchDesignations = async (branchList) => {
    let allDesignations = [];
    for (const branch of branchList) {
      const departmentsCollection = collection(firestore, `companies/${user.uid}/branches/${branch.id}/departments`);
      const departmentSnapshot = await getDocs(departmentsCollection);
      const departmentList = departmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      for (const department of departmentList) {
        const designationsCollection = collection(
          firestore,
          `companies/${user.uid}/branches/${branch.id}/departments/${department.id}/designations`
        );
        const designationSnapshot = await getDocs(designationsCollection);
        const designationList = designationSnapshot.docs.map(doc => ({
          id: doc.id,
          branchId: branch.id,
          branchName: branch.branchName,
          departmentId: department.id,
          departmentName: department.departmentName,
          ...doc.data()
        }));
        allDesignations = [...allDesignations, ...designationList];
      }
    }
    setDesignations(allDesignations);
  };

  // Handle changes in form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDesignationData({ ...designationData, [name]: value });
  };

  // Handle submission of the new designation
  const handleSubmit = async () => {
    const designationsCollection = collection(
      firestore,
      `companies/${user.uid}/branches/${designationData.branchId}/departments/${designationData.departmentId}/designations`
    );
    await addDoc(designationsCollection, {
      branchName: designationData.branchName,
      departmentName: designationData.departmentName,
      designationName: designationData.designationName,
      branchId: designationData.branchId,
      departmentId: designationData.departmentId,
      createdAt: serverTimestamp(),
    });
    fetchDesignations(branches); // Fetch updated designations
    setShowModal(false);
    setDesignationData({ branchId: '', branchName: '', departmentId: '', departmentName: '', designationName: '' });
  };

  // Handle submission of the edit designation
  const handleEditSubmit = async () => {
    const designationDoc = doc(
      firestore,
      `companies/${user.uid}/branches/${designationData.branchId}/departments/${designationData.departmentId}/designations`,
      editingDesignationId
    );
    const oldDesignation = designations.find(des => des.id === editingDesignationId); // Find the old data

    // Check for updates and track changes
    const updatedFields = {};
    if (oldDesignation.branchName !== designationData.branchName) updatedFields.branchName = true;
    if (oldDesignation.departmentName !== designationData.departmentName) updatedFields.departmentName = true;
    if (oldDesignation.designationName !== designationData.designationName) updatedFields.designationName = true;

    setUpdatedFields(updatedFields); // Track changes for UI

    await updateDoc(designationDoc, {
      branchName: designationData.branchName,
      departmentName: designationData.departmentName,
      designationName: designationData.designationName,
      branchId: designationData.branchId,
      departmentId: designationData.departmentId,
      updatedAt: serverTimestamp(),
    });
    fetchDesignations(branches); // Fetch updated designations
    setShowEditModal(false);
    setDesignationData({ branchId: '', branchName: '', departmentId: '', departmentName: '', designationName: '' });
  };

  // Handle deletion of a designation
  const handleDelete = async (designationId, branchId, departmentId) => {
    const designationDoc = doc(
      firestore,
      `companies/${user.uid}/branches/${branchId}/departments/${departmentId}/designations`,
      designationId
    );
    await deleteDoc(designationDoc);
    fetchDesignations(branches); // Fetch updated designations
  };

  // Handle branch selection change
  const handleBranchChange = (e) => {
    const selectedBranchId = e.target.value;
    const selectedBranch = branches.find(branch => branch.id === selectedBranchId);
    setDesignationData({ ...designationData, branchId: selectedBranchId, branchName: selectedBranch.branchName });
    fetchDepartments(selectedBranchId); 
  };

  // Handle department selection change
  const handleDepartmentChange = (e) => {
    const selectedDepartmentId = e.target.value;
    const selectedDepartment = departments.find(department => department.id === selectedDepartmentId);
    setDesignationData({ ...designationData, departmentId: selectedDepartmentId, departmentName: selectedDepartment.departmentName });
  };

  return (
    <div className="container my-3 d-flex flex-column min-vh-100">
      <div className="rounded-3">
        <div className="d-flex justify-content-between px-3 align-items-end">
          <div className="head-content">
            <h3>Employee Designation</h3>
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
                  Employee Designation
                </li>
              </ol>
            </nav>
          </div>
          <div className="button text-end m-2 mx-1">
            <Button
              className="align-items-center text-end custom-danger text-light fw-bold p-1 px-2 rounded"
              style={{ border: 'none' }}
              onClick={() => setShowModal(true)}
            >
              <b>
                <i className="fa-solid fa-plus"></i> 
              </b>
            </Button>
          </div>
        </div>
      </div>

      {/* Modal for adding a designation */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Designation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Branch</Form.Label>
              <Form.Control
                as="select"
                name="branchId"
                value={designationData.branchId}
                onChange={handleBranchChange}
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Select Department</Form.Label>
              <Form.Control
                as="select"
                name="departmentId"
                value={designationData.departmentId}
                onChange={handleDepartmentChange}
              >
                <option value="">Select Department</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.departmentName}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Designation Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Designation Name"
                name="designationName"
                value={designationData.designationName}
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
            Add Designation
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for editing a designation */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Designation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Branch</Form.Label>
              <Form.Control
                as="select"
                name="branchId"
                value={designationData.branchId}
                onChange={handleBranchChange}
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Select Department</Form.Label>
              <Form.Control
                as="select"
                name="departmentId"
                value={designationData.departmentId}
                onChange={handleDepartmentChange}
              >
                <option value="">Select Department</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.departmentName}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Designation Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Designation Name"
                name="designationName"
                value={designationData.designationName}
                onChange={handleChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" style={{ backgroundColor: '#ff0000', border: 'none' }} onClick={handleEditSubmit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Display designations in a card grid */}
      <Row>
        {designations.map((designation, idx) => (
          <Col key={idx} md={6} className="mb-3">
            <Card className="shadow-sm border-0" style={{ backgroundColor: '#fff' }}>
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-bold">{designation.designationName}</h5>
                  <p className="mb-0 text-muted">
                    {designation.branchName} / {designation.departmentName}
                  </p>
                </div>
                <div>
                  <Button
                    variant="light"
                    className="me-2"
                    onClick={() => {
                      setDesignationData({
                        branchId: designation.branchId,
                        branchName: designation.branchName,
                        departmentId: designation.departmentId,
                        departmentName: designation.departmentName,
                        designationName: designation.designationName
                      });
                      setEditingDesignationId(designation.id);
                      setShowEditModal(true); // Open edit modal
                    }}
                  >
                    <i className="fa-solid fa-pen" style={{ color: '#000' }}></i>
                  </Button>
                  <Button variant="light" onClick={() => handleDelete(designation.id, designation.branchId, designation.departmentId)}>
                    <i className="fa-solid fa-trash" style={{ color: '#ff0000' }}></i>
                  </Button>
                </div>
              </Card.Body>
              {/* Show updated fields */}
              {Object.keys(updatedFields).length > 0 && (
                <div className="mt-2 text-center">
                  {updatedFields.branchName && <span className="badge bg-success">Branch Updated</span>}
                  {updatedFields.departmentName && <span className="badge bg-success ms-2">Department Updated</span>}
                  {updatedFields.designationName && <span className="badge bg-success ms-2">Designation Updated</span>}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
      <div className="mt-auto">
        <div className="small text-muted text-center py-2">
          © 2024 HRIFY. Powered by JK Global IT Solutions.
        </div>
      </div>
    </div>
  );
};

export default EmployeeDesignation;
