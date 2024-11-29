import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import { useAuth } from '../../auth/AuthContext';
import { Alert, Button, Modal, Spinner } from 'react-bootstrap';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, getDaysInMonth } from 'date-fns';

function Employeelist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGeneratingPayslips, setIsGeneratingPayslips] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    let unsubscribe;

    const fetchEmployees = async () => {
      if (user) {
        setLoading(true);
        try {
          const employeesRef = collection(firestore, 'employees');
          const q = query(employeesRef, where("companyId", "==", user.uid));
          
          unsubscribe = onSnapshot(q, (querySnapshot) => {
            const employeeData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              Designation: doc.data().designation?.name || 'N/A',
              Department: doc.data().department?.name || 'N/A'
            }));
            setEmployees(employeeData);
            setLoading(false);
          });
        } catch (error) {
          console.error("Error fetching employees:", error);
          setError("Failed to fetch employees. Please try again.");
          setLoading(false);
        }
      }
    };

    fetchEmployees();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const filteredEmployees = employees.filter(emp => {
    return (
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.Designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.Department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleViewEmployee = (emp) => {
    navigate(`/Payrolldetails/${emp.id}`);
  };

  const generateAllPayslips = async () => {
    setIsGeneratingPayslips(true);
    setError('');

    try {
      let successCount = 0;
      let skipCount = 0;
      let alreadyGeneratedCount = 0;

      for (const employee of employees) {
        const hasSalaryDetails = await checkPayrollSettings(employee.id);
        if (hasSalaryDetails) {
          const alreadyGenerated = await hasPayslipForCurrentMonth(employee.id);
          if (!alreadyGenerated) {
            await generatePayslipForEmployee(employee);
            successCount++;
          } else {
            alreadyGeneratedCount++;
          }
        } else {
          skipCount++;
        }
      }

      alert(`Generated ${successCount} payslips. Skipped ${skipCount} employees due to missing payroll settings. ${alreadyGeneratedCount} employees already have payslips for this month.`);
    } catch (error) {
      console.error("Error generating payslips:", error);
      setError("Failed to generate payslips. Please try again.");
    } finally {
      setIsGeneratingPayslips(false);
    }
  };

  const checkPayrollSettings = async (employeeId) => {
    const salaryDetailsSnapshot = await getDocs(collection(firestore, 'employees', employeeId, 'salaryDetails'));
    return !salaryDetailsSnapshot.empty;
  };

  const hasPayslipForCurrentMonth = async (employeeId) => {
    const currentMonth = format(new Date(), 'MM-yyyy');
    const payslipDoc = await getDoc(doc(firestore, 'employees', employeeId, 'payslips', currentMonth));
    return payslipDoc.exists();
  };

  const generatePayslipForEmployee = async (employee) => {
    try {
      const currentDate = new Date();
      const payslipMonth = format(currentDate, 'MM-yyyy');

      const salaryDetails = await fetchSalaryDetails(employee.id);
      const attendanceData = await fetchAttendanceData(employee.email, employee.companyId);
      const calculatedSalaryDetails = calculateSalaryBreakdown(salaryDetails, attendanceData);

      if (!employee.companyId) {
        throw new Error("Company ID not found for employee");
      }

      const companySettingsRef = doc(firestore, "companies", employee.companyId, "company_settings", "companyDetails");
      const companySettingsSnap = await getDoc(companySettingsRef);
      const companySettings = companySettingsSnap.data() || {};

      const payslipData = {
        employeeName: employee.name || "",
        email: employee.email || "",
        department: employee.Department || "",
        designation: employee.Designation || "",
        joiningDate: employee.joiningDate || null,
        month: payslipMonth,
        generatedAt: currentDate,
        netSalary: calculatedSalaryDetails.netSalary,
        totalEarnings: calculatedSalaryDetails.totalEarnings,
        totalDeductions: calculatedSalaryDetails.totalDeductions,
        totalRegularDeductions: calculatedSalaryDetails.totalDeductions,
        totalAttendanceDeductions: calculatedSalaryDetails.attendanceDeduction,
        earnings: calculatedSalaryDetails.earnings,
        deductions: calculatedSalaryDetails.deductions,
        lopDays: attendanceData.lopDays,
        halfDays: attendanceData.halfDays,
        paidLeaveDays: attendanceData.paidLeaveDays,
        absentDays: attendanceData.absentDays,
        daysPresent: attendanceData.daysPresent,
        totalWorkingDays: attendanceData.totalWorkingDays,
        companyName: companySettings.companyName || "",
        status: 'Unpaid'
      };

      if (companySettings.logoUrl) {
        payslipData.companyLogo = companySettings.logoUrl;
      }

      if (calculatedSalaryDetails.advance_payments?.value > 0 && 
          calculatedSalaryDetails.advance_payments?.deductedMonth === payslipMonth) {
        payslipData.advancePayment = calculatedSalaryDetails.advance_payments.value;
      }

      await setDoc(doc(firestore, 'employees', employee.id, 'payslips', payslipMonth), payslipData);
    } catch (error) {
      console.error(`Error generating payslip for employee ${employee.id}:`, error);
      throw error;
    }
  };

  const fetchSalaryDetails = async (employeeId) => {
    const salaryDetailsRef = doc(collection(firestore, "employees", employeeId, "salaryDetails"), "currentSalary");
    const salaryDetailsSnap = await getDoc(salaryDetailsRef);
    return salaryDetailsSnap.exists() ? salaryDetailsSnap.data() : {};
  };

  const fetchAttendanceData = async (email, companyId) => {
    try {
      const now = new Date();
      const firstDayOfMonth = startOfMonth(now);
      const lastDayOfMonth = endOfMonth(now);

      const companySettingsRef = doc(firestore, "companies", companyId, "company_settings", "companyDetails");
      const companySettingsSnap = await getDoc(companySettingsRef);
      const companySettings = companySettingsSnap.exists() ? companySettingsSnap.data() : {};

      const totalDaysInMonth = getDaysInMonth(now);
      const nonWorkingDays = calculateNonWorkingDays(now, companySettings);
      const holidaysInMonth = calculateHolidaysInMonth(now, companySettings);

      const totalWorkingDays = totalDaysInMonth - nonWorkingDays - holidaysInMonth.length;

      const workingDays = new Set(companySettings.workingDays);

      const attendanceQuery = query(collection(firestore, 'employees', email, 'attendance'));
      const attendanceSnapshot = await getDocs(attendanceQuery);

      let totalDays = 0;
      let presentDays = 0;
      let absentDays = 0;
      let halfDays = 0;
      const daysWithAttendance = new Set();

      attendanceSnapshot.forEach(doc => {
        const attendance = doc.data();
        if (attendance.checkInDate) {
          const checkInDate = new Date(attendance.checkInDate.split('-').reverse().join('-'));
          if (checkInDate >= firstDayOfMonth && checkInDate <= lastDayOfMonth) {
            totalDays++;
            daysWithAttendance.add(format(checkInDate, 'dd-MM-yyyy'));
            if (attendance.status === 'Present') presentDays++;
            if (attendance.status === 'Half Day') halfDays++;
            if (attendance.status === 'Absent') absentDays++;
          }
        }
      });

      const leaveQuery = query(
        collection(firestore, 'employees', email, 'leave_requests'),
        where('leaveType', 'in', ['Loss Of Pay', 'Paid Leave']),
        where('status', '==', 'Approved')
      );
      const leaveSnapshot = await getDocs(leaveQuery);

      let lopDays = 0;
      let paidLeaveDays = 0;
      const lopAndPaidLeaveDays = new Set();

      leaveSnapshot.forEach(doc => {
        const leave = doc.data();
        if (leave.fromDate && leave.toDate) {
          const fromDate = leave.fromDate.toDate();
          const toDate = leave.toDate.toDate();
          if (fromDate <= lastDayOfMonth && toDate >= firstDayOfMonth) {
            eachDayOfInterval({ start: fromDate, end: toDate }).forEach(day => {
              if (day >= firstDayOfMonth && day <= lastDayOfMonth) {
                const dayWithoutTime = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                const isHoliday = holidaysInMonth.some(holiday => 
                  holiday.toDate().getTime() === dayWithoutTime.getTime()
                );
                const isNonWorkingDay = !workingDays.has(getDayName(day));
                const formattedDay = format(day, 'dd-MM-yyyy');

                if (leave.leaveType === 'Loss Of Pay' && !isHoliday && !isNonWorkingDay) {
                  lopDays++;
                  lopAndPaidLeaveDays.add(formattedDay);
                }
                if (leave.leaveType === 'Paid Leave') {
                  paidLeaveDays++;
                  lopAndPaidLeaveDays.add(formattedDay);
                }
              }
            });
          }
        }
      });

      const daysWithoutCheckIn = totalWorkingDays - daysWithAttendance.size;
      absentDays += daysWithoutCheckIn - lopAndPaidLeaveDays.size;

      return {
        totalWorkingDays,
        daysPresent: presentDays,
        absentDays,
        lopDays,
        halfDays,
        paidLeaveDays,
      };
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      throw error;
    }
  };

  const calculateNonWorkingDays = (month, settings) => {
    let nonWorkingDays = 0;
    const daysInMonth = getDaysInMonth(month);

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(month.getFullYear(), month.getMonth(), i);
      const dayName = getDayName(date);
      if (!settings.workingDays.includes(dayName)) {
        nonWorkingDays++;
      }
    }
    return nonWorkingDays;
  };

  const calculateHolidaysInMonth = (month, settings) => {
    return settings.holidays.filter(holiday => 
      holiday.toDate().getFullYear() === month.getFullYear() && 
      holiday.toDate().getMonth() === month.getMonth()
    );
  };

  const getDayName = (date) => {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  };

  const calculateSalaryBreakdown = (details, attendanceData) => {
    const basicSalary = details.earnings.basicSalary?.value || 0;
    
    const totalEarnings = Object.entries(details.earnings).reduce((sum, [key, earning]) => {
      if (earning.type === "percentage") {
        const calculatedAmount = (basicSalary * earning.value) / 100;
        earning.calculatedAmount = calculatedAmount;
        return sum + calculatedAmount;
      }
      return sum + (earning.value || 0);
    }, 0);

    const totalDeductions = Object.entries(details.deductions).reduce(
      (sum, [key, deduction]) => {
        if (deduction.type === "percentage") {
          return sum + ((deduction.value / 100) * basicSalary);
        }
        return sum + (deduction.value || 0);
      },
      0
    );

    const calculateTotalAttendanceDeduction = () => {
      const lopDays = attendanceData.lopDays || 0;
      const lopRate = details.attendanceDeductions.lossOfPay?.value || 0;
      const lopDeduction = lopDays * lopRate;

      const absentDays = attendanceData.absentDays || 0;
      const absentDayRate = details.attendanceDeductions.lossOfPay?.value || 0;
      const absentDaysDeduction = absentDays * absentDayRate;

      const halfDays = attendanceData.halfDays || 0;
      const halfDayRate = details.attendanceDeductions.halfDay?.value || 0;
      const halfDaysDeduction = halfDays * halfDayRate;

      return lopDeduction + absentDaysDeduction + halfDaysDeduction;
    };

    const attendanceDeduction = calculateTotalAttendanceDeduction();

    let netSalary = totalEarnings - totalDeductions - attendanceDeduction;

    const currentDate = new Date();
    const currentMonth = format(currentDate, 'MM-yyyy');

    if (details.advance_payments && 
        details.advance_payments.deductedMonth === currentMonth && 
        details.advance_payments.value > 0) {
      netSalary -= details.advance_payments.value;
    }

    return {
      ...details,
      totalEarnings,
      totalDeductions,
      attendanceDeduction,
      netSalary
    };
  };

  return (
    <div className="container my-3 d-flex flex-column min-vh-100">
      <div className="rounded-3">
        <div className="d-flex justify-content-between px-3 align-items-end">
          <div className="head-content">
            <h3>Generate Payslip</h3>
            <nav style={{ "--bs-breadcrumb-divider": 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'8\'%3E%3Cpath d=\'M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z\' fill=\'currentColor\'/%3E%3C/svg%3E")' }} aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item active text-danger" aria-current="page">
                  <Link className="text-decoration-none text-danger" to="/PayslipRoute">
                    <b>Home</b>
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                Generate Payslip
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="container my-1">
          <div className="button text-end m-1">
            <button
              className="align-items-center text-end bg-danger text-light fw-bold p-1 px-2 rounded"
              style={{ border: "none" }}
              onClick={() => setShowConfirmModal(true)}
              disabled={isGeneratingPayslips}
              data-bs-toggle="tooltip"
              data-bs-placement="right"
              title="Generate All Payslips"
            >
              <b>
                <i className="fa-solid fa-print"></i> Generate All
              </b>
            </button>
          </div>
          <div className="table-container p-3 rounded">
            <div className="row d-flex justify-content-between align-items-center mb-2">
              <div className="col-12 col-md-6 d-flex align-items-center mb-2 mb-md-0">
                <label htmlFor="rowsPerPage" className="me-2">Listings per page:</label>
                <select id="rowsPerPage" className="form-select w-auto" value={rowsPerPage} onChange={(e) => setRowsPerPage(parseInt(e.target.value))}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={filteredEmployees.length}>All</option>
                </select>
              </div>
              <div className="col-12 col-md-6">
                <div className="input-group">
                  <input 
                    id="searchInput" 
                    type="text" 
                    className="form-control" 
                    placeholder="Search in all columns ( Employee )" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                  <button className="btn btn-outline-danger" type="button">Search</button>
                </div>
              </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <div className="table-responsive">
              {loading ? (
                <div className="text-center my-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : (
                <table className="table table-bordered text-center">
                  <thead>
                    <tr>
                      <th scope="col">NAME</th>
                      <th scope="col">Designation</th>
                      <th scope="col">Department</th>
                      <th scope="col">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.slice(0, rowsPerPage === filteredEmployees.length ? filteredEmployees.length : rowsPerPage).map(emp => (
                      <tr key={emp.id}>
                        <td>{emp.name}</td>
                        <td>{emp.Designation}</td>
                        <td>{emp.Department}</td>
                        <td>
                          <button className="btn btn-secondary btn-sm me-2" onClick={() => handleViewEmployee(emp)}>
                            <i className="bi bi-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Generate Payslips</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to generate payslips for all employees? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => {
            setShowConfirmModal(false);
            generateAllPayslips();
          }}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
      <div className="mt-auto">
        <div className="small text-muted text-center py-2">
          © 2024 HRIFY. Powered by JK Global IT Solutions.
        </div>
      </div>
    </div>
  );
}

export default Employeelist;