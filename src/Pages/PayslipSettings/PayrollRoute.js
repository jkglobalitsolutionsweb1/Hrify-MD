import React from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Breadcrumb } from 'react-bootstrap';

const Settings = () => {
  const cardStyle = {
    textDecoration: 'none',
  };

  const squareCardStyle = {
    width: '250px',  // Adjust this value as needed
    height: '250px', // Ensures the card is square
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto',  // Centers the card horizontally
  };

  const cardBodyStyle = {
    backgroundColor: 'white',
    color: 'red',
    border: '2px solid red',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const hoverStyle = {
    backgroundColor: 'red',
    color: 'white',
    transform: 'translateY(-10px)',
    boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
  };

  const [hoveredCard, setHoveredCard] = React.useState(null);

  const handleMouseEnter = (index) => {
    setHoveredCard(index);
  };

  const handleMouseLeave = () => {
    setHoveredCard(null);
  };

  return (
    <div className="container my-3 d-flex flex-column min-vh-100">
      <div className="rounded-3">
        <div className="d-flex justify-content-between px-3 align-items-end">
          <div className="head-content">
            <h3>Payroll Route</h3>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/PayslipRoute" className="text-danger" style={{ textDecoration: 'none' }}>
                    <b>Home</b>
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                Payroll Route
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <Row className="justify-content-start">
          {/* Card 1: Company Settings */}
          <Col md={6} lg={3}>
            <Link
              to="/payroll"
              style={cardStyle}
              onMouseEnter={() => handleMouseEnter(1)}
              onMouseLeave={handleMouseLeave}
            >
              <Card className="mb-4" style={squareCardStyle}>
                <Card.Body style={hoveredCard === 1 ? { ...cardBodyStyle, ...hoverStyle } : cardBodyStyle}>
                  <Card.Title>Payroll Settings</Card.Title>
                </Card.Body>
              </Card>
            </Link>
          </Col>

          {/* Card 2: Organization Settings */}
          <Col md={6} lg={3}>
            <Link
              to="/payslip"
              style={cardStyle}
              onMouseEnter={() => handleMouseEnter(2)}
              onMouseLeave={handleMouseLeave}
            >
              <Card className="mb-4" style={squareCardStyle}>
                <Card.Body style={hoveredCard === 2 ? { ...cardBodyStyle, ...hoverStyle } : cardBodyStyle}>
                  <Card.Title>Generate Payslip</Card.Title>
                </Card.Body>
              </Card>
            </Link>
          </Col>

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

export default Settings;
