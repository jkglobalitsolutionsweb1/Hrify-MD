import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Modal, Button, Form, Card } from 'react-bootstrap';
import { FaUserCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { firestore, storage, auth } from '../firebase/firebase';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

const Companies = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyContact: '',
    companyAddress: '',
    email: '',
    password: '',
    confirmPassword: '',
    logoUrl: null,
    totalEmployees: '',
    status: 'active'
  });
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const companiesSnapshot = await getDocs(collection(firestore, "companies"));
      const companiesData = await Promise.all(
        companiesSnapshot.docs.map(async (companyDoc) => {
          const companyId = companyDoc.id;
          const companyDetailsDoc = await getDoc(doc(firestore, 'companies', companyId, 'company_settings', 'companyDetails'));
          if (companyDetailsDoc.exists()) {
            const companyData = companyDetailsDoc.data();
            if (companyData.logoUrl) {
              try {
                const logoUrl = await getDownloadURL(ref(storage, `logos/${companyData.logoUrl}`));
                return { id: companyId, ...companyData, logoUrl };
              } catch (error) {
                console.error("Error fetching logo:", error);
                return { id: companyId, ...companyData };
              }
            }
            return { id: companyId, ...companyData };
          } else {
            console.warn(`No details found for company ${companyId}`);
            return null;
          }
        })
      );
      const validCompaniesData = companiesData.filter(company => company !== null);
      setEmployees(validCompaniesData);
    } catch (error) {
      console.error("Error fetching companies: ", error);
    }
  };

  const handleShowAddModal = () => setShowAddModal(true);
  const handleCloseAddModal = () => {
    setShowAddModal(false);
    resetFormData();
  };

  const handleShowProfileModal = (company) => {
    setSelectedEmployee(company);
    setFormData({
      companyName: company.companyName,
      companyContact: company.companyContact,
      companyAddress: company.companyAddress,
      email: company.email,
      logoUrl: company.logoUrl,
      totalEmployees: company.totalEmployees || '',
      status: company.status || 'active'
    });
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedEmployee(null);
    resetFormData();
  };

  const resetFormData = () => {
    setFormData({
      companyName: '',
      companyContact: '',
      companyAddress: '',
      email: '',
      password: '',
      confirmPassword: '',
      logoUrl: null,
      totalEmployees: '',
      status: 'active'
    });
    setPasswordError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: value 
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const storageRef = ref(storage, `logos/${selectedEmployee.id}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        const companyRef = doc(firestore, "companies", selectedEmployee.id, "company_settings", "companyDetails");
        await updateDoc(companyRef, { logoUrl: `${selectedEmployee.id}_${file.name}` });
        
        setFormData({ ...formData, logoUrl: downloadURL });
        
        const updatedEmployees = employees.map(emp =>
          emp.id === selectedEmployee.id ? { ...emp, logoUrl: downloadURL } : emp
        );
        setEmployees(updatedEmployees);
      } catch (error) {
        console.error("Error uploading image: ", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    try {
      // Use the Firebase REST API to create a new user
      const firebaseApiKey = 'AIzaSyBpKGYSyRl9RG-QQX6C0O__DqAo0DV0Sj8';
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            returnSecureToken: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message);
      }

      const userData = await response.json();
      const { localId: uid } = userData;

      const { confirmPassword, password, ...companyData } = formData;

      const companyRef = doc(firestore, "companies", uid);
      await setDoc(companyRef, { 
        createdAt: new Date(),
        uid: uid
      });

      const companySettingsRef = doc(firestore, "companies", uid, "company_settings", "companyDetails");
      await setDoc(companySettingsRef, companyData);

      const newCompany = { id: uid, ...companyData };
      setEmployees([...employees, newCompany]);
      handleCloseAddModal();
    } catch (error) {
      console.error("Error adding company: ", error);
      setPasswordError(error.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const companyRef = doc(firestore, "companies", selectedEmployee.id, "company_settings", "companyDetails");
      await updateDoc(companyRef, {
        companyName: formData.companyName,
        companyContact: formData.companyContact,
        companyAddress: formData.companyAddress,
        totalEmployees: formData.totalEmployees,
        status: formData.status
      });
      
      // Update user's disabled status in Firebase Authentication
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, {
          displayName: formData.companyName
        });

        // Disable or enable the user account based on the status
        await fetch('/api/updateUserStatus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: selectedEmployee.id,
            status: formData.status,
          }),
        });
      }

      const updatedEmployees = employees.map(emp =>
        emp.id === selectedEmployee.id ? { ...emp, ...formData } : emp
      );
      setEmployees(updatedEmployees);
      setSelectedEmployee({ ...selectedEmployee, ...formData });
      handleCloseProfileModal();
    } catch (error) {
      console.error("Error updating company: ", error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="container-fluid my-3 d-flex flex-column min-vh-100">
      <div className="d-flex justify-content-between px-3 align-items-end">
        <div className="head-content">
          <h3>Companies</h3>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/dashboard" className="text-danger" style={{ textDecoration: 'none' }}>
                  <b>Home</b>
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Companies
              </li>
            </ol>
          </nav>
        </div>
      </div>
      <div className="row">
        <div className="col-12 text-end">
          <button 
            className="align-items-center text-end bg-danger text-light fw-bold p-1 px-2 py-2 rounded" 
            style={{ border: 'none' }}
            onClick={handleShowAddModal}
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>

      <Modal show={showAddModal} onHide={handleCloseAddModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Company</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Company Name</Form.Label>
              <Form.Control
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Company Contact</Form.Label>
              <Form.Control
                type="text"
                name="companyContact"
                value={formData.companyContact}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Company Address</Form.Label>
              <Form.Control
                type="text"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Maximum Employees</Form.Label>
              <Form.Control
                type="number"
                name="totalEmployees"
                value={formData.totalEmployees}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <div className="input-group">
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <Button 
                  variant="outline-secondary" 
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <div className="input-group">
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                <Button 
                  variant="outline-secondary" 
                  onClick={toggleConfirmPasswordVisibility}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </div>
            </Form.Group>
            {passwordError && <p className="text-danger">{passwordError}</p>}
            <Button variant="danger" type="submit">
              Add Company
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showProfileModal} onHide={handleCloseProfileModal}>
        <Modal.Header closeButton className="">
          <Modal.Title>Company Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body className={formData.status === 'active' ? '' : 'bg-secondary'}>
          {selectedEmployee && (
            <Card className="border-0">
              <Card.Body>
                <div 
                  className="text-center mb-3 position-relative"
                  style={{ width: '100px', height: '100px', margin: '0 auto' }}
                >
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <FaUserCircle size={100} style={{ width: '100%', height: '100%' }} />
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                  <button
                    onClick={() => fileInputRef.current.click()}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '50%',
                      padding: '5px'
                    }}
                  >
                    <i className="fas fa-camera"></i>
                  </button>
                </div>
                <Form onSubmit={handleUpdate}>
                  <Form.Group className="mb-3">
                    <Form.Label>Company Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      readOnly
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Company Contact</Form.Label>
                    <Form.Control
                      type="text"
                      name="companyContact"
                      value={formData.companyContact}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Company Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Maximum Employees</Form.Label>
                    <Form.Control
                      type="number"
                      name="totalEmployees"
                      value={formData.totalEmployees}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Control
                      as="select"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Control>
                  </Form.Group>
                  <div className="d-flex justify-content-between">
                    <Button variant="warning text-light" type="submit">
                      Update Profile
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
      </Modal>

      <div className="row mt-4">
        {employees.map((company) => (
          <div key={company.id} className="col-lg-3 col-md-4 col-sm-6 mb-3">
            <Card 
              onClick={() => handleShowProfileModal(company)} 
              style={{ 
                cursor: 'pointer',
                backgroundColor: company.status !== 'inactive' ? "red" : "gray",
                aspectRatio: '1 / 1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out'
              }}
              className="company-card"
            >
              <Card.Body className="text-center d-flex flex-column justify-content-center align-items-center">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt="Company Logo" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '50%', marginBottom: '8px' }} />
                ) : (
                  <FaUserCircle size={48} className="mb-2 text-light" />
                )}
                <Card.Title className='text-light'>{company.companyName}</Card.Title>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      <style jsx>{`
        .company-card:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default Companies;