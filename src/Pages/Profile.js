import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const AccountSettings = () => {
  const [activeSection, setActiveSection] = useState('');
  const [ setAvatar] = useState(null); // State to hold the selected image
  const [avatarPreview, setAvatarPreview] = useState(''); // State to hold the image preview URL

  // Scroll Event Listener to detect the active section
  useEffect(() => {
    const handleScroll = () => {
      const personalInfoSection = document.getElementById('personal-info');
      const changePasswordSection = document.getElementById('change-password');

      const personalInfoPosition = personalInfoSection.getBoundingClientRect().top;
      const changePasswordPosition = changePasswordSection.getBoundingClientRect().top;

      if (personalInfoPosition < 200 && personalInfoPosition >= -personalInfoSection.clientHeight) {
        setActiveSection('personal-info');
      } else if (changePasswordPosition < 200 && changePasswordPosition >= -changePasswordSection.clientHeight) {
        setActiveSection('change-password');
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Function to handle file selection
  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file)); // Create a preview URL
    }
  };

  return (
    <div className="container my-5 d-flex flex-column min-vh-100">
      <div className="row">
      <div className="container d-flex justify-content-between px-3 align-items-end">
        <div className="head-content">
            <h3>Company Settings</h3>
            <nav
                style={{
                    "--bs-breadcrumb-divider":
                        'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'8\'%3E%3Cpath d=\'M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z\' fill=\'currentColor\'/%3E%3C/svg%3E")',
                }}
                aria-label="breadcrumb"
            >
                <ol className="breadcrumb">
                    <li className="breadcrumb-item active text-danger" aria-current="page">
                        <b>Home</b>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                    Profile
                    </li>
                </ol>
            </nav>
        </div>
        <div className="button text-end m-2 mx-1 d-none">
            <a href="Add Employee.html">
                <button
                    className="align-items-center text-end bg-danger text-light fw-bold p-1 px-2 rounded"
                    style={{ border: "none" }}
                    data-bs-toggle="tooltip"
                    data-bs-placement="right"
                    title="CREATE"
                >
                    <b>
                        <i className="fa-solid fa-filter"></i>
                    </b>
                </button>
            </a>
        </div>
      </div>
        {/* Left Column - Navigation Menu */}
        <div className="col-md-3">
          <div className="list-group sticky-top" style={{ top: '20px' }}>
            <a
              href="#personal-info"
              className={`list-group-item list-group-item-action ${
                activeSection === 'personal-info' ? 'active' : ''
              }`}
            >
              Personal Info
            </a>
            <a
              href="#change-password"
              className={`list-group-item list-group-item-action ${
                activeSection === 'change-password' ? 'active' : ''
              }`}
            >
              Change Password
            </a>
          </div>
        </div>

        {/* Right Column - Forms */}
        <div className="col-md-9">
          {/* Personal Information Section */}
          <div id="personal-info" className="card mb-4" style={{ border: '1px solid #ff0000' }}>
            <div className="card-header border-2" style={{ borderBottom: '2px solid #ff0000', backgroundColor: 'white', color: 'black' }}>
              <h5>Personal Information</h5>
              <p>Details about your personal information</p>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6 d-flex justify-content-center">
                    {avatarPreview && (
                        <div className="mb-3">
                        <h6>Image Preview:</h6>
                        <img src={avatarPreview} alt="Avatar Preview" className='rounded-pill' height={'125px'} />
                        </div>
                    )}
                </div>
                <div className="col-md-6">
                    <div className="mb-3">
                        <label className="form-label" style={{ color: 'black' }}>Avatar</label>
                        <input type="file" className="form-control col-6" onChange={handleAvatarChange} />
                        <small className="text-muted">Please upload a valid image file. Size of the image should not exceed 2MB.</small>
                    </div>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label" style={{ color: 'black' }}>
                    Name<span className="text-danger">*</span>
                  </label>
                  <input type="text" className="form-control" placeholder="Rajodiya Infotech" />
                </div>
                <div className="col-md-6">
                  <label className="form-label" style={{ color: 'black' }}>
                    Email<span className="text-danger">*</span>
                  </label>
                  <input type="email" className="form-control" placeholder="company@example.com" />
                </div>
              </div>
              <button className="btn btn-danger">Save Changes</button>
            </div>
          </div>

          {/* Change Password Section */}
          <div id="change-password" className="card" style={{ border: '1px solid #ff0000' }}>
            <div className="card-header border-2" style={{ borderBottom: '2px solid #ff0000', backgroundColor: 'white', color: 'black' }}>
              <h5>Change Password</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label" style={{ color: 'black' }}>
                    Current Password<span className="text-danger">*</span>
                  </label>
                  <input type="password" className="form-control" placeholder="Enter Current Password" />
                </div>
                <div className="col-md-4">
                  <label className="form-label" style={{ color: 'black' }}>
                    New Password<span className="text-danger">*</span>
                  </label>
                  <input type="password" className="form-control" placeholder="Enter New Password" />
                </div>
                <div className="col-md-4">
                  <label className="form-label" style={{ color: 'black' }}>
                    Re-type New Password<span className="text-danger">*</span>
                  </label>
                  <input type="password" className="form-control" placeholder="Enter Re-type New Password" />
                </div>
              </div>
              <button className="btn btn-danger">Save Change</button>
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

export default AccountSettings;
