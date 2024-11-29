import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card } from 'react-bootstrap';

const OrganizationSettings = () => {
  const cardStyle = {
    textDecoration: 'none',
  };

  const rectangularCardStyle = {
    width: '100%',  // Take full width of the column
    height: '100px', // Adjust height for rectangular shape
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto',
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
    transform: 'translateY(-5px)', // Adjusted for a smaller hover effect
    boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
  };

  const [hoveredCard, setHoveredCard] = useState(null);

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
            <h3>Organization Settings</h3>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/Settings" className="text-danger" style={{ textDecoration: 'none' }}>
                    <b>Settings</b>
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Organization Settings</li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Section 1: Manage Organization */}
        <h5 className="mt-4">Manage Organization</h5>
        <Row className="justify-content-start my-3">
          {/* Branches */}
          <Col md={6} lg={3}>
            <Link
              to="/branches"
              style={cardStyle}
              onMouseEnter={() => handleMouseEnter(1)}
              onMouseLeave={handleMouseLeave}
            >
              <Card className="mb-4" style={rectangularCardStyle}>
                <Card.Body style={hoveredCard === 1 ? { ...cardBodyStyle, ...hoverStyle } : cardBodyStyle}>
                  <Card.Title>Branches</Card.Title>
                </Card.Body>
              </Card>
            </Link>
          </Col>

          {/* Departments */}
          <Col md={6} lg={3}>
            <Link
              to="/departments"
              style={cardStyle}
              onMouseEnter={() => handleMouseEnter(2)}
              onMouseLeave={handleMouseLeave}
            >
              <Card className="mb-4" style={rectangularCardStyle}>
                <Card.Body style={hoveredCard === 2 ? { ...cardBodyStyle, ...hoverStyle } : cardBodyStyle}>
                  <Card.Title>Departments</Card.Title>
                </Card.Body>
              </Card>
            </Link>
          </Col>

          {/* Employee Designation */}
          <Col md={6} lg={3}>
            <Link
              to="/employee-designation"
              style={cardStyle}
              onMouseEnter={() => handleMouseEnter(3)}
              onMouseLeave={handleMouseLeave}
            >
              <Card className="mb-4" style={rectangularCardStyle}>
                <Card.Body style={hoveredCard === 3 ? { ...cardBodyStyle, ...hoverStyle } : cardBodyStyle}>
                  <Card.Title>Employee Designation</Card.Title>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        </Row>

        {/* Section 2: Attendance & Shift Settings */}
        <h5 className="mt-4">Attendance & Shift Settings</h5>
        <Row className="justify-content-start my-3">
          {/* Shift Settings */}
          <Col md={6} lg={3}>
            <Link
              to="/shift-settings"
              style={cardStyle}
              onMouseEnter={() => handleMouseEnter(4)}
              onMouseLeave={handleMouseLeave}
            >
              <Card className="mb-4" style={rectangularCardStyle}>
                <Card.Body style={hoveredCard === 4 ? { ...cardBodyStyle, ...hoverStyle } : cardBodyStyle}>
                  <Card.Title>Shift Settings</Card.Title>
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

export default OrganizationSettings;
