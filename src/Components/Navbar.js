import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { logo } from '../assets/images';
import { signOut } from 'firebase/auth';
import { auth, firestore } from '../firebase/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const defaultImage = "https://tse1.mm.bing.net/th?id=OIP.bJpr9jpclIkXQT-hkkb1KQHaHa&pid=Api&rs=1&c=1&qlt=95&w=114&h=114";
  const [profileImage, setProfileImage] = useState(defaultImage);

  useEffect(() => {
    let unsubscribe = () => {};

    const setupProfileImageListener = () => {
      const user = auth.currentUser;
      if (user) {
        const companyDetailsRef = doc(firestore, 'companies', user.uid, 'company_settings', 'companyDetails');
        
        unsubscribe = onSnapshot(companyDetailsRef, (doc) => {
          if (doc.exists() && doc.data().logoUrl) {
            setProfileImage(doc.data().logoUrl);
          } else {
            setProfileImage(defaultImage);
          }
        }, (error) => {
          console.error("Error listening to profile image changes: ", error);
          setProfileImage(defaultImage);
        });
      }
    };

    setupProfileImageListener();

    return () => unsubscribe();
  }, []);

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
    <nav className="navbar navbar-dark">
      <div className="container-fluid">
        <button className="navbar-toggler d-md-none" type="button" onClick={toggleSidebar}>
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="navbar-brand mx-auto d-md-none">
          <img src={logo} className="custom-logo" height="50px" alt="Logo" />
        </div>
        <div className="ms-auto">
          <div className="dropdown">
            <img
              src={profileImage}
              alt="Profile"
              className="profile-icon dropdown-toggle"
              id="profileDropdown"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              onError={(e) => {
                e.currentTarget.src = defaultImage;
              }}
            />
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
              <li>
                <Link to="/Settings" className='dropdown-item text-dark text-decoration-none'>
                  <i className="fa-solid fa-gear"></i> Settings
                </Link>
              </li>
              <li>
                <button className="dropdown-item" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;