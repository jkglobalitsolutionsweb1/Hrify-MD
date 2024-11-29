import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { useLocation } from 'react-router-dom';
import Sidebar from './Components/Sidebar';
import Navbar from './Components/Navbar';
import ProtectedRoute from './ProtectedRoute';
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import Profile from './Pages/Profile';
import Companies from './Pages/Companies';
import Attendance from './Pages/Attendance';
import Department from './Pages/Department';
import Leave from './Pages/Leave';
import Payroll from './Pages/Settings/ParyollSettings/Payroll';
import PayrollRoute from './Pages/PayslipSettings/PayrollRoute';
import PayslipReports from './Pages/PayslipSettings/PayslipReports';
import Payslipscreen from './Pages/PayslipSettings/Payslipscreen';
import Payslip from './Pages/PayslipSettings/Payslip';
import Payrolldetails from './Pages/PayslipSettings/Payrolldetails';
import AddEmployee from './Pages/AddEmployee';
import EditEmployee from './Pages/EditEmployee';
import EmployeeSetSalary from './Pages/EmployeeSetSalary';
import CompanySettings from './Pages/Settings/CompanySettings';
import OrganizationSettings from './Pages/Settings/OrganizationSettings';
import PayrollSettings from './Pages/Settings/ParyollSettings/PayrollSettings';
import CompanyTermsPolicies from './Pages/Settings/CompanyTermsPolicies';
import Test from './Pages/Testproject';
import Settings from './Pages/Settings';
import ShiftSettings from './Pages/Settings/OrganizationSettings/ShiftSettings';
import Branches from './Pages/Settings/OrganizationSettings/Branches';
import Departments from './Pages/Settings/OrganizationSettings/Departments';
import EmployeeDesignation from './Pages/Settings/OrganizationSettings/EmployeeDesignation';
import './styles/global.css';
import TestSettings from './Pages/TestSettings';

function Layout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const isLoginPage = location.pathname === '/login';

  return (
    <div className="App">
      {!isLoginPage && <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />}
      <div className={!isLoginPage ? "content" : ""}>
        {!isLoginPage && <Navbar toggleSidebar={toggleSidebar} />}
        <div className="main-content">{children}</div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/Companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/leave" element={<ProtectedRoute><Leave /></ProtectedRoute>} />
            <Route path="/department" element={<ProtectedRoute><Department /></ProtectedRoute>} />
            <Route path="/payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
            <Route path="/payslip" element={<ProtectedRoute><Payslip /></ProtectedRoute>} />
            <Route path="/PayrollRoute" element={<ProtectedRoute><PayrollRoute /></ProtectedRoute>} />
            <Route path="/PayslipReports" element={<ProtectedRoute><PayslipReports /></ProtectedRoute>} />
            <Route path="/payslip-screen/:employeeId/:month" element={<ProtectedRoute><Payslipscreen /></ProtectedRoute>} />
            <Route path="/addEmployee" element={<ProtectedRoute><AddEmployee /></ProtectedRoute>} />
            <Route path="/editEmployee/:employeeId" element={<ProtectedRoute><EditEmployee /></ProtectedRoute>} />
            <Route path="/employeeSetSalary" element={<ProtectedRoute><EmployeeSetSalary /></ProtectedRoute>} />
            <Route path="/Company-Settings" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
            <Route path="/Organization-Settings" element={<ProtectedRoute><OrganizationSettings /></ProtectedRoute>} />
            <Route path="/Payroll-Settings/:employeeId" element={<ProtectedRoute><PayrollSettings /></ProtectedRoute>} />
            <Route path="/Payrolldetails/:employeeId" element={<ProtectedRoute><Payrolldetails /></ProtectedRoute>} />
            <Route path="/Company-Terms-Policies" element={<ProtectedRoute><CompanyTermsPolicies /></ProtectedRoute>} />
            <Route path="/Test" element={<ProtectedRoute><Test /></ProtectedRoute>} />
            <Route path="/Settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/Shift-Settings" element={<ProtectedRoute><ShiftSettings /></ProtectedRoute>} />
            <Route path="/branches" element={<ProtectedRoute><Branches /></ProtectedRoute>} />
            <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
            <Route path="/employee-designation" element={<ProtectedRoute><EmployeeDesignation /></ProtectedRoute>} />
            <Route path="/testsettings" element={<ProtectedRoute><TestSettings/></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;