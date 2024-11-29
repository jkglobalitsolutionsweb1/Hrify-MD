import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc, setDoc, collection, query, getDocs, where } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";
import { Row, Col, Container, Button, Alert, Spinner } from "react-bootstrap";
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, getDaysInMonth } from 'date-fns';

function Payrolldetails() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [salaryDetails, setSalaryDetails] = useState({
    earnings: {},
    deductions: {},
    attendanceDeductions: {
      halfDay: { type: "amount", value: 0, days: 0 },
      lossOfPay: { type: "amount", value: 0, days: 0 },
      absentDays: { days: 0 },
      paidLeave: { days: 0 }
    },
    advance_payments: {
      type: "amount",
      value: 0,
      deductedMonth: "",
      date: null,
    },
    totalEarnings: 0,
    totalDeductions: 0,
    attendanceDeduction: 0,
    netSalary: 0
  });
  const [attendanceSummary, setAttendanceSummary] = useState({
    totalWorkingDays: 0,
    daysPresent: 0,
    absentDays: 0,
    lopDays: 0,
    halfDays: 0,
    paidLeaveDays: 0,
  });

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
    const currentMonth = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;

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

  const fetchCompanySettings = async (companyId) => {
    const snapshot = await getDoc(doc(firestore, 'companies', companyId, 'company_settings', 'companyDetails'));
    return snapshot.data();
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

  const fetchAttendanceData = async (email, companyId) => {
    try {
      const now = new Date();
      const firstDayOfMonth = startOfMonth(now);
      const lastDayOfMonth = endOfMonth(now);

      const companySettings = await fetchCompanySettings(companyId);
      const totalDaysInMonth = getDaysInMonth(now);
      const nonWorkingDays = calculateNonWorkingDays(now, companySettings);
      const holidaysInMonth = calculateHolidaysInMonth(now, companySettings);

      const totalWorkingDays = totalDaysInMonth - nonWorkingDays - holidaysInMonth.length;

      const workingDays = new Set(companySettings.workingDays);

      const attendanceQuery = query(
        collection(firestore, 'employees', email, 'attendance')
      );
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

  const fetchEmployeeData = async () => {
    try {
      console.log("Fetching employee data for ID:", employeeId);
      const employeeRef = doc(firestore, "employees", employeeId);
      const employeeSnap = await getDoc(employeeRef);

      if (employeeSnap.exists()) {
        const employeeData = employeeSnap.data();
        console.log("Employee data fetched:", employeeData);
        setEmployee({ id: employeeSnap.id, ...employeeData });

        const salaryDetailsRef = doc(
          collection(firestore, "employees", employeeId, "salaryDetails"),
          "currentSalary"
        );
        const salaryDetailsSnap = await getDoc(salaryDetailsRef);

        let salaryDetailsData = {
          earnings: {},
          deductions: {},
          attendanceDeductions: {
            halfDay: { type: "amount", value: 0, days: 0 },
            lossOfPay: { type: "amount", value: 0, days: 0 },
            absentDays: { days: 0 },
            paidLeave: { days: 0 }
          },
          advance_payments: {
            type: "amount",
            value: 0,
            deductedMonth: "",
          }
        };

        if (salaryDetailsSnap.exists()) {
          const fetchedData = salaryDetailsSnap.data();
          console.log("Salary details fetched:", fetchedData);
          salaryDetailsData = {
            ...salaryDetailsData,
            ...fetchedData,
            earnings: {
              ...salaryDetailsData.earnings,
              ...fetchedData.earnings,
            },
            attendanceDeductions: {
              ...salaryDetailsData.attendanceDeductions,
              ...fetchedData.attendanceDeductions,
            },
            advance_payments: {
              ...salaryDetailsData.advance_payments,
              ...fetchedData.advance_payments,
            },
          };
        } else {
          console.log("No salary details found for employee");
        }

        if (!employeeData.email) {
          throw new Error("Employee email not found");
        }

        if (!employeeData.companyId) {
          throw new Error("Company ID not found for employee");
        }

        const attendanceData = await fetchAttendanceData(employeeData.email, employeeData.companyId);
        console.log("Attendance data fetched:", attendanceData);
        setAttendanceSummary(attendanceData);

        const calculatedSalaryDetails = calculateSalaryBreakdown(salaryDetailsData, attendanceData);
        console.log("Calculated salary details:", calculatedSalaryDetails);
        setSalaryDetails(calculatedSalaryDetails);
      } else {
        console.error("Employee not found");
        setError("Employee not found");
      }
    } catch (err) {
      console.error("Error fetching employee data:", err);
      setError(`Failed to load employee data: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId, location.pathname]);

  const handleViewEmployee = () => {
    navigate(`/Payroll-Settings/${employeeId}`);
  };

  const handleGeneratePayslip = async () => {
    try {
      setLoading(true);
      setError("");
      
      const currentDate = new Date();
      const payslipMonth = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;

      const payslipRef = doc(collection(firestore, "employees", employeeId, "payslips"), payslipMonth);
      const existingPayslip = await getDoc(payslipRef);

      if (existingPayslip.exists()) {
        setError(`Payslip for ${payslipMonth} already exists.`);
        return;
      }

      if (!employee || !employee.companyId) {
        throw new Error("Employee or company information is missing");
      }

      const companySettingsRef = doc(firestore, "companies", employee.companyId, "company_settings", "companyDetails");
      const companySettingsSnap = await getDoc(companySettingsRef);
      const companySettings = companySettingsSnap.data() || {};

      const payslipData = {
        employeeName: employee.name || "",
        netSalary: salaryDetails.netSalary || 0,
        earnings: salaryDetails.earnings || {},
        deductions: salaryDetails.deductions || {},
        totalEarnings: salaryDetails.totalEarnings || 0,
        totalDeductions: salaryDetails.totalDeductions || 0,
        totalRegularDeductions: salaryDetails.totalDeductions || 0,
        totalAttendanceDeductions: salaryDetails.attendanceDeduction || 0,
        email: employee.email || "",
        month: payslipMonth,
        generatedAt: currentDate,
        department: employee.department?.name || "",
        designation: employee.designation?.name || "",
        joiningDate: employee.joiningDate || null,
        lopDays: attendanceSummary.lopDays || 0,
        halfDays: attendanceSummary.halfDays || 0,
        paidLeaveDays: attendanceSummary.paidLeaveDays || 0,
        absentDays: attendanceSummary.absentDays || 0,
        companyName: companySettings?.companyName || "",
        status: 'Unpaid'
      };

      if (companySettings?.logoUrl) {
        payslipData.companyLogo = companySettings.logoUrl;
      }

      if (salaryDetails.advance_payments?.value > 0 && 
          salaryDetails.advance_payments?.deductedMonth === payslipMonth) {
        payslipData.advancePayment = salaryDetails.advance_payments.value;
      }

      await setDoc(payslipRef, payslipData);

      alert("Payslip generated and stored successfully!");
    } catch (err) {
      console.error("Error generating payslip:", err);
      setError(`Failed to generate payslip: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
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
    <Container className="my-1 container-fluid d-flex flex-column min-vh-100">
      <div className="d-flex justify-content-between px-3 align-items-center mb-4">
        <div className="head-content">
          <h3>Payroll Details</h3>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/payslip" className="text-danger text-decoration-none">
                  <b>Home</b>
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Payroll Details
              </li>
            </ol>
          </nav>
        </div>
        <div>
          <Button variant="danger" onClick={handleViewEmployee}>
            <i className="bi bi-pencil"></i>
          </Button>
        </div>
      </div>

      <div className="card shadow-sm mb-3 border border-dark">
        <div className="card-header bg-light ">
          <h3 className="py-2 m-0 text-dark">
            <b>Employee Details</b>
          </h3>
        </div>
        <div className="card-body p-3 bg-light rounded">
          <p>
            <strong>Employee Name:</strong> {employee?.name}
          </p>
          <p>
            <strong>Position:</strong> {employee?.designation?.name || "N/A"}
          </p>
          <p>
            <strong>Department:</strong> {employee?.department?.name || "N/A"}
          </p>
        </div>
      </div>

      <h3 className="my-3">
        <b>Salary Breakdown</b>
      </h3>
      <div className="card shadow-sm mb-4 border border-dark">
        <div className="card-body">
          <Row>
            <Col md={6}>
              <h4 className="mb-3"><b>Earnings</b></h4>
              {Object.entries(salaryDetails.earnings).map(([key, earning]) => (
                <div className="mb-3" key={key}>
                  <p className="mb-1">
                    <strong>{key}:</strong> {
                      earning.type === "percentage" 
                        ? `${earning.value}% (₹${earning.calculatedAmount.toFixed(2)})`
                        : `₹${earning.value.toFixed(2)}`
                    }
                  </p>
                </div>
              ))}
              <div className="border-top pt-2">
                <p className="text-success">
                  <strong>Total Earnings:</strong> ₹{salaryDetails.totalEarnings.toFixed(2)}
                </p>
              </div>
            </Col>

            <Col md={6}>
              <h4 className="mb-3"><b>Deductions</b></h4>
              {Object.entries(salaryDetails.deductions).map(([key, value]) => (
                <div className="mb-3" key={key}>
                  <p className="mb-1">
                    <strong>{key}:</strong> {value.type === "percentage" ? `${value.value}%` : `₹${value.value.toFixed(2)}`}
                  </p>
                </div>
              ))}
              <div className="border-top pt-2">
                <p className="text-danger">
                  <strong>Total Deductions:</strong> ₹{salaryDetails.totalDeductions.toFixed(2)}
                </p>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      <div className="card shadow-sm mb-4 border border-dark">
        <div className="card-body">
          <Row>
            <Col md={6}>
              <h4 className="mb-3">Attendance Summary</h4>
              <p><strong>Total Working Days:</strong> {attendanceSummary.totalWorkingDays} days</p>
              <p><strong>Days Present:</strong> {attendanceSummary.daysPresent} days</p>
              <p><strong>Half Days:</strong> {attendanceSummary.halfDays} days (₹{(salaryDetails.attendanceDeductions.halfDay?.value || 0).toFixed(2)} per day)
              </p>
              <p><strong>Absent Days:</strong>
                {attendanceSummary.absentDays} days (₹{(salaryDetails.attendanceDeductions.lossOfPay?.value || 0).toFixed(2)} per day)
              </p>
              <p><strong>Paid Leave:</strong> {attendanceSummary.paidLeaveDays} days</p>
              <p><strong>Loss of Pay (LoP):</strong>
                {attendanceSummary.lopDays} days (₹{(salaryDetails.attendanceDeductions.lossOfPay?.value || 0).toFixed(2)} per day)
              </p>
              <div className="border-top pt-2">
                <p className="text-danger">
                  <strong>Attendance Deduction:</strong> ₹{salaryDetails.attendanceDeduction.toFixed(2)}
                </p>
              </div>
            </Col>
            <Col md={6}>
              <h4 className="mb-3">Advance Payment Details</h4>
              <p><strong>Advance Payment:</strong> ₹{salaryDetails.advance_payments?.value.toFixed(2)}</p>
              <p><strong>Deduction Month:</strong> {salaryDetails.advance_payments?.deductedMonth || 'Not specified'}</p>
            </Col>
          </Row>
        </div>
      </div>

      <div className="card shadow-sm mb-4 border border-dark">
        <div className="card-body">
          <h3 className="text-center text-success">
            <strong>Net Salary: ₹{salaryDetails.netSalary.toFixed(2)}</strong>
          </h3>
        </div>
      </div>

      <div className="text-center">
        <Button variant="danger" size="lg"
                onClick={handleGeneratePayslip}
                disabled={loading}>
          {loading ? 'Generating...' : 'Generate Payslip'}
        </Button>
      </div>
      <div className="mt-auto">
        <div className="small text-muted text-center py-2">
          © 2024 HRIFY. Powered by JK Global IT Solutions.
        </div>
      </div>
    </Container>
  );
}

export default Payrolldetails;