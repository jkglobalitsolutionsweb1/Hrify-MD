import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Modal, Breadcrumb } from 'react-bootstrap';
const Department = () => {
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [departmentName, setDepartmentName] = useState('');

  const handleSave = () => {
    // Handle the save logic here
    console.log("Department Name:", departmentName);
    setShowAddDepartmentModal(false);
    setDepartmentName(''); // Reset the input field after saving
  };

  return (
    <div className="container my-3 d-flex flex-column min-vh-100">
      <div className="rounded-3">
        <div className="d-flex justify-content-between px-3 align-items-end">
          <div className="head-content">
            <h3>Department</h3>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item active text-danger" aria-current="page"><b>Home</b></li>
                <li className="breadcrumb-item active" aria-current="page">Department</li>
              </ol>
            </nav>
          </div>

          <div className="button text-end m-2 mx-1">
            <Button 
              className="align-items-center text-end custom-danger text-light fw-bold p-1 px-2 rounded"
              onClick={() => setShowAddDepartmentModal(true)}
              title="CREATE"
            >
              <b><i className="fa-solid fa-plus"></i></b>
            </Button>
          </div>
        </div>

        {/* Add Department Modal */}
        <Modal
          show={showAddDepartmentModal}
          onHide={() => setShowAddDepartmentModal(false)}
        >
          <Modal.Header className="custom-danger text-light" closeButton>
            <Modal.Title>New Department</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form>
              <div className="mb-3">
                <label htmlFor="departmentName" className="form-label">Department Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="departmentName" 
                  placeholder="Enter department name"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                />
              </div>
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddDepartmentModal(false)}>Close</Button>
            <Button variant="danger" onClick={handleSave}>Save</Button>
          </Modal.Footer>
        </Modal>

        <div className="container my-2">
          <Row className="g-3">
            <Col md={4}>
              <Card className="py-5 text-center">
                <Card.Title className="fw-bold">Web Development</Card.Title>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="py-5 text-center">
                <Card.Title className="fw-bold">App Development</Card.Title>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="py-5 text-center">
                <Card.Title className="fw-bold">UI UX Designing</Card.Title>
              </Card>
            </Col>
          </Row>
        </div>

        <style>
          {`
            .card {
              border: 1px solid #ddd;
              border-radius: 10px;
            }
            .card-title {
              color: #ff0000;
            }
          `}
        </style>
      </div>
      <div className="mt-auto">
        <div className="small text-muted text-center py-2">
          © 2024 HRIFY. Powered by JK Global IT Solutions.
        </div>
      </div>
    </div>
  );
};

export default Department;
