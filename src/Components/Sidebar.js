import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logo, Attendance, DashboardLogo, EmployeeLogo, department, leave, Payroll, Payrollicon } from '../assets/images';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error("Logout error: ", error);
    }
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={toggleSidebar}></div>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src={logo} className="App-logo" alt="logo" />
        </div>
        <ul className="nav flex-column mt-1">
          <li className="nav-item my-1">
            <Link 
              className={`nav-link p-3 ${location.pathname === '/dashboard' ? 'active' : ''}`} 
              to="/dashboard" 
              onClick={toggleSidebar}
            >
              <img src={DashboardLogo} style={{ padding: '2px' }} height="20px" alt="" /> Dashboard
            </Link>
          </li>
          <li className="nav-item my-1">
            <Link 
              className={`nav-link p-3 ${location.pathname === '/Companies' || location.pathname.startsWith('/EditEmployee') || location.pathname.startsWith('/AddEmployee') ? 'active' : ''}`} 
              to="/Companies" 
              onClick={toggleSidebar}
            >
              <img src={EmployeeLogo} style={{ padding: '2px' }} height="20px" alt="" /> Companies
            </Link>
          </li>     
          <li className="nav-item my-1">
            <Link 
              className={`nav-link p-3 ${location.pathname === '/settings' }) ? 'active' : ''}`} 
              to="/settings" 
              onClick={toggleSidebar}
            >
               <i className="fa-solid fa-gear"></i> Settings
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link p-3" to="" onClick={handleLogout}> 
               <i className="fas fa-sign-out-alt"></i> Logout
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;