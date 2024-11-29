import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../auth/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import DatePicker from 'react-multi-date-picker';
import { Timestamp } from 'firebase/firestore';
import 'react-multi-date-picker/styles/colors/red.css';

const CompanySettings = () => {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [companyContact, setCompanyContact] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [logo, setLogo] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [workingDays, setWorkingDays] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [initialData, setInitialData] = useState({});

  const db = getFirestore();
  const storage = getStorage();

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (!user) return;

    const fetchCompanyDetails = async () => {
      setLoading(true);
      const companyDoc = doc(db, 'companies', user.uid, 'company_settings', 'companyDetails');
      const companySnapshot = await getDoc(companyDoc);
      if (companySnapshot.exists()) {
        const data = companySnapshot.data();
        setCompanyName(data.companyName || '');
        setCompanyContact(data.companyContact || '');
        setCompanyAddress(data.companyAddress || '');
        setLogoUrl(data.logoUrl || '');
        setWorkingDays(data.workingDays || []);

        const holidayDates = (data.holidays || []).map((holiday) => holiday.toDate());
        setHolidays(holidayDates);

        setInitialData(data);
      }
      setLoading(false);
    };

    fetchCompanyDetails();
  }, [user, db]);

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLogo(file);
      setLogoUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    let logoUploadUrl = logoUrl;
    if (logo) {
      const logoRef = ref(storage, `logos/${user.uid}`);
      await uploadBytes(logoRef, logo);
      logoUploadUrl = await getDownloadURL(logoRef);
    }

    const holidayTimestamps = holidays.map((holiday) => Timestamp.fromDate(new Date(holiday)));

    const updatedData = {};

    if (companyName !== initialData.companyName) updatedData.companyName = companyName;
    if (companyContact !== initialData.companyContact) updatedData.companyContact = companyContact;
    if (companyAddress !== initialData.companyAddress) updatedData.companyAddress = companyAddress;
    if (logoUploadUrl !== initialData.logoUrl) updatedData.logoUrl = logoUploadUrl;
    if (JSON.stringify(workingDays) !== JSON.stringify(initialData.workingDays)) updatedData.workingDays = workingDays;
    if (JSON.stringify(holidayTimestamps) !== JSON.stringify(initialData.holidays)) updatedData.holidays = holidayTimestamps;

    if (Object.keys(updatedData).length > 0) {
      await updateDoc(doc(db, 'companies', user.uid, 'company_settings', 'companyDetails'), updatedData);
      setInitialData({ ...initialData, ...updatedData });
    }

    setLoading(false);
    alert('Company settings saved successfully!');
  };

  const toggleWorkingDay = (day) => {
    setWorkingDays((prevDays) =>
      prevDays.includes(day)
        ? prevDays.filter((d) => d !== day)
        : [...prevDays, day]
    );
  };

  return (
    <div className="mb-5 mx-2 d-flex flex-column min-vh-100">
      <div className="container my-2">
        <div className="rounded-3">
          <div className="d-flex justify-content-between px-1 align-items-end">
          <div className="head-content">
            <h3>Company Settings</h3>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
              <li className="breadcrumb-item">
                  <Link to="/Settings" className="text-danger" style={{ textDecoration: 'none' }}>
                    <b>Settings</b>
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                Company Settings
                </li>
              </ol>
            </nav>
          </div>
        </div>
        </div>
      </div>
      <div className="row">
        <div className="col-12 col-lg-4 d-flex justify-content-center">
          <div className="text-center">
            <h3>Logo</h3>
            <div className="mb-3">
              {logoUrl && (
                <div className="mt-3">
                  <img 
                    src={logoUrl} 
                    alt="Logo Preview" 
                    className="img-thumbnail" 
                    style={{ maxWidth: '150px' }} 
                  />
                </div>
              )}
              <input
                type="file"
                className="form-control"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleLogoChange}
              />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-6">
              <div className="mb-3">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter Company Name"
                />
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="mb-3">
                <label className="form-label">Company Contact</label>
                <input
                  type="text"
                  className="form-control"
                  value={companyContact}
                  onChange={(e) => setCompanyContact(e.target.value)}
                  placeholder="Enter Contact Info"
                />
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="mb-3">
                <label className="form-label">Company Address</label>
                <textarea
                  className="form-control"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Enter Company Address"
                  rows="3"
                />
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="mb-3">
                <label className="form-label">Working Days</label>
                <div className="d-flex flex-wrap">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={`btn btn-sm m-1 ${workingDays.includes(day) ? 'btn-success' : 'btn-outline-secondary'}`}
                      onClick={() => toggleWorkingDay(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="mb-3">
                <label className="form-label">Holidays</label>
                <div className="p-1">
                  <DatePicker
                    multiple
                    value={holidays}
                    onChange={setHolidays}
                    format="DD/MM/YYYY"
                    type='button'
                    inputClass="form-control"
                    containerClassName="w-100"
                    calendarPosition="bottom-center border-danger"
                    placeholder='Set Holidays via calendar'
                    hideOnScroll={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-12 text-center">
        <button
          type="button"
          className="btn btn-danger w-100"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
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