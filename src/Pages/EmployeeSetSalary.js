import React, { useState } from 'react';
import { Modal } from 'react-bootstrap'; // Make sure to install react-bootstrap if you haven't already

const EmployeeSetSalary = () => {
  const [showSetSalaryModal, setShowSetSalaryModal] = useState(false);
  const [showCreateAllowanceModal, setShowCreateAllowanceModal] = useState(false);
  const [showEditAllowanceModal, setShowEditAllowanceModal] = useState(false);
  const [showDeleteAllowanceModal, setShowDeleteAllowanceModal] = useState(false);
  const [showCreateOtherPaymentModal, setShowCreateOtherPaymentModal] = useState(false);
  const [showEditOtherPaymentModal, setShowEditOtherPaymentModal] = useState(false);
  const [showDeleteOtherPaymentModal, setShowDeleteOtherPaymentModal] = useState(false);
  const [showCreateOvertimeModal, setShowCreateOvertimeModal] = useState(false);
  const [showEditOvertimeModal, setShowEditOvertimeModal] = useState(false);
  const [showDeleteOvertimeModal, setShowDeleteOvertimeModal] = useState(false);

  return (
    <div className="container my-3 d-flex flex-column min-vh-100">
      <div className="rounded-3">
        <div className="d-flex justify-content-between px-3 align-items-end">
          <div className="head-content">
            <h3>Employee Set Salary</h3>
            <nav
              style={{
                '--bs-breadcrumb-divider': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z' fill='currentColor'/%3E%3C/svg%3E\")"
              }}
              aria-label="breadcrumb"
            >
              <ol className="breadcrumb">
                <li className="breadcrumb-item active text-danger" aria-current="page"><b>Home</b></li>
                <li className="breadcrumb-item active" aria-current="page">Employee Set Salary</li>
              </ol>
            </nav>
          </div>
          <div className="button text-end m-2 mx-1 d-none">
            <a href="Add Employee.html">
              <button
                className="align-items-center text-end bg-danger text-light fw-bold p-1 px-2 rounded"
                style={{ border: 'none' }}
                data-bs-toggle="tooltip"
                data-bs-placement="right"
                title="CREATE"
              >
                <b><i className="fa-solid fa-filter"></i></b>
              </button>
            </a>
          </div>
        </div>

        <div className="container my-2">
          <div className="row g-4">
            {/* Employee Salary Panel */}
            <div className="col-12 col-lg-6">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Employee Salary</h5>
                  <button className="btn btn-danger btn-sm" onClick={() => setShowSetSalaryModal(true)}>
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>
                <div className="card-body">
                  <p><strong>Payslip Type:</strong> Salary</p>
                  <p><strong>Monthly Payslip:</strong> ₹1000</p>
                  <p><strong>Account Type:</strong> Chisom Latifat</p>
                </div>
              </div>
            </div>

            {/* Allowance Table Panel */}
            <div className="col-12 col-lg-6">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Allowance</h5>
                  <button className="btn btn-danger btn-sm" onClick={() => setShowCreateAllowanceModal(true)}>
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm w-100">
                      <thead className="table-light">
                        <tr>
                          <th>EMPLOYEE NAME</th>
                          <th>ALLOWANCE OPTION</th>
                          <th>TITLE</th>
                          <th>TYPE</th>
                          <th>AMOUNT</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Replace this with your data */}
                        <tr>
                          <td>Elumalai</td>
                          <td>Taxable</td>
                          <td>Quis Aliqua Molesti</td>
                          <td>Fixed</td>
                          <td>₹1,482</td>
                          <td>
                            <button className="btn btn-danger btn-sm me-2" onClick={() => setShowEditAllowanceModal(true)}>
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteAllowanceModal(true)}>
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </td>
                        </tr>
                        {/* Add more rows as needed */}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Payment Table Panel */}
            <div className="col-12 col-lg-6">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Other Payment</h5>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setShowCreateOtherPaymentModal(true)}>
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm w-100">
                      <thead className="table-light">
                        <tr>
                          <th>EMPLOYEE</th>
                          <th>TITLE</th>
                          <th>TYPE</th>
                          <th>AMOUNT</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Replace this with your data */}
                        <tr>
                          <td>Elumalai</td>
                          <td>Quia Occaecat Laboru</td>
                          <td>Fixed</td>
                          <td>₹3,484</td>
                          <td>
                            <button className="btn btn-danger btn-sm me-2" onClick={() => setShowEditOtherPaymentModal(true)}>
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteOtherPaymentModal(true)}>
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </td>
                        </tr>
                        {/* Add more rows as needed */}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Overtime Table Panel */}
            <div className="col-12 col-lg-6">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Overtime</h5>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setShowCreateOvertimeModal(true)}>
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm w-100">
                      <thead className="table-light">
                        <tr>
                          <th>EMPLOYEE NAME</th>
                          <th>OVERTIME TITLE</th>
                          <th>NUMBER OF DAYS</th>
                          <th>HOURS</th>
                          <th>RATE</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Replace this with your data */}
                        <tr>
                          <td>Elumalai</td>
                          <td>test</td>
                          <td>10</td>
                          <td>10</td>
                          <td>₹846</td>
                          <td>
                            <button className="btn btn-danger btn-sm me-2" onClick={() => setShowEditOvertimeModal(true)}>
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteOvertimeModal(true)}>
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </td>
                        </tr>
                        {/* Add more rows as needed */}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <Modal show={showSetSalaryModal} onHide={() => setShowSetSalaryModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Set Salary</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Add your form for setting salary here */}
            <form>
              <div className="mb-3">
                <label htmlFor="salary" className="form-label">Salary Amount</label>
                <input type="number" className="form-control" id="salary" placeholder="Enter salary" />
              </div>
              <button type="submit" className="btn btn-primary">Save changes</button>
            </form>
          </Modal.Body>
        </Modal>

        <Modal show={showCreateAllowanceModal} onHide={() => setShowCreateAllowanceModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Create Allowance</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Add your form for creating allowance here */}
            <form>
              <div className="mb-3">
                <label htmlFor="allowanceTitle" className="form-label">Allowance Title</label>
                <input type="text" className="form-control" id="allowanceTitle" placeholder="Enter allowance title" />
              </div>
              <button type="submit" className="btn btn-primary">Save changes</button>
            </form>
          </Modal.Body>
        </Modal>

        {/* Add similar modals for editing and deleting allowances, other payments, and overtime */}
        
        {/* Example for Edit Allowance Modal */}
        <Modal show={showEditAllowanceModal} onHide={() => setShowEditAllowanceModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Allowance</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Add your form for editing allowance here */}
            <form>
              <div className="mb-3">
                <label htmlFor="editAllowanceTitle" className="form-label">Edit Allowance Title</label>
                <input type="text" className="form-control" id="editAllowanceTitle" placeholder="Edit allowance title" />
              </div>
              <button type="submit" className="btn btn-primary">Save changes</button>
            </form>
          </Modal.Body>
        </Modal>

        {/* Repeat for other modals */}
      </div>
      <div className="mt-auto">
        <div className="small text-muted text-center py-2">
          © 2024 HRIFY. Powered by JK Global IT Solutions.
        </div>
      </div>
    </div>
  );
};

export default EmployeeSetSalary;
