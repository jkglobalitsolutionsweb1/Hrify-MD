import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Container, Row, Col } from 'react-bootstrap';
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, getDocs, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { useAuth } from '../auth/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function Component() {
  const { user } = useAuth();
  const [showAddTimesheet, setShowAddTimesheet] = useState(false);
  const [showEditAttendance, setShowEditAttendance] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchCompanySettings = async () => {
      const settingsDoc = await getDocs(collection(firestore, 'companies', user.uid, 'company_settings'));
      if (!settingsDoc.empty) {
        const settings = settingsDoc.docs[0].data();
        setCompanySettings({
          ...settings,
          holidays: settings.holidays.map(holiday => holiday.toDate())
        });
      }
    };

    const fetchEmployees = () => {
      const employeesRef = collection(firestore, 'employees');
      const employeesQuery = query(employeesRef, where("companyId", "==", user.uid));
      
      return onSnapshot(employeesQuery, (snapshot) => {
        const employeesList = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setEmployees(employeesList);
      });
    };

    const fetchAttendanceData = () => {
      const employeesRef = collection(firestore, 'employees');
      const employeesQuery = query(employeesRef, where("companyId", "==", user.uid));
      
      return onSnapshot(employeesQuery, (employeesSnapshot) => {
        const allAttendance = [];
        const attendanceUnsubscribes = [];

        employeesSnapshot.docs.forEach((employeeDoc) => {
          const employeeData = employeeDoc.data();
          const attendanceRef = collection(employeeDoc.ref, 'attendance');
          
          const attendanceUnsubscribe = onSnapshot(attendanceRef, (attendanceSnapshot) => {
            attendanceSnapshot.docs.forEach((attendanceDoc) => {
              const attendanceData = attendanceDoc.data();
              const existingAttendanceIndex = allAttendance.findIndex(a => a.id === attendanceDoc.id && a.employeeId === employeeDoc.id);
              const formattedAttendance = {
                id: attendanceDoc.id,
                ...attendanceData,
                employeeName: employeeData.name,
                employeeId: employeeDoc.id,
                checkInDate: attendanceData.checkInDate,
                checkInTime: formatTime(attendanceData.checkInTime),
                checkOutTime: formatTime(attendanceData.checkOutTime),
                workingHours: calculateWorkingHours(attendanceData.checkInTime, attendanceData.checkOutTime),
              };

              if (existingAttendanceIndex > -1) {
                allAttendance[existingAttendanceIndex] = formattedAttendance;
              } else {
                allAttendance.push(formattedAttendance);
              }
            });
            
            setAttendanceData([...allAttendance]);
            setLoading(false);
          });

          attendanceUnsubscribes.push(attendanceUnsubscribe);
        });

        return () => attendanceUnsubscribes.forEach(unsubscribe => unsubscribe());
      });
    };

    fetchCompanySettings();
    const employeesUnsubscribe = fetchEmployees();
    const attendanceUnsubscribe = fetchAttendanceData();

    return () => {
      employeesUnsubscribe();
      attendanceUnsubscribe();
    };
  }, [user]);

  const formatTime = (time) => {
    if (time instanceof Timestamp) {
      time = time.toDate();
    } else if (typeof time === 'string') {
      time = new Date(time);
    }
    let hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const formatTimeForInput = (time) => {
    if (time instanceof Timestamp) {
      time = time.toDate();
    } else if (typeof time === 'string') {
      time = new Date(time);
    }
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const calculateWorkingHours = (checkInTime, checkOutTime) => {
    const checkIn = checkInTime instanceof Timestamp ? checkInTime.toDate() : new Date(checkInTime);
    const checkOut = checkOutTime instanceof Timestamp ? checkOutTime.toDate() : new Date(checkOutTime);
    const diff = checkOut - checkIn;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} hours`;
  };

  const handleCloseAddTimesheet = () => setShowAddTimesheet(false);
  const handleShowAddTimesheet = () => setShowAddTimesheet(true);

  const handleCloseEditAttendance = () => setShowEditAttendance(false);
  const handleShowEditAttendance = (attendance) => {
    setSelectedAttendance({
      ...attendance,
      checkInTime: formatTimeForInput(attendance.checkInTime),
      checkOutTime: formatTimeForInput(attendance.checkOutTime),
    });
    setShowEditAttendance(true);
  };

  const handleCloseDeleteConfirmation = () => setShowDeleteConfirmation(false);
  const handleShowDeleteConfirmation = (attendance) => {
    setSelectedAttendance(attendance);
    setShowDeleteConfirmation(true);
  };

  const handleAddAttendance = async (e) => {
    e.preventDefault();
    const form = e.target;
    const employeeId = form.employee.value;
    const date = selectedDate;
    const checkInTime = new Date(date.setHours(form.checkInTime.value.split(':')[0], form.checkInTime.value.split(':')[1]));
    const checkOutTime = new Date(date.setHours(form.checkOutTime.value.split(':')[0], form.checkOutTime.value.split(':')[1]));
    const status = form.status.value;

    if (!isValidAttendanceDate(date)) {
      alert('Invalid date selection. Please choose a working day that is not a holiday.');
      return;
    }

    try {
      const employeeRef = doc(firestore, 'employees', employeeId);
      const formattedDate = formatDate(date);
      const attendanceRef = doc(employeeRef, 'attendance', formattedDate);

      await setDoc(attendanceRef, {
        checkInDate: formattedDate,
        checkInTime: Timestamp.fromDate(checkInTime),
        checkOutTime: Timestamp.fromDate(checkOutTime),
        status: status,
        workingHours: calculateWorkingHours(checkInTime, checkOutTime),
      });
      handleCloseAddTimesheet();
    } catch (error) {
      console.error("Error adding attendance:", error);
    }
  };

  const handleEditAttendance = async (e) => {
    e.preventDefault();
    const form = e.target;
    const checkInTime = new Date(selectedAttendance.checkInDate.split('-').reverse().join('-') + 'T' + form.checkInTime.value);
    const checkOutTime = new Date(selectedAttendance.checkInDate.split('-').reverse().join('-') + 'T' + form.checkOutTime.value);
    const status = form.status.value;

    try {
      const attendanceRef = doc(firestore, 'employees', selectedAttendance.employeeId, 'attendance', selectedAttendance.checkInDate);
      await updateDoc(attendanceRef, {
        checkInTime: Timestamp.fromDate(checkInTime),
        checkOutTime: Timestamp.fromDate(checkOutTime),
        status: status,
        workingHours: calculateWorkingHours(checkInTime, checkOutTime),
      });
      handleCloseEditAttendance();
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };

  const handleDeleteAttendance = async () => {
    try {
      const attendanceRef = doc(firestore, 'employees', selectedAttendance.employeeId, 'attendance', selectedAttendance.checkInDate);
      await deleteDoc(attendanceRef);
      handleCloseDeleteConfirmation();
    } catch (error) {
      console.error("Error deleting attendance:", error);
    }
  };

  const formatDate = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const isValidAttendanceDate = (date) => {
    if (!companySettings) return true; // If settings are not loaded, allow all dates

    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    const isWorkingDay = companySettings.workingDays.includes(dayName);
    const isHoliday = companySettings.holidays.some(holiday => 
      holiday.toDateString() === date.toDateString()
    );

    return isWorkingDay && !isHoliday;
  };

  const filterTable = () => {
    return attendanceData.filter((row) => {
      const employeeName = row.employeeName.toLowerCase();
      const [day, month, year] = row.checkInDate.split('-');
      const rowDate = new Date(year, month - 1, day);
      const nameMatch = employeeName.includes(searchInput.toLowerCase());
      const dateMatch = selectedMonth
        ? rowDate.getFullYear() === parseInt(selectedMonth.split('-')[0]) &&
          rowDate.getMonth() === parseInt(selectedMonth.split('-')[1]) - 1
        : true;
      return nameMatch && dateMatch;
    });
  };

  const paginatedTableData = () => {
    const filteredData = filterTable();
    if (rowsPerPage === 'all') {
      return filteredData;
    }
    return filteredData.slice(0, rowsPerPage);
  };

  return (
    <Container fluid className="my-3 d-flex flex-column min-vh-100">
      <div className="rounded-3">
        <div className="d-flex justify-content-between px-3 align-items-end">
          <div>
            <h3>Attendance List</h3>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/dashboard" className="text-danger" style={{ textDecoration: 'none' }}>
                    <b>Home</b>
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Attendance</li>
              </ol>
            </nav>
          </div>
          <div className="button text-end m-2 mx-1">
            <Button
              className="align-items-center text-end custom-danger text-light fw-bold p-1 px-2 rounded"
              style={{ border: 'none' }}
              onClick={handleShowAddTimesheet}
            >
              <b>
                <i className="fa-solid fa-plus"></i>
              </b>
            </Button>
          </div>
        </div>

        <Modal show={showAddTimesheet} onHide={handleCloseAddTimesheet}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Employee Attendance</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleAddAttendance}>
              <Form.Group className="mb-3">
                <Form.Label>Employee</Form.Label>
                <Form.Select name="employee" required>
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label><br></br>
                <DatePicker
                  selected={selectedDate}
                  onChange={date => setSelectedDate(date)}
                  filterDate={isValidAttendanceDate}
                  dateFormat="dd-MM-yyyy"
                  className="form-control w-100"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Check In Time</Form.Label>
                <Form.Control type="time" name="checkInTime" required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Check Out Time</Form.Label>
                <Form.Control type="time" name="checkOutTime" required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select name="status" required>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Half Day">Half Day</option>
                </Form.Select>
              </Form.Group>
              <Button type="submit" className="custom-danger w-100">Create</Button>
            </Form>
          </Modal.Body>
        </Modal>

        <Modal show={showEditAttendance} onHide={handleCloseEditAttendance}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Attendance</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedAttendance && (
              <Form onSubmit={handleEditAttendance}>
                <Form.Group className="mb-3">
                  <Form.Label>Employee</Form.Label>
                  <Form.Control type="text" value={selectedAttendance.employeeName} readOnly />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control type="text" value={selectedAttendance.checkInDate} readOnly />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Check In Time</Form.Label>
                  <Form.Control type="time" name="checkInTime" defaultValue={selectedAttendance.checkInTime} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Check Out Time</Form.Label>
                  <Form.Control type="time" name="checkOutTime" defaultValue={selectedAttendance.checkOutTime} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select name="status" defaultValue={selectedAttendance.status} required>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Half Day">Half Day</option>
                  </Form.Select>
                </Form.Group>
                <Button type="submit" className="custom-danger w-100">Save Changes</Button>
              </Form>
            )}
          </Modal.Body>
        </Modal>

        <Modal show={showDeleteConfirmation} onHide={handleCloseDeleteConfirmation}>
          <Modal.Header className="custom-danger text-light" closeButton>
            <Modal.Title>Delete Attendance Record</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to delete this attendance record?</p>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={handleCloseDeleteConfirmation} className="me-2">
                No
              </Button>
              <Button className="custom-danger" onClick={handleDeleteAttendance}>Yes</Button>
            </div>
          </Modal.Body>
        </Modal>

        <Container className="my-4">
          <div className="table-container p-3 rounded">
            <Row className="d-flex justify-content-between align-items-center mb-2">
              <Col xs={12} md={2} className=" align-items-center mb-2 mb-md-0">
                <Form.Label className="me-2">Listings per page:</Form.Label>
                <Form.Select
                  className="w-auto"
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                >
                  <option value="all">All</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                </Form.Select>
              </Col>
              <Col xs={12} md={6} className=" align-items-center mb-2 mb-md-0">
                <Form.Label className="me-2">Filter Attendance List :</Form.Label>
                <Form.Control
                  type="month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </Col>
              <Col xs={12} md={4}>
                <Form.Label className="me-2">Seach Employee Name:</Form.Label>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    placeholder="Search by Employee Name"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <Button className="custom-danger" type="button">
                    <i className="fa-solid  fa-magnifying-glass"></i>
                  </Button>
                </div>
              </Col>
            </Row>

            <Table responsive bordered hover className="mt-2">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Check In Time</th>
                  <th>Check Out Time</th>
                  <th>Working Hours</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7">Loading...</td>
                  </tr>
                ) : paginatedTableData().length > 0 ? 
                  (paginatedTableData().map((row) => (
                    <tr key={row.id}>
                      <td>{row.employeeName}</td>
                      <td>{row.checkInDate}</td>
                      <td>{row.status}</td>
                      <td>{row.checkInTime}</td>
                      <td>{row.checkOutTime}</td>
                      <td>{row.workingHours}</td>
                      <td>
                        <Button
                          className="btn btn-sm btn-secondary me-2"
                          onClick={() => handleShowEditAttendance(row)}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </Button>
                        <Button
                          className="btn btn-sm custom-danger border-none"
                          onClick={() => handleShowDeleteConfirmation(row)}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  )))
                : (
                  <tr>
                    <td colSpan="7">No records found</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Container>
      </div>
      <div className="mt-auto">
        <div className="small text-muted text-center py-2">
          © 2024 HRIFY. Powered by JK Global IT Solutions.
        </div>
      </div>
    </Container>
  );
}