import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../auth/AuthContext';
import { FaCamera } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const CompanySettings = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [companyName, setCompanyName] = useState('');
  const [companyContact, setCompanyContact] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [logo, setLogo] = useState(null);
  const [logoUrl, setLogoUrl] = useState(''); // Keep track of logo URL
  const [loading, setLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef(null);

  const db = getFirestore();
  const storage = getStorage();

  // Default placeholder image URL (public URL)
  const defaultPlaceholderImage = 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg';

  useEffect(() => {
    if (!user) return;

    const fetchCompanyDetails = async () => {
      setLoading(true);
      const companyDoc = doc(db, 'MD', user.uid);
      const companySnapshot = await getDoc(companyDoc);
      if (companySnapshot.exists()) {
        const data = companySnapshot.data();
        setCompanyName(data.companyName || '');
        setCompanyContact(data.companyContact || '');
        setCompanyAddress(data.companyAddress || '');
        setLogoUrl(data.logoUrl || ''); // If no logo URL, use an empty string
      }
      setLoading(false);
    };

    fetchCompanyDetails();
  }, [user, db]);

  const handleLogoClick = () => {
    fileInputRef.current.click();
  };

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLogo(file);
      setLogoUrl(URL.createObjectURL(file)); // Show selected image as preview
    }
  };

  const handleSave = async () => {
    setLoading(true);
    let logoUploadUrl = logoUrl;

    if (logo) {
      // Upload the logo to Firebase Storage
      const logoRef = ref(storage, `logos/${user.uid}`);
      await uploadBytes(logoRef, logo);
      logoUploadUrl = await getDownloadURL(logoRef); // Get the URL of the uploaded image
    }

    const updatedData = {
      companyName,
      companyContact,
      companyAddress,
      logoUrl: logoUploadUrl, // Save the uploaded logo URL in Firestore
    };

    await setDoc(doc(db, 'MD', user.uid), updatedData);

    setLoading(false);
    alert('Company settings saved successfully!');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="mb-5 mx-2 d-flex flex-column min-vh-100">
      <div className="container my-2">
        <div className="rounded-3">
          <div className="d-flex justify-content-between px-1 align-items-end">
            <div className="head-content">
              <h3>Settings</h3>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/Home" className={`text-danger ${isActive('/settings')}`} style={{ textDecoration: 'none' }}>
                      <b>Home</b>
                    </Link>
                  </li>
                  <li className={`breadcrumb-item ${isActive('/Settings/CompanySettings')}`} aria-current="page">
                    Settings
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-11  ">
            <div className="card p-5 " style={{ border: '3px solid red' }}>
              <div className="card-body p-lg-4 p-0 ">
                {/* Profile Picture Upload */}
                <div className="text-center mb-4">
                  <div
                    className="position-relative d-inline-block"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onClick={handleLogoClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <div
                      className="rounded-circle overflow-hidden border"
                      style={{
                        width: '150px',
                        height: '150px',
                        margin: '0 auto',
                      }}
                    >
                      {/* Conditionally display logoUrl or fallback to placeholder */}
                      <img
                        src={logoUrl || defaultPlaceholderImage} // If logoUrl is empty, fallback to placeholder image
                        alt="Company Logo"
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => e.target.src = defaultPlaceholderImage} // Fallback to placeholder if error
                      />
                    </div>
                    {isHovering && (
                      <div
                        className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded-circle"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                      >
                        <FaCamera size={30} color="white" />
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="d-none"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  </div>
                  <div className="mt-2 text-muted">Upload Profile Picture</div>
                </div>

                {/* Form Fields */}
                <div className="mb-4">
                  <div className="mb-3">
                    <label className="form-label">Company Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter Company Name"
                      // Red border for form fields
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Company Contact</label>
                    <input
                      type="text"
                      className="form-control"
                      value={companyContact}
                      onChange={(e) => setCompanyContact(e.target.value)}
                      placeholder="Enter Contact Info"
                     // Red border for form fields
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Company Address</label>
                    <textarea
                      className="form-control"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Enter Company Address"
                      rows="3"
                     // Red border for form fields
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="button"
                  className="btn btn-danger w-100"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="small text-muted text-center py-2">
          © 2024 HRIFY. Powered by JK Global IT Solutions.
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
