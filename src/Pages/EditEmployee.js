import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { useAuth } from '../auth/AuthContext';

const EditEmployee = () => {
  const { user } = useAuth();
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for form fields
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [branch, setBranch] = useState({ name: '', docId: '' });
  const [department, setDepartment] = useState({ name: '', docId: '' });
  const [designation, setDesignation] = useState({ name: '', docId: '' });
  const [shift, setShift] = useState({ shiftName: '', docId: '', shiftStartTime: '', shiftEndTime: '', firstHalfEndTime: '', secondHalfStartTime: '' });
  const [joiningDate, setJoiningDate] = useState('');
  const [status, setStatus] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  // State for dropdown options
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!user || !employeeId) return;

      setLoading(true);
      try {
        const employeeRef = doc(firestore, 'employees', employeeId);
        const employeeSnap = await getDoc(employeeRef);
        
        if (employeeSnap.exists()) {
          const employeeData = { id: employeeSnap.id, ...employeeSnap.data() };
          setEmployee(employeeData);
          // Populate form fields
          setName(employeeData.name || '');
          setDob(employeeData.dob || '');
          setGender(employeeData.gender || '');
          setEmail(employeeData.email || '');
          setPhone(employeeData.phone || '');
          setAddress(employeeData.address || '');
          setBranch(employeeData.branch || { name: '', docId: '' });
          setDepartment(employeeData.department || { name: '', docId: '' });
          setDesignation(employeeData.designation || { name: '', docId: '' });
          setShift(employeeData.shift || { shiftName: '', docId: '', shiftStartTime: '', shiftEndTime: '', firstHalfEndTime: '', secondHalfStartTime: '' });
          setJoiningDate(employeeData.joiningDate || '');
          setStatus(employeeData.status || '');
          setAccountNumber(employeeData.bankDetails?.accountNumber || '');
          setBankName(employeeData.bankDetails?.bankName || '');
          setIfscCode(employeeData.bankDetails?.ifscCode || '');
          setBasicSalary(employeeData.earnings?.basicSalary?.value?.toString() || '');
          setUsername(employeeData.role?.email || '');
          setRole(employeeData.role?.role || '');
        } else {
          setError("Employee not found");
        }
      } catch (err) {
        setError("Error fetching employee data: " + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [user, employeeId]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!user) return;

      try {
        // Fetch branches
        const branchesSnapshot = await getDocs(collection(firestore, 'companies', user.uid, 'branches'));
        const branchesData = branchesSnapshot.docs.map(doc => ({ id: doc.id, branchName: doc.data().branchName }));
        setBranches(branchesData);

        // Fetch departments
        if (branch.docId) {
          const departmentsSnapshot = await getDocs(collection(firestore, 'companies', user.uid, 'branches', branch.docId, 'departments'));
          const departmentsData = departmentsSnapshot.docs.map(doc => ({ id: doc.id, departmentName: doc.data().departmentName }));
          setDepartments(departmentsData);
        }

        // Fetch designations
        if (branch.docId && department.docId) {
          const designationsSnapshot = await getDocs(collection(firestore, 'companies', user.uid, 'branches', branch.docId, 'departments', department.docId, 'designations'));
          const designationsData = designationsSnapshot.docs.map(doc => ({ id: doc.id, designationName: doc.data().designationName }));
          setDesignations(designationsData);
        }

        // Fetch shifts
        if (branch.docId) {
          const shiftsSnapshot = await getDocs(collection(firestore, 'companies', user.uid, 'branches', branch.docId, 'shifts'));
          const shiftsData = shiftsSnapshot.docs.map(doc => ({
            docId: doc.id,
            shiftName: doc.data().shiftName,
            shiftStartTime: doc.data().shiftStartTime,
            shiftEndTime: doc.data().shiftEndTime,
            firstHalfEndTime: doc.data().firstHalfEndTime,
            secondHalfStartTime: doc.data().secondHalfStartTime,
          }));
          setShifts(shiftsData);
        }
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, [user, branch.docId, department.docId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employee) return;

    setLoading(true);
    try {
      const employeeRef = doc(firestore, 'employees', employeeId);
      const updatedEmployee = {
        name,
        dob,
        gender,
        email,
        phone,
        address,
        branch,
        department,
        designation,
        shift,
        joiningDate,
        status,
        bankDetails: {
          accountNumber,
          bankName,
          ifscCode,
        },
        earnings: {
          basicSalary: {
            type: 'amount',
            value: parseFloat(basicSalary) || 0,
          },
        },
        role: {
          email: username,
          role,
        },
      };

      await updateDoc(employeeRef, updatedEmployee);
      navigate('/employee');
    } catch (err) {
      setError("Error updating employee data: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container my-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="container my-5">
        <div className="alert alert-warning" role="alert">
          No employee data found
        </div>
      </div>
    );
  }

  return (
    <div className="container my-3 d-flex flex-column min-vh-100">
      <div className="container-fluid">
        <div className="rounded-3">
          <div className="d-flex justify-content-between px-3 align-items-end">
            <div className="head-content">
              <h3>Edit Employee Details</h3>
              <nav style={{
                '--bs-breadcrumb-divider': "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"8\" height=\"8\"%3E%3Cpath d=\"M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z\" fill=\"currentColor\"/%3E%3C/svg%3E')",
              }} aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item active text-danger" aria-current="page">
                    <Link className="text-decoration-none text-danger" to="/employee"><b>Home</b></Link>
                  </li>
                  <li className="breadcrumb-item active text-danger" aria-current="page">
                    <b>Employee</b>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">Edit Employee</li>
                </ol>
              </nav>
            </div>
          </div>
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
                          >
                            <option>Male</option>
                            <option>Female</option>
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
                            onChange={(e) => {
                              setEmail(e.target.value);
                              setUsername(e.target.value);
                            }}
                          />
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="phone" className="form-label">
                            Phone<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="phone"
                            placeholder="Enter employee phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
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
                          >
                            <option value="">Select Branch</option>
                            {branches.map((branchOption) => (
                              <option key={branchOption.id} value={branchOption.id}>
                                {branchOption.branchName}
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
                          >
                            <option value="">Select Designation</option>
                            {designations.map((desig) => (
                              <option key={desig.id} value={desig.id}>
                                {desig.designationName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6 d-none">
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
                          >
                            <option value="">Select Shift</option>
                            {shifts.map((shiftOption) => (
                              <option key={shiftOption.docId} value={shiftOption.docId}>
                                {shiftOption.shiftName} - {shiftOption.shiftStartTime} to {shiftOption.shiftEndTime}
                              </option>
                            ))}
                          </select>
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
                          >
                            <option>Active</option>
                            <option>Inactive</option>
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
                          />
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
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="basicSalary" className="form-label">
                            Basic Salary<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="basicSalary"
                            placeholder="Enter basic salary"
                            value={basicSalary}
                            onChange={(e) => setBasicSalary(e.target.value)}
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
                          <label htmlFor="username" className="form-label">
                            Username<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="username"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="password" className="form-label">
                            Password<span className="text-danger">*</span>
                          </label>
                          <input
                            type="password"
                            className="form-control"
                            id="password"
                            placeholder="Enter new password if changing"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="role" className="form-label">
                            Role<span className="text-danger">*</span>
                          </label>
                          <select
                            id="role"
                            className="form-select"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                          >
                            <option>Employee</option>
                            <option>Admin</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary mt-3">
                    Update
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

export default EditEmployee;