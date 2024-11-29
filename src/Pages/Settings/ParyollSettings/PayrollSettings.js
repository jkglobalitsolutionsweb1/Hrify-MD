import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, setDoc, collection, Timestamp } from "firebase/firestore";
import { firestore } from "../../../firebase/firebase";
import { Row, Col, Container, Form, Button, Alert, Spinner, Modal } from "react-bootstrap";
import { Link } from 'react-router-dom';

function PayrollSettings() {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [salaryDetails, setSalaryDetails] = useState({
    earnings: {
      basicSalary: {
        type: "amount",
        value: 0,
      },
    },
    deductions: {},
    attendanceDeductions: {
      halfDay: {
        type: "amount",
        value: 0,
      },
      lossOfPay: {
        type: "amount",
        value: 0,
      },
    },
    advance_payments: {
      type: "amount",
      value: 0,
      deductedMonth: "",
      date: null,
    },
  });
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [showEditFieldModal, setShowEditFieldModal] = useState(false);
  const [newField, setNewField] = useState({
    name: "",
    type: "Fixed Amount",
    value: "",
    category: "Earnings",
  });
  const [editingField, setEditingField] = useState(null);

  const fetchEmployeeData = async () => {
    try {
      const employeeRef = doc(firestore, "employees", employeeId);
      const employeeSnap = await getDoc(employeeRef);

      if (employeeSnap.exists()) {
        const employeeData = employeeSnap.data();
        setEmployee({ id: employeeSnap.id, ...employeeData });

        const basicSalary = employeeData.earnings?.basicSalary?.value || 0;

        const salaryDetailsRef = doc(
          collection(firestore, "employees", employeeId, "salaryDetails"),
          "currentSalary"
        );
        const salaryDetailsSnap = await getDoc(salaryDetailsRef);

        if (salaryDetailsSnap.exists()) {
          const salaryDetailsData = salaryDetailsSnap.data();
          setSalaryDetails((prevState) => ({
            ...prevState,
            ...salaryDetailsData,
            earnings: {
              ...prevState.earnings,
              ...salaryDetailsData.earnings,
              basicSalary: {
                type: "amount",
                value: basicSalary,
              },
            },
            advance_payments: {
              ...prevState.advance_payments,
              ...salaryDetailsData.advance_payments,
              deductedMonth: salaryDetailsData.advance_payments?.deductedMonth || '',
              date: salaryDetailsData.advance_payments?.date ? salaryDetailsData.advance_payments.date.toDate() : null,
            },
          }));
        } else {
          setSalaryDetails((prevState) => ({
            ...prevState,
            earnings: {
              ...prevState.earnings,
              basicSalary: {
                type: "amount",
                value: basicSalary,
              },
            },
          }));
        }
      } else {
        setError("Employee not found");
      }
    } catch (err) {
      console.error("Error fetching employee data:", err);
      setError("Failed to load employee data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId]);

  const handleInputChange = (e, category) => {
    const { name, value } = e.target;
    const parsedValue = parseFloat(value) || 0;

    setSalaryDetails((prevState) => {
      if (category === "earnings" || category === "deductions") {
        return {
          ...prevState,
          [category]: {
            ...prevState[category],
            [name]: {
              ...prevState[category][name],
              value: parsedValue,
            },
          },
        };
      } else if (category === "attendanceDeductions") {
        return {
          ...prevState,
          attendanceDeductions: {
            ...prevState.attendanceDeductions,
            [name]: {
              ...prevState.attendanceDeductions[name],
              value: parsedValue,
            },
          },
        };
      } else if (category === "advance_payments") {
        return {
          ...prevState,
          advance_payments: {
            ...prevState.advance_payments,
            value: parsedValue,
            date: new Date(),
          },
        };
      }
      return prevState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formattedSalaryDetails = {
        ...salaryDetails,
        advance_payments: {
          ...salaryDetails.advance_payments,
          deductedMonth: salaryDetails.advance_payments.deductedMonth,
          date: salaryDetails.advance_payments.date ? Timestamp.fromDate(new Date(salaryDetails.advance_payments.date)) : null,
        },
      };

      const salaryDetailsRef = doc(
        collection(firestore, "employees", employeeId, "salaryDetails"),
        "currentSalary"
      );
      await setDoc(salaryDetailsRef, formattedSalaryDetails);

      const employeeRef = doc(firestore, "employees", employeeId);
      await setDoc(
        employeeRef,
        {
          earnings: {
            basicSalary: salaryDetails.earnings.basicSalary,
          },
        },
        { merge: true }
      );

      alert("Salary details updated successfully!");
      await fetchEmployeeData();
    } catch (err) {
      console.error("Error updating salary details:", err);
      setError("Failed to update salary details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewFieldChange = (e) => {
    const { name, value } = e.target;
    setNewField((prevField) => ({ ...prevField, [name]: value }));
  };

  const handleAddField = async () => {
    const category = newField.category.toLowerCase();
    const fieldName = newField.name;
    const fieldType = newField.type === "Fixed Amount" ? "amount" : "percentage";
    const fieldValue = parseFloat(newField.value) || 0;

    const updatedSalaryDetails = {
      ...salaryDetails,
      [category]: {
        ...salaryDetails[category],
        [fieldName]: {
          type: fieldType,
          value: fieldValue,
        },
      },
    };

    setSalaryDetails(updatedSalaryDetails);

    try {
      const salaryDetailsRef = doc(
        collection(firestore, "employees", employeeId, "salaryDetails"),
        "currentSalary"
      );
      await setDoc(salaryDetailsRef, updatedSalaryDetails, { merge: true });

      alert("New field added successfully!");
      setShowAddFieldModal(false);
      setNewField({
        name: "",
        type: "Fixed Amount",
        value: "",
        category: "Earnings",
      });
      await fetchEmployeeData();
    } catch (err) {
      console.error("Error adding new field:", err);
      setError("Failed to add new field. Please try again.");
    }
  };

  const handleDeleteField = async (category, fieldName) => {
    if (fieldName === "basicSalary" && category === "earnings") {
      alert("Basic Salary cannot be deleted.");
      return;
    }

    const updatedSalaryDetails = { ...salaryDetails };
    delete updatedSalaryDetails[category][fieldName];

    setSalaryDetails(updatedSalaryDetails);

    try {
      const salaryDetailsRef = doc(
        collection(firestore, "employees", employeeId, "salaryDetails"),
        "currentSalary"
      );
      await setDoc(salaryDetailsRef, updatedSalaryDetails);

      alert("Field deleted successfully!");
      await fetchEmployeeData();
    } catch (err) {
      console.error("Error deleting field:", err);
      setError("Failed to delete field. Please try again.");
    }
  };

  const handleEditField = (category, fieldName) => {
    const field = salaryDetails[category][fieldName];
    setEditingField({
      category,
      name: fieldName,
      type: field.type === "amount" ? "Fixed Amount" : "Percentage",
      value: field.value,
    });
    setShowEditFieldModal(true);
  };

  const handleEditFieldChange = (e) => {
    const { name, value } = e.target;
    setEditingField((prevField) => ({ ...prevField, [name]: value }));
  };

  const handleEditFieldSubmit = async () => {
    const { category, name, type, value } = editingField;
    const updatedSalaryDetails = {
      ...salaryDetails,
      [category]: {
        ...salaryDetails[category],
        [name]: {
          type: type === "Fixed Amount" ? "amount" : "percentage",
          value: parseFloat(value) || 0,
        },
      },
    };

    setSalaryDetails(updatedSalaryDetails);

    try {
      const salaryDetailsRef = doc(
        collection(firestore, "employees", employeeId, "salaryDetails"),
        "currentSalary"
      );
      await setDoc(salaryDetailsRef, updatedSalaryDetails, { merge: true });

      if (category === "earnings" && name === "basicSalary") {
        const employeeRef = doc(firestore, "employees", employeeId);
        await setDoc(
          employeeRef,
          {
            earnings: {
              basicSalary: updatedSalaryDetails.earnings.basicSalary,
            },
          },
          { merge: true }
        );
      }

      alert("Field updated successfully!");
      setShowEditFieldModal(false);
      setEditingField(null);
      await fetchEmployeeData();
    } catch (err) {
      console.error("Error updating field:", err);
      setError("Failed to update field. Please try again.");
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    if (name === "deductedMonth") {
      // Convert the value to "mm-yyyy" format
      const [year, month] = value.split("-");
      const formattedValue = `${month}-${year}`;
      setSalaryDetails((prevState) => ({
        ...prevState,
        advance_payments: {
          ...prevState.advance_payments,
          [name]: formattedValue,
        },
      }));
    } else {
      setSalaryDetails((prevState) => ({
        ...prevState,
        advance_payments: {
          ...prevState.advance_payments,
          [name]: value,
        },
      }));
    }
  };

  if (loading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5 container-fluid d-flex flex-column min-vh-100">
      <div className="d-flex justify-content-between px-3 align-items-end">
        <div className="head-content">
          <h3>Payroll Settings</h3>
          <nav
            style={{
              "--bs-breadcrumb-divider":
                "url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%278%27 height=%278%27%3E%3Cpath d=%27M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z%27 fill=%27currentColor%27/%3E%3C/svg%3E')",
            }}
            aria-label="breadcrumb"
          >
            <ol className="breadcrumb">
              <li
                className="breadcrumb-item active text-danger"
                aria-current="page"
              >
                <Link
                  className="text-decoration-none text-danger"
                  to="/employee"
                >
                  <b>Home</b>
                </Link>
              </li>
              <li
                className="breadcrumb-item active text-dark"
                aria-current="page"
              >
                <b>Settings</b>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Payroll Settings
              </li>
            </ol>
          </nav>
        </div>
      </div>
      <Form onSubmit={handleSubmit}>
        <div className="mb-4 p-3 bg-light rounded border border-danger text-center text-md-start">
          <h3 className="py-2">
            <b>Employee Details</b>
          </h3>
          <p>
            <strong>Employee Name:</strong> {employee?.name}
          </p>
          <p>
            <strong>Position:</strong> {employee?.designation?.name || "N/A"}
          </p>
          <p>
            <strong>Department:</strong> {employee?.department?.name || "N/A"}
          </p>
          <p>
            <strong>Joining Date:</strong> {employee?.joiningDate || "N/A"}
          </p>
        </div>

        <div className="mb-4 p-3 bg-light rounded border border-danger">
          <div className="bg-light rounded border-dark text-end p-3">
            <Button variant="danger" onClick={() => setShowAddFieldModal(true)}>
              <i className="fa-solid fa-plus mx-2"></i> Add Fields
            </Button>
          </div>
          <Row>
            <Col md={6}>
              <h2 className="h4 mb-3"><b>Earnings</b></h2>
              {Object.entries(salaryDetails.earnings).map(([key, value]) => (
                <div className="mb-3 d-flex align-items-center" key={key}>
                  <div className="flex-grow-1 me-2">
                    <p className="mb-0">{key}: {value.type === "percentage" ? `${value.value}%` : `₹${value.value}`}</p>
                  </div>
                  
                  <Button
                    onClick={() => handleEditField("earnings", key)}
                    className="btn btn-primary d-flex justify-content-center me-2"
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button
                    onClick={() => handleDeleteField("earnings", key)}
                    className="btn  btn-danger d-flex justify-content-center"
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </div>
              ))}
            </Col>

            <Col md={6}>
              <h2  className="h4 mb-3"><b>Deductions</b></h2>
              {Object.entries(salaryDetails.deductions).map(([key, value]) => (
                <div className="mb-3 d-flex align-items-center" key={key}>
                  
                  <div  className="flex-grow-1  me-2">
                    <p className="mb-0">{key}: {value.type === "percentage" ? `${value.value}%` : `₹${value.value}`}</p>
                  </div>
                  <Button
                    onClick={() => handleEditField("deductions", key)}
                    className="btn btn-primary d-flex justify-content-center me-2"
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button
                    onClick={() => handleDeleteField("deductions", key)}
                    className="btn btn-danger d-flex justify-content-center"
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </div>
              ))}
            </Col>
          </Row>
        </div>

        <div className="mb-4 p-3 bg-light rounded border border-danger">
          <Row>
            <Col md={6}>
              <h2 className="h4 mb-3">Attendance-based Deductions</h2>
              <Form.Group className="mb-3">
                <Form.Label>Loss of Pay (₹)</Form.Label>
                <Form.Control
                  type="text"
                  name="lossOfPay"
                  value={salaryDetails.attendanceDeductions.lossOfPay.value}
                  onChange={(e) => handleInputChange(e, "attendanceDeductions")}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Half Day (₹)</Form.Label>
                <Form.Control
                  type="text"
                  name="halfDay"
                  value={salaryDetails.attendanceDeductions.halfDay.value}
                  onChange={(e) => handleInputChange(e, "attendanceDeductions")}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <h2 className="h4 mb-3">Advance Payment Details</h2>
              <Form.Group className="mb-3">
                <Form.Label>Advance Payment (₹)</Form.Label>
                <Form.Control
                  type="text"
                  name="value"
                  value={salaryDetails.advance_payments.value}
                  onChange={(e) => handleInputChange(e, "advance_payments")}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Deduction Month</Form.Label>
                <Form.Control
                  type="month"
                  name="deductedMonth"
                  value={salaryDetails.advance_payments.deductedMonth.split("-").reverse().join("-")}
                  onChange={handleDateChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="text-end">
            <Button variant="danger" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </Form>

      <Modal
        show={showAddFieldModal}
        onHide={() => setShowAddFieldModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Field</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Field Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newField.name}
                onChange={handleNewFieldChange}
                placeholder="Enter field name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                name="type"
                value={newField.type}
                onChange={handleNewFieldChange}
              >
                <option>Fixed Amount</option>
                <option>Percentage</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Amount/Percentage</Form.Label>
              <Form.Control
                type="text"
                name="value"
                value={newField.value}
                onChange={handleNewFieldChange}
                placeholder="Amount/Percentage"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category"
                value={newField.category}
                onChange={handleNewFieldChange}
              >
                <option>Earnings</option>
                <option>Deductions</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowAddFieldModal(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleAddField}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showEditFieldModal}
        onHide={() => setShowEditFieldModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Field</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingField && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Field Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={editingField.name}
                  onChange={handleEditFieldChange}
                  disabled={editingField.name === "basicSalary"}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Type</Form.Label>
                <Form.Select
                  name="type"
                  value={editingField.type}
                  onChange={handleEditFieldChange}
                  disabled={editingField.name === "basicSalary"}
                >
                  <option>Fixed Amount</option>
                  <option>Percentage</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Amount/Percentage</Form.Label>
                <Form.Control
                  type="text"
                  name="value"
                  value={editingField.value}
                  onChange={handleEditFieldChange}
                  placeholder="Amount/Percentage"
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEditFieldModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditFieldSubmit}>
            Update
          </Button>
        </Modal.Footer>
      </Modal>
      <div className="mt-auto">
        <div className="small text-muted text-center py-2">
          © 2024 HRIFY. Powered by JK Global IT Solutions.
        </div>
      </div>
    </Container>
  );
}

export default PayrollSettings;