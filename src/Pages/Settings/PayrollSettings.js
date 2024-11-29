import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Modal, Breadcrumb } from 'react-bootstrap';
const PayrollSettings = () => {
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
            <h3>Payroll Settings</h3>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
              <li className="breadcrumb-item">
                  <Link to="/Settings" className="text-danger" style={{ textDecoration: 'none' }}>
                    <b>Settings</b>
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Payroll Settings</li>
              </ol>
            </nav>
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