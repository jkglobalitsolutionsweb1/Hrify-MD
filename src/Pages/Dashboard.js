import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, Container, Row, Col } from 'react-bootstrap';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { useAuth } from '../auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { user } = useAuth();
  const [companyCount, setCompanyCount] = useState(0);
  const [activeCompanyCount, setActiveCompanyCount] = useState(0);
  const [inactiveCompanyCount, setInactiveCompanyCount] = useState(0);
  const [chartData, setChartData] = useState({
    labels: ['Total Companies', 'Active Companies', 'Inactive Companies'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: [
          'green',
          'red',
          'grey'
        ],
        borderColor: [
          'green',
          'red',
          'grey'
        ],
        borderWidth: 1
      }
    ]
  });

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const companiesRef = collection(firestore, 'companies');
      const companiesSnapshot = await getDocs(companiesRef);
      const validCompanies = companiesSnapshot.docs.filter(doc => {
        const companyData = doc.data();
        return companyData && companyData.uid;
      });

      const totalCompanies = validCompanies.length;
      setCompanyCount(totalCompanies);

      let activeCount = 0;
      let inactiveCount = 0;

      for (const companyDoc of validCompanies) {
        const companyId = companyDoc.id;
        const companyDetailsDoc = await getDoc(doc(firestore, 'companies', companyId, 'company_settings', 'companyDetails'));
        
        if (companyDetailsDoc.exists()) {
          const companyData = companyDetailsDoc.data();
          if (companyData.status === 'active') {
            activeCount++;
          } else if (companyData.status === 'inactive') {
            inactiveCount++;
          }
        }
      }

      setActiveCompanyCount(activeCount);
      setInactiveCompanyCount(inactiveCount);

      // Update chart data
      setChartData(prevData => ({
        ...prevData,
        datasets: [
          {
            ...prevData.datasets[0],
            data: [totalCompanies, activeCount, inactiveCount]
          }
        ]
      }));

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchData]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Container fluid className="d-flex flex-column min-vh-100">
      <Row className="my-4">
        <Col>
          <h3><b>Dashboard</b></h3>
        </Col>
      </Row>

      <Row className="mb-4">
        <AnimatePresence>
          <Col md={4} className="mb-4">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={cardVariants}
              transition={{ duration: 0.5 }}
            >
              <Link to="/companies" className="text-decoration-none">
                <Card>
                  <Card.Header style={{backgroundColor:"red"}} className="text-white text-center">
                    <b>Total Companies</b>
                  </Card.Header>
                  <Card.Body className="text-center">
                    <motion.h1
                      key={companyCount}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                      {companyCount}
                    </motion.h1>
                  </Card.Body>
                </Card>
              </Link>
            </motion.div>
          </Col>
          <Col md={4} className="mb-4">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={cardVariants}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link to="" className="text-decoration-none">
                <Card>
                  <Card.Header style={{backgroundColor:"red"}} className="text-white text-center">
                    <b>Active Companies</b>
                  </Card.Header>
                  <Card.Body className="text-center">
                    <motion.h1
                      key={activeCompanyCount}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                      {activeCompanyCount}
                    </motion.h1>
                  </Card.Body>
                </Card>
              </Link>
            </motion.div>
          </Col>
          <Col md={4} className="mb-4">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={cardVariants}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link to="" className="text-decoration-none">
                <Card>
                  <Card.Header style={{backgroundColor:"red"}} className="text-white text-center">
                    <b>Inactive Companies</b>
                  </Card.Header>
                  <Card.Body className="text-center">
                    <motion.h1
                      key={inactiveCompanyCount}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                      {inactiveCompanyCount}
                    </motion.h1>
                  </Card.Body>
                </Card>
              </Link>
            </motion.div>
          </Col>
        </AnimatePresence>
      </Row>

      <Row className="mb-4">
        <Col>
          <h4><b>Analytics</b></h4>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <Card.Header style={{backgroundColor:"red"}} className="text-white">
                <h5 className="mb-0"><b>Company Status</b></h5>
              </Card.Header>
              <Card.Body style={{ height: '400px' }}>
                <Bar 
                  data={chartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.label}: ${context.parsed.y}`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false
                        }
                      },
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                          precision: 0
                        }
                      }
                    },
                    layout: {
                      padding: {
                        top: 20
                      }
                    }
                  }} 
                />
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>

      <Row className="mt-auto">
        <Col>
          <div className="small text-muted text-center py-2">
            © 2024 HRIFY. Powered by JK Global IT Solutions.
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;

