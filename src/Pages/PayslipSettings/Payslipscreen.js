import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";
import { Container, Row, Col, Card, Table, Button, Alert, Spinner, Image } from "react-bootstrap";
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';

function PayslipScreen() {
  const { employeeId, month } = useParams();
  const navigate = useNavigate();
  const [payslipData, setPayslipData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayslipData = async () => {
      try {
        const payslipRef = doc(firestore, 'employees', employeeId, 'payslips', month);
        const payslipDoc = await getDoc(payslipRef);
        if (payslipDoc.exists()) {
          setPayslipData({ id: payslipDoc.id, ...payslipDoc.data() });
        } else {
          setError("Payslip not found");
        }
      } catch (err) {
        setError("Error fetching payslip data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslipData();
  }, [employeeId, month]);

  const formatCurrency = (amount) => {
    // Modified to remove superscript by using minimumFractionDigits and maximumFractionDigits
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatMonth = (monthYear) => {
    const [month, year] = monthYear.split('-');
    return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const handleDeletePayslip = async () => {
    if (window.confirm("Are you sure you want to delete this payslip?")) {
      try {
        await deleteDoc(doc(firestore, 'employees', employeeId, 'payslips', month));
        navigate('/PayslipReports');
      } catch (err) {
        setError("Error deleting payslip");
        console.error(err);
      }
    }
  };

  const generatePDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;

    // Helper function to add a line
    const addLine = (y) => pdf.line(10, y, pageWidth - 10, y);

    // Helper function to add centered text
    const addCenteredText = (text, y, size = 12) => {
      pdf.setFontSize(size);
      pdf.text(text, pageWidth / 2, y, { align: 'center' });
    };

    // Helper function to add left-aligned text
    const addLeftText = (text, x, y, size = 10) => {
      pdf.setFontSize(size);
      // Convert numbers to fixed decimal format to prevent superscript
      if (typeof text === 'number') {
        text = text.toFixed(2);
      }
      pdf.text(text.toString(), x, y);
    };

    // Modified helper function to format currency without superscript
    const formatPDFCurrency = (amount) => {
      return `₹${Number(amount).toFixed(2)}`;
    };

    // Add company logo
    const logoImg = document.querySelector('img[alt="Company Logo"]');
    if (logoImg) {
      pdf.addImage(logoImg.src, 'PNG', 10, 10, 30, 15);
    }

    // Add company name and payslip month
    pdf.setFont(undefined, 'bold');
    addCenteredText(payslipData.companyName, 20, 16);
    pdf.setFont(undefined, 'normal');
    addCenteredText(`Payslip for ${formatMonth(payslipData.month)}`, 27);
    addLine(30);

    // Employee details
    addLeftText(`Employee Name: ${payslipData.employeeName}`, 10, 40);
    addLeftText(`Department: ${payslipData.department}`, 10, 47);
    addLeftText(`Designation: ${payslipData.designation}`, 10, 54);
    addLeftText(`Date of Joining: ${payslipData.joiningDate}`, 10, 61);
    addLeftText(`Pay Month: ${formatMonth(payslipData.month)}`, 10, 68);
    addLine(70);

    // Earnings
    pdf.setFont(undefined, 'bold');
    addCenteredText('Earnings', 80);
    pdf.setFont(undefined, 'normal');
    addLeftText('Description', 10, 90);
    addLeftText('Amount', pageWidth - 50, 90);
    let yPos = 100;
    Object.entries(payslipData.earnings).forEach(([key, value]) => {
      addLeftText(key, 10, yPos);
      addLeftText(value.type === 'percentage' ? `${value.value}%` : formatPDFCurrency(value.value), pageWidth - 50, yPos);
      yPos += 7;
    });
    pdf.setFont(undefined, 'bold');
    addLeftText('Total Earnings', 10, yPos + 7);
    addLeftText(formatPDFCurrency(payslipData.totalEarnings), pageWidth - 50, yPos + 7);
    pdf.setFont(undefined, 'normal');
    addLine(yPos + 10);

    // Deductions
    yPos += 20;
    pdf.setFont(undefined, 'bold');
    addCenteredText('Deductions', yPos);
    pdf.setFont(undefined, 'normal');
    addLeftText('Description', 10, yPos + 10);
    addLeftText('Amount', pageWidth - 50, yPos + 10);
    yPos += 20;
    Object.entries(payslipData.deductions).forEach(([key, value]) => {
      addLeftText(key, 10, yPos);
      addLeftText(value.type === 'percentage' ? `${value.value}%` : formatPDFCurrency(value.value), pageWidth - 50, yPos);
      yPos += 7;
    });
    if (payslipData.advancePayment) {
      addLeftText('Advance Payment', 10, yPos);
      addLeftText(formatPDFCurrency(payslipData.advancePayment), pageWidth - 50, yPos);
      yPos += 7;
    }
    pdf.setFont(undefined, 'bold');
    addLeftText('Total Deductions', 10, yPos + 7);
    addLeftText(formatPDFCurrency(payslipData.totalRegularDeductions), pageWidth - 50, yPos + 7);
    pdf.setFont(undefined, 'normal');
    addLine(yPos + 10);

    // Attendance Summary
    yPos += 20;
    pdf.setFont(undefined, 'bold');
    addCenteredText('Attendance Summary', yPos);
    pdf.setFont(undefined, 'normal');
    yPos += 10;
    addLeftText(`Loss of Pay (LoP) Days: ${payslipData.lopDays}`, 10, yPos);
    addLeftText(`Half Days: ${payslipData.halfDays}`, pageWidth / 2, yPos);
    yPos += 7;
    addLeftText(`Paid Leave Days: ${payslipData.paidLeaveDays}`, 10, yPos);
    addLeftText(`Absent Days: ${payslipData.absentDays}`, pageWidth / 2, yPos);
    yPos += 7;
    addLeftText(`Attendance Deductions: ${formatPDFCurrency(payslipData.totalAttendanceDeductions)}`, 10, yPos);
    addLine(yPos + 3);

    // Final Calculation
    yPos += 13;
    addLeftText(`Total Earnings: ${formatPDFCurrency(payslipData.totalEarnings)}`, 10, yPos);
    yPos += 7;
    addLeftText(`Total Deductions: ${formatPDFCurrency(payslipData.totalDeductions)}`, 10, yPos);
    yPos += 10;
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    addLeftText(`Net Salary: ${formatPDFCurrency(payslipData.netSalary)}`, 10, yPos);
    pdf.setFont(undefined, 'normal');

    // Footer
    addLine(yPos + 10);
    pdf.setFontSize(8);
    addCenteredText('Note: This is a system-generated payslip and does not require a signature.', yPos + 20);

    pdf.save(`payslip_${payslipData.employeeName}_${payslipData.month}.pdf`);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!payslipData) {
    return <Alert variant="warning">No payslip data available</Alert>;
  }

  return (
    <Container className="my-5 container-fluid d-flex flex-column min-vh-100">
      <div className="d-flex justify-content-between px-3 align-items-center mb-4">
        <div className="head-content">
          <h3>Payslip Details</h3>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/payslip-reports" className="text-danger text-decoration-none">
                  <b>Payslip Reports</b>
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Payslip Details
              </li>
            </ol>
          </nav>
        </div>
        <div>
          <Button variant="primary" className="me-2" onClick={generatePDF}>
            Download PDF
          </Button>
          <Button variant="danger" onClick={handleDeletePayslip}>
            Delete Payslip
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <Image 
              src="/logo.png" 
              alt="Company Logo" 
              style={{ maxHeight: '50px', marginRight: '15px' }} 
            />
            <Card.Title className="d-inline-block">{payslipData.companyName}</Card.Title>
          </div>
          <Card.Subtitle className="mb-2 text-muted">
            Payslip for {formatMonth(payslipData.month)}
          </Card.Subtitle>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Employee Details</Card.Title>
          <Row>
            <Col md={6}>
              <p><strong>Name:</strong> {payslipData.employeeName}</p>
              <p><strong>Department:</strong> {payslipData.department}</p>
            </Col>
            <Col md={6}>
              <p><strong>Designation:</strong> {payslipData.designation}</p>
              <p><strong>Date of Joining:</strong> {payslipData.joiningDate}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Earnings</Card.Title>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(payslipData.earnings).map(([key, value]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{value.type === 'percentage' ? `${value.value}%` : formatCurrency(value.value)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th>Total Earnings</th>
                    <th>{formatCurrency(payslipData.totalEarnings)}</th>
                  </tr>
                </tfoot>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Deductions</Card.Title>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(payslipData.deductions).map(([key, value]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{value.type === 'percentage' ? `${value.value}%` : formatCurrency(value.value)}</td>
                    </tr>
                  ))}
                  {payslipData.advancePayment && (
                    <tr>
                      <td>Advance Payment</td>
                      <td>{formatCurrency(payslipData.advancePayment)}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <th>Total Deductions</th>
                    <th>{formatCurrency(payslipData.totalRegularDeductions)}</th>
                  </tr>
                </tfoot>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Attendance Summary</Card.Title>
          <Row>
            <Col md={6}>
              <p><strong>Loss of Pay Days:</strong> {payslipData.lopDays}</p>
              <p><strong>Half Days:</strong> {payslipData.halfDays}</p>
            </Col>
            <Col md={6}>
              <p><strong>Paid Leave Days:</strong> {payslipData.paidLeaveDays}</p>
              <p><strong>Absent Days:</strong> {payslipData.absentDays}</p>
            </Col>
          </Row>
          <p><strong>Attendance Deduction:</strong> {formatCurrency(payslipData.totalAttendanceDeductions)}</p>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <h5>Total Calculation</h5>
              <p>{formatCurrency(payslipData.totalEarnings)} - {formatCurrency(payslipData.totalDeductions)}</p>
            </Col>
            <Col md={6}>
              <h5>Net Salary</h5>
              <p className="text-success fw-bold">{formatCurrency(payslipData.netSalary)}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <p className="text-center text-muted">
        Note: This is a system-generated payslip and does not require a signature.
      </p>
      <div className="mt-auto">
        <div className="small text-muted text-center py-2">
          © 2024 HRIFY. Powered by JK Global IT Solutions.
        </div>
      </div>
    </Container>
  );
}

export default PayslipScreen;