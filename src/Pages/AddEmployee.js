import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, getDocs, getDoc, query, where } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { useAuth } from '../auth/AuthContext';

const AddEmployee = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [branch, setBranch] = useState({ name: '', docId: '' });
  const [department, setDepartment] = useState({ name: '', docId: '' });
  const [designation, setDesignation] = useState({ name: '', docId: '' });
  const [shift, setShift] = useState({
    shiftName: '',
    docId: '',
    shiftStartTime: '',
    shiftEndTime: '',
    firstHalfEndTime: '',
    secondHalfStartTime: ''
  });
  const [joiningDate, setJoiningDate] = useState('');
  const [status, setStatus] = useState('Active');
  const [role, setRole] = useState('Employee');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      if (user) {
        try {
          const branchesSnapshot = await getDocs(
            collection(firestore, 'companies', user.uid, 'branches')
          );
          const branchOptions = branchesSnapshot.docs.map((doc) => ({
            id: doc.id,
            branchName: doc.data().branchName,
          }));
          setBranches(branchOptions);
        } catch (error) {
          console.error('Error fetching branches: ', error);
        }
      }
    };

    fetchBranches();
  }, [user]);

  useEffect(() => {
    const fetchDepartments = async () => {
      if (user && branch.docId) {
        try {
          const departmentsSnapshot = await getDocs(
            collection(firestore, 'companies', user.uid, 'branches', branch.docId, 'departments')
          );
          const departmentOptions = departmentsSnapshot.docs.map((doc) => ({
            id: doc.id,
            departmentName: doc.data().departmentName,
          }));
          setDepartments(departmentOptions);
        } catch (error) {
          console.error('Error fetching departments: ', error);
        }
      } else {
        setDepartments([]);
        setDesignations([]);
      }
    };

    fetchDepartments();
  }, [user, branch]);

  useEffect(() => {
    const fetchDesignations = async () => {
      if (user && branch.docId && department.docId) {
        try {
          const designationsSnapshot = await getDocs(
            collection(
              firestore,
              'companies',
              user.uid,
              'branches',
              branch.docId,
              'departments',
              department.docId,
              'designations'
            )
          );
          const designationOptions = designationsSnapshot.docs.map((doc) => ({
            id: doc.id,
            designationName: doc.data().designationName,
          }));
          setDesignations(designationOptions);
        } catch (error) {
          console.error('Error fetching designations: ', error);
        }
      } else {
        setDesignations([]);
      }
    };

    fetchDesignations();
  }, [user, branch, department]);

  useEffect(() => {
    const fetchShifts = async () => {
      if (user && branch.docId) {
        try {
          const shiftsSnapshot = await getDocs(
            collection(firestore, 'companies', user.uid, 'branches', branch.docId, 'shifts')
          );
          const shiftOptions = shiftsSnapshot.docs.map((doc) => ({
            docId: doc.id,
            shiftName: doc.data().shiftName,
            shiftStartTime: doc.data().shiftStartTime,
            shiftEndTime: doc.data().shiftEndTime,
            firstHalfEndTime: doc.data().firstHalfEndTime,
            secondHalfStartTime: doc.data().secondHalfStartTime,
          }));
          setShifts(shiftOptions);
        } catch (error) {
          console.error('Error fetching shifts: ', error);
        }
      } else {
        setShifts([]);
      }
    };

    fetchShifts();
  }, [user, branch]);

  const checkEmployeeLimit = async () => {
    if (!user) return false;

    try {
      const companySettingsRef = doc(firestore, 'companies', user.uid, 'company_settings', 'companyDetails');
      const companySettingsSnapshot = await getDoc(companySettingsRef);
      const companySettingsData = companySettingsSnapshot.data();

      if (!companySettingsData || !companySettingsData.totalEmployees) {
        throw new Error('Total employees limit not found in company settings');
      }

      const totalEmployeeLimit = parseInt(companySettingsData.totalEmployees, 10);

      if (isNaN(totalEmployeeLimit)) {
        throw new Error('Invalid total employees limit');
      }

      const employeesQuery = query(collection(firestore, 'employees'), where("companyId", "==", user.uid));
      const employeesSnapshot = await getDocs(employeesQuery);
      const currentEmployeeCount = employeesSnapshot.docs.length;

      if (currentEmployeeCount < totalEmployeeLimit) {
        return true;
      } else {
        showLimitReachedDialog();
        return false;
      }
    } catch (error) {
      console.error('Error checking employee limit:', error);
      return false;
    }
  };

  const showLimitReachedDialog = () => {
    alert('Employee limit reached. Please contact HRiFY office for further assistance.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      console.error('No user logged in');
      return;
    }

    setSuccessMessage('');
    setErrorMessage('');
    setIsLoading(true);

    try {
      const canAddEmployee = await checkEmployeeLimit();
      if (!canAddEmployee) {
        setIsLoading(false);
        return;
      }

      // Use the Firebase REST API to create a new user
      const firebaseApiKey = 'AIzaSyDVNBbUzBw4_Mz-FWrlvqmM8E_xQa5kczY';
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: password,
            returnSecureToken: false,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message);
      }

      // Prepare employee data
      const employeeData = {
        companyId: user.uid,
        name,
        dob,
        gender,
        email,
        phone,
        address,
        branch: {
          docId: branch.docId,
          name: branch.name,
        },
        department: {
          docId: department.docId,
          name: department.name,
        },
        designation: {
          docId: designation.docId,
          name: designation.name,
        },
        shift: {
          docId: shift.docId,
          name: shift.shiftName,
          shiftStartTime: shift.shiftStartTime,
          shiftEndTime: shift.shiftEndTime,
          firstHalfEndTime: shift.firstHalfEndTime,
          secondHalfStartTime: shift.secondHalfStartTime,
        },
        joiningDate,
        status,
        bankDetails: {
          bankName,
          accountNumber,
          ifscCode,
        },
        earnings: {
          basicSalary: {
            type: "amount",
            value: parseFloat(basicSalary) || 0,
          },
        },
        role: {
          email,
          role,
        },
      };

      // Add the employee's information to Firestore
      await setDoc(doc(firestore, 'employees', email), employeeData);

      console.log('Employee added successfully');
      setSuccessMessage('Employee added successfully!');

      // Reset form fields
      setName('');
      setDob('');
      setGender('Male');
      setEmail('');
      setPhone('');
      setAddress('');
      setBranch({ name: '', docId: '' });
      setDepartment({ name: '', docId: '' });
      setDesignation({ name: '', docId: '' });
      setShift({
        shiftName: '',
        docId: '',
        shiftStartTime: '',
        shiftEndTime: '',
        firstHalfEndTime: '',
        secondHalfStartTime: ''
      });
      setJoiningDate('');
      setStatus('Active');
      setRole('Employee');
      setPassword('');
      setAccountNumber('');
      setBankName('');
      setIfscCode('');
      setBasicSalary('');

    } catch (error) {
      console.error('Error adding employee: ', error);
      setErrorMessage(`Error adding employee: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container my-3 d-flex flex-column min-vh-100">
      <div className="container-fluid">
        <div className="rounded-3">
          <div className="d-flex justify-content-between px-3 align-items-end">
            <div className="head-content">
              <h3>Create Employee</h3>
              <nav
                style={{
                  '--bs-breadcrumb-divider':
                    "url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%278%27 height=%278%27%3E%3Cpath d=%27M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z%27 fill=%27currentColor%27/%3E%3C/svg%3E')",
                }}
                aria-label="breadcrumb"
              >
                <ol className="breadcrumb">
                  <li className="breadcrumb-item active text-danger" aria-current="page">
                    <Link className="text-decoration-none text-danger" to="/employee">
                      <b>Home</b>
                    </Link>
                  </li>
                  <li className="breadcrumb-item active text-danger" aria-current="page">
                    <b>Employee</b>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Create Employee
                  </li>
                </ol>
              </nav>
            </div>
          </div>

          {successMessage && (
            <div className="alert alert-success mt-3" role="alert">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="alert alert-danger mt-3" role="alert">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-12">
                <div className="container-fluid">
                  <div className="card mt-4">
                    <div className="card-header">Personal Information</div>
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="name" className="form-label">
                            Name<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="name"
                            placeholder="Enter employee name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="dob" className="form-label">
                            Date of Birth<span className="text-danger">*</span>
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            id="dob"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="gender" className="form-label">
                            Gender<span className="text-danger">*</span>
                          </label>
                          <select
                            id="gender"
                            className="form-select"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            required
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="email" className="form-label">
                            Email<span className="text-danger">*</span>
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            placeholder="Enter employee email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="phone" className="form-label">
                            Phone<span className="text-danger">*</span>
                          </label>
                          <input
                            type="tel"
                            className="form-control"
                            id="phone"
                            placeholder="Enter employee phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="address" className="form-label">
                            Address<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="address"
                            placeholder="Enter employee address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card mt-4">
                    <div className="card-header">Job Details</div>
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="branch" className="form-label">
                            Branch<span className="text-danger">*</span>
                          </label>
                          <select
                            id="branch"
                            className="form-select"
                            value={branch.docId}
                            onChange={(e) =>
                              setBranch({
                                docId: e.target.value,
                                name: e.target.options[e.target.selectedIndex].text,
                              })
                            }
                            required
                          >
                            <option value="">Select Branch</option>
                            {branches.map((branch) => (
                              <option key={branch.id} value={branch.id}>
                                {branch.branchName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="department" className="form-label">
                            Department<span className="text-danger">*</span>
                          </label>
                          <select
                            id="department"
                            className="form-select"
                            value={department.docId}
                            onChange={(e) =>
                              setDepartment({
                                docId: e.target.value,
                                name: e.target.options[e.target.selectedIndex].text,
                              })
                            }
                            required
                          >
                            <option value="">Select Department</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.departmentName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="designation" className="form-label">
                            Designation<span className="text-danger">*</span>
                          </label>
                          <select
                            id="designation"
                            className="form-select"
                            value={designation.docId}
                            onChange={(e) => {
                              const selectedDesignation = designations.find(
                                (desig) => desig.id === e.target.value
                              );
                              setDesignation({
                                name: selectedDesignation?.designationName || '',
                                docId: e.target.value,
                              });
                            }}
                            required
                          >
                            <option value="">Select Designation</option>
                            {designations.map((desig) => (
                              <option key={desig.id} value={desig.id}>
                                {desig.designationName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="shift" className="form-label">
                            Shift<span className="text-danger">*</span>
                          </label>
                          <select
                            id="shift"
                            className="form-select"
                            value={shift.docId}
                            onChange={(e) => {
                              const selectedShift = shifts.find(
                                (s) => s.docId === e.target.value
                              );
                              setShift({
                                shiftName: selectedShift?.shiftName || '',
                                docId: e.target.value,
                                shiftStartTime: selectedShift?.shiftStartTime || '',
                                shiftEndTime: selectedShift?.shiftEndTime || '',
                                firstHalfEndTime: selectedShift?.firstHalfEndTime || '',
                                secondHalfStartTime: selectedShift?.secondHalfStartTime || '',
                              });
                            }}
                            required
                          >
                            <option value="">Select Shift</option>
                            {shifts.map((shiftOption) => (
                              <option key={shiftOption.docId} value={shiftOption.docId}>
                                {shiftOption.shiftName} - {shiftOption.shiftStartTime} to {shiftOption.shiftEndTime}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="joiningDate" className="form-label">
                            Joining Date<span className="text-danger">*</span>
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            id="joiningDate"
                            value={joiningDate}
                            onChange={(e) => setJoiningDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="status" className="form-label">
                            Status<span className="text-danger">*</span>
                          </label>
                          <select
                            id="status"
                            className="form-select"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            required
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card mt-4">
                    <div className="card-header">Bank Details</div>
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="accountNumber" className="form-label">
                            Account Number<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="accountNumber"
                            placeholder="Enter account number"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="bankName" className="form-label">
                            Bank Name<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="bankName"
                            placeholder="Enter bank name"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="ifscCode" className="form-label">
                            IFSC Code<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="ifscCode"
                            placeholder="Enter IFSC code"
                            value={ifscCode}
                            onChange={(e) => setIfscCode(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="basicSalary" className="form-label">
                            Basic Salary<span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            id="basicSalary"
                            placeholder="Enter basic salary"
                            value={basicSalary}
                            onChange={(e) => setBasicSalary(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card mt-4">
                    <div className="card-header">Account Information</div>
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="password" className="form-label">
                            Password<span className="text-danger">*</span>
                          </label>
                          <input
                            type="password"
                            className="form-control"
                            id="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="role" className="form-label">
                            Role<span className="text-danger">*</span>
                          </label>
                          <select
                            id="role"
                            className="form-select"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            required
                          >
                            <option value="Employee">Employee</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary mt-3" disabled={isLoading}>
                    {isLoading ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </form>
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

export default AddEmployee;