import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Package, User, CreditCard, Tag, CheckCircle, Download, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { toast } from 'react-hot-toast';

const PLAN_KEYS = ['half-year', 'full-year', 'master-proff', 'single-module'];

const getUniversityType = (institution) => {
  if (institution === 'DUHS/KMU/LUMHS/ZU') {
    return 'DOW/KMU';
  }
  return 'Other';
};

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get('plan');
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const [year, setYear] = useState(1);
  const [part, setPart] = useState(1);
  const [selectedSingleModuleId, setSelectedSingleModuleId] = useState('');
  const [academic, setAcademic] = useState({
    institution: '',
    college: '',
    rollNumber: '',
    batch: '',
  });
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const receiptInputRef = useRef(null);

  const MAX_RECEIPT_SIZE = 5 * 1024 * 1024; // 5MB

  const yearsFromPackages = useMemo(() => {
    const ys = [...new Set(packages.filter((p) => p.year != null).map((p) => p.year))];
    return ys.sort((a, b) => a - b);
  }, [packages]);

  const universityType = useMemo(() => getUniversityType(academic.institution), [academic.institution]);

  const singleModulePackages = useMemo(() => {
    return packages.filter(p => {
      const isSingle = p.type === 'single_module' || p.type === 'single_module-free';
      if (!isSingle) return false;
      const mod = p.moduleIds?.[0];
      const modUnivType = typeof mod === 'object' ? (mod.universityType || 'Other') : 'Other';
      return modUnivType === 'Both' || modUnivType === universityType;
    });
  }, [packages, universityType]);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'college' && value.trim().length > 0 && (value.trim().length < 2 || value.trim().length > 50)) {
      error = 'Please enter college name between 2 to 50 characters';
    }
    if (name === 'rollNumber' && value.trim().length > 0 && (value.trim().length < 2 || value.trim().length > 50)) {
      error = 'Please enter a valid roll number (2-50 characters)';
    }
    if (name === 'batch' && value.trim().length > 0 && (value.trim().length < 2 || value.trim().length > 50)) {
      error = 'Please enter a valid batch (2-50 characters)';
    }
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validate = () => {
    const errs = {};
    if (!academic.institution?.trim()) errs.institution = 'Institution is required';
    
    if (!academic.college?.trim()) errs.college = 'College is required';
    else if (academic.college.trim().length < 2 || academic.college.trim().length > 50) errs.college = 'Please enter college name between 2 to 50 characters';
    
    if (!academic.rollNumber?.trim()) errs.rollNumber = 'Roll number is required';
    else if (academic.rollNumber.trim().length < 2 || academic.rollNumber.trim().length > 50) errs.rollNumber = 'Please enter a valid roll number (2-50 characters)';
    
    if (!academic.batch?.trim()) errs.batch = 'Batch is required';
    else if (academic.batch.trim().length < 2 || academic.batch.trim().length > 50) errs.batch = 'Please enter a valid batch (2-50 characters)';

    if (!receipt) errs.receipt = 'Please upload receipt';
    else if (receipt.size > MAX_RECEIPT_SIZE) errs.receipt = 'Receipt must be under 5MB';

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fill all required fields correctly.');
      return false;
    }
    return true;
  };

  // Derived flag for enabling the submit button without waiting for explicit validation call
  const isAcademicComplete = Boolean(
    academic.institution?.trim() &&
    academic.college?.trim() &&
    academic.college.trim().length >= 2 &&
    academic.college.trim().length <= 50 &&
    academic.rollNumber?.trim() &&
    academic.rollNumber.trim().length >= 2 &&
    academic.rollNumber.trim().length <= 50 &&
    academic.batch?.trim() &&
    academic.batch.trim().length >= 2 &&
    academic.batch.trim().length <= 50 &&
    receipt
  );

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (!planKey || !PLAN_KEYS.includes(planKey)) {
      navigate('/packages');
      return;
    }
    api.get('/packages').then(({ data }) => setPackages(data)).catch(() => setPackages([])).finally(() => setLoading(false));
  }, [user, planKey, navigate]);

  useEffect(() => {
    let url = null;
    if (!receipt) {
      setReceiptPreview(null);
      return;
    }
    try {
      url = URL.createObjectURL(receipt);
      setReceiptPreview(url);
    } catch {
      setReceiptPreview(null);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [receipt]);

  useEffect(() => {
    if (planKey !== 'master-proff' && planKey !== 'single-module' && yearsFromPackages.length > 0 && !yearsFromPackages.includes(year)) {
      setYear(yearsFromPackages[0]);
    }
  }, [yearsFromPackages, year, planKey]);

  useEffect(() => {
    if (planKey === 'single-module' && singleModulePackages.length > 0 && !selectedSingleModuleId) {
      setSelectedSingleModuleId(singleModulePackages[0]._id);
    }
  }, [planKey, singleModulePackages, selectedSingleModuleId]);

  const resolvePackage = () => {
    if (planKey === 'single-module') {
      return packages.find((p) => p._id === selectedSingleModuleId) || null;
    }
    if (planKey === 'master-proff') {
      return packages.find((p) => p.type === 'master_proff');
    }
    if (planKey === 'half-year') {
      const type = universityType === 'DOW/KMU' 
        ? 'dow_kmu_half_year' 
        : (part === 1 ? 'year_half_part1' : 'year_half_part2');
      return packages.find((p) => p.type === type && p.year === year);
    }
    if (planKey === 'full-year') {
      const type = universityType === 'DOW/KMU' ? 'dow_kmu_full_year' : 'year_full';
      return packages.find((p) => p.type === type && p.year === year);
    }
    return null;
  };

  const pkg = resolvePackage();
  const basePrice = pkg?.price ?? 0;
  const finalPrice = promoApplied ? promoApplied.finalAmount : basePrice;
  const promoDiscount = promoApplied ? promoApplied.discount : 0;

  const modulesList = useMemo(() => {
    if (!pkg) return [];
    if (pkg.moduleIds?.length) {
      return pkg.moduleIds.map((m) => (typeof m === 'object' && m?.name ? m.name : String(m)));
    }
    if (pkg.proffPapers?.length) return pkg.proffPapers;
    if (pkg.description) return pkg.description.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  }, [pkg]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const { data } = await api.post('/promo-codes/validate', {
        code: promoCode.trim(),
        originalAmount: basePrice,
      });
      // Convert server UTC timestamps into PKT display datetime strings
      const toPKTDate = (iso) => {
        if (!iso) return null;
        return new Date(iso).toLocaleString('en-US', {
          timeZone: 'Asia/Karachi',
          dateStyle: 'medium',
          timeStyle: 'short'
        });
      };
      const enriched = {
        ...data,
        pktValidFrom: toPKTDate(data.validFrom),
        pktValidTo: toPKTDate(data.validTo),
      };
      setPromoApplied(enriched);
      toast.success(`Promo applied! You save ₨${data.discount || 0}`);
    } catch (err) {
      setPromoApplied(null);
      const msg = err.response?.data?.message || 'Invalid promo code';
      toast.error(msg);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoApplied(null);
    setPromoCode('');
    toast.success('Promo removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    if (!validate()) {
      return;
    }
    const pkg = resolvePackage();
    if (!pkg) {
      toast.error('Package not available for selected year/part. Contact admin.');
      return;
    }
    // Client-side guard: check user's active packages to prevent duplicate/upgrade purchases
    try {
      const userPackages = user?.packages || [];
      const pkgYear = pkg.year;
      const pkgType = pkg.type;

      // Duplicate exact package
      if (userPackages.some((up) => up.package && String(up.package._id) === String(pkg._id))) {
        toast.error('You already have this package active.');
        return;
      }
      
      if (!pkgType.startsWith('single_module')) {
        // Prevent duplicate year/type
        if (userPackages.some((up) => up.package && up.package.year === pkgYear && up.package.type === pkgType)) {
          toast.error('You already have this package active.');
          return;
        }
        // If trying to buy full-year but user has a half for same year -> block
        if (pkgType === 'year_full' && userPackages.some((up) => up.package && up.package.year === pkgYear && (up.package.type === 'year_half_part1' || up.package.type === 'year_half_part2'))) {
          toast.error('Cannot upgrade to full-year when a half-year package is active.');
          return;
        }
        // If trying to buy a half but user already has full-year for same year -> block
        if ((pkgType === 'year_half_part1' || pkgType === 'year_half_part2') && userPackages.some((up) => up.package && up.package.year === pkgYear && up.package.type === 'year_full')) {
          toast.error('You already have the full-year package for this year.');
          return;
        }
      }
    } catch (err) {
      // if anything goes wrong reading user packages, allow server to enforce rules
    }
    setSubmitting(true);
    try {
      await api.post('/package-apply', {
        packageId: pkg._id,
        academicDetails: { ...academic, year, part },
      });
    } catch (_) { }
    try {
      const form = new FormData();
      form.append('packageId', pkg._id);
      form.append('amount', String(finalPrice));
      if (promoApplied?.code) form.append('promoCode', promoApplied.code);
      form.append('receipt', receipt);
      form.append('institution', academic.institution?.trim() ?? '');
      form.append('college', academic.college?.trim() ?? '');
      form.append('rollNumber', academic.rollNumber?.trim() ?? '');
      form.append('batch', academic.batch?.trim() ?? '');
      form.append('year', String(year));
      form.append('part', String(part));
      const { data } = await api.post('/payments', form);
      setSuccess({
        payment: data,
        plan: pkg?.name,
        summary: {
          basePrice,
          discount: promoDiscount,
          finalPrice,
        },
      });
      toast.success('Payment uploaded — awaiting verification');
      setReceipt(null);
      await refreshUser();
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;
      const baseMsg = serverMsg || 'Payment upload failed';
      if (!status || status >= 500) {
        toast.error(`${baseMsg}. Please try again in a few minutes. If the issue persists contact support.`);
      } else {
        toast.error(`${baseMsg}. Please try again. If the issue persists contact support.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || !planKey) return null;
  if (loading) return <p className="text-center py-12">Loading...</p>;
  if (!loading && !PLAN_KEYS.includes(planKey)) return null;

  if (success) {
    return (
      <CheckoutConfirmation
        payment={success.payment}
        planName={success.plan}
        summary={success.summary}
      />
    );
  }

  return (
    <section className="py-8 sm:py-12 container mx-auto px-4 max-w-7xl">
      {/* Breadcrumb */}
      <Link
        to="/packages"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to packages
      </Link>

      <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Med school details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                1. Med school details
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution <span className="text-red-500">*</span></label>
                <select
                  value={academic.institution}
                  onChange={(e) => { 
                    setAcademic((a) => ({ ...a, institution: e.target.value })); 
                    setFieldErrors((e2) => ({ ...e2, institution: '' })); 
                    setYear(1);
                    setPart(1);
                    setSelectedSingleModuleId('');
                  }}
                  required
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${fieldErrors.institution ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Institution</option>
                  <option value="JSMU & AFFILIATES">JSMU & AFFILIATES</option>
                  <option value="DUHS/KMU/LUMHS/ZU">DUHS/KMU/LUMHS/ZU</option>
                </select>
                {fieldErrors.institution && <p className="text-xs text-red-600 mt-1">{fieldErrors.institution}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">College <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={academic.college}
                  onChange={(e) => { 
                    const val = e.target.value;
                    setAcademic((a) => ({ ...a, college: val })); 
                    validateField('college', val); 
                  }}
                  required
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${fieldErrors.college ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                  placeholder="e.g. Dow Medical College"
                />
                {fieldErrors.college && <p className="text-xs text-red-600 mt-1">{fieldErrors.college}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={academic.rollNumber}
                  onChange={(e) => { 
                    const val = e.target.value;
                    setAcademic((a) => ({ ...a, rollNumber: val })); 
                    validateField('rollNumber', val); 
                  }}
                  required
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${fieldErrors.rollNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                />
                {fieldErrors.rollNumber && <p className="text-xs text-red-600 mt-1">{fieldErrors.rollNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={academic.batch}
                  onChange={(e) => { 
                    const val = e.target.value;
                    setAcademic((a) => ({ ...a, batch: val })); 
                    validateField('batch', val); 
                  }}
                  required
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${fieldErrors.batch ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                  placeholder="e.g. 2024"
                />
                {fieldErrors.batch && <p className="text-xs text-red-600 mt-1">{fieldErrors.batch}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Package selection */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                2. Your package
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700 font-medium">{pkg?.name ?? (planKey === 'master-proff' ? 'Proff Buster' : planKey === 'single-module' ? 'Single Module Package' : planKey === 'half-year' ? 'Half Year' : 'Full Year')}</p>
              {planKey === 'single-module' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Module</label>
                  <select
                    value={selectedSingleModuleId}
                    onChange={(e) => setSelectedSingleModuleId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    {singleModulePackages.length === 0 ? (
                      <option value="">No modules available</option>
                    ) : (
                      singleModulePackages.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))
                    )}
                  </select>
                </div>
              )}
              {planKey !== 'master-proff' && planKey !== 'single-module' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {yearsFromPackages.length === 0 ? (
                        [1, 2, 3].map((y) => <option key={y} value={y}>MS {y}</option>)
                      ) : (
                        yearsFromPackages.map((y) => <option key={y} value={y}>MS {y}</option>)
                      )}
                    </select>
                  </div>
                  {planKey === 'half-year' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select part</label>
                      <select
                        value={part}
                        onChange={(e) => setPart(Number(e.target.value))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value={1}>Part 1</option>
                        <option value={2}>Part 2</option>
                      </select>
                    </div>
                  )}
                </>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Modules included</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  {modulesList.length > 0 ? (
                    modulesList.map((m, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {m}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">No modules listed. Package: {pkg?.description || '—'}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>



          {/* Section 3: Payment */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                3. Payment
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Bank details */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
                <h3 className="font-heading font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  💳 Payment method – Bank transfer
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="font-semibold text-gray-900 mb-2">HBL Bank</p>
                    <p className="text-gray-600">Account Number: <span className="font-mono font-medium text-gray-900">00657992536699</span></p>
                    <p className="text-gray-600">Account Title: <span className="font-medium text-gray-900">Muneeb ADA</span></p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="font-semibold text-gray-900 mb-2">Meezan Bank</p>
                    <p className="text-gray-600">Account: <span className="font-medium text-gray-900">MUNEEB BIN ANAS FAROOQUI</span></p>
                    <p className="text-gray-600">Account Number: <span className="font-mono font-medium text-gray-900">99330107737202</span></p>
                    <p className="text-gray-600 break-all">IBAN: <span className="font-mono font-medium text-gray-900">PK85MEZN0099330107737202</span></p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Transfer the amount to either account, then upload your payment receipt below.</p>
                <p className="text-sm text-gray-700 mt-2">
                  If you have any problems making the payment, contact us on WhatsApp:&nbsp;
                  <a
                    href="https://wa.me/923290123208"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    aria-label="Contact MedEase on WhatsApp"
                  >
                    +92 329 0123208
                  </a>
                </p>
              </div>
              {basePrice > 0 && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4" />
                    Promo code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                      {promoLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {promoApplied && (
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-left">
                        <p className="text-sm text-green-600">Promo applied! You save ₨{promoDiscount}</p>
                        {(promoApplied.pktValidFrom || promoApplied.pktValidTo) && (
                          <p className="text-xs text-slate-500">Valid: {promoApplied.pktValidFrom || '—'} to {promoApplied.pktValidTo || '—'} (PKT)</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-xs text-red-600 ml-3 hover:underline"
                        aria-label="Remove promo code"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload receipt <span className="text-red-500">*</span></label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${fieldErrors.receipt ? 'border-red-500' : 'border-gray-300 hover:border-primary/50'}`}>
                  <input
                    ref={receiptInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; setReceipt(f); setFieldErrors((err) => ({ ...err, receipt: '' })); }}
                    className="hidden"
                    id="receipt-upload"
                  />
                  {receipt ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="relative">
                        {receiptPreview ? (
                          <img src={receiptPreview} alt="Receipt preview" className="max-w-[220px] max-h-[140px] object-contain rounded-md border" />
                        ) : (
                          <div className="w-[220px] h-[140px] flex items-center justify-center rounded-md border bg-gray-50 text-sm text-gray-500">Preview not available</div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setReceipt(null);
                            setFieldErrors((err) => ({ ...err, receipt: '' }));
                            if (receiptInputRef.current) receiptInputRef.current.value = '';
                          }}
                          className="absolute -top-2 -right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200 shadow"
                          aria-label="Remove receipt"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-col items-start">
                        <p className="text-sm font-medium text-primary truncate max-w-[200px]">{receipt.name}</p>
                        <p className="text-xs text-green-600 font-medium mt-2">Uploaded</p>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center">
                      <CreditCard className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload payment receipt</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                    </label>
                  )}
                </div>
                {fieldErrors.receipt && <p className="text-xs text-red-600 mt-1">{fieldErrors.receipt}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Order summary (sticky) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:sticky lg:top-24">
            <h3 className="font-heading font-semibold text-gray-900 mb-4">Order summary</h3>
            <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{pkg?.name ?? 'Package'}</span>
                {promoDiscount > 0 ? (
                  <span className="text-gray-400 line-through">₨{basePrice}</span>
                ) : (
                  <span className="font-medium">₨{basePrice}</span>
                )}
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Promo discount</span>
                  <span>-₨{promoDiscount}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-semibold text-gray-900 mb-4">
              <span>Total</span>
              <span className="text-primary text-xl">₨{finalPrice}</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              10% of your payment supports charitable initiatives.
            </p>
            <button
              type="submit"
              disabled={submitting || !resolvePackage() || !isAcademicComplete}
              className="w-full py-3.5 bg-primary text-white font-heading font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Processing...' : 'Complete purchase'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function CheckoutConfirmation({ payment, planName, summary }) {
  const cardRef = useRef(null);

  const base = summary?.basePrice ?? (payment?.originalAmount != null ? Number(payment.originalAmount) : null);
  const discount =
    summary?.discount ??
    (payment?.originalAmount != null && payment?.amount != null
      ? Math.max(0, Number(payment.originalAmount) - Number(payment.amount))
      : 0);
  const totalPaid =
    summary?.finalPrice ??
    (payment?.amount != null && payment?.amount !== '' ? Number(payment.amount) : null);

  const handleSaveAsImage = async () => {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(cardRef.current, { backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `medease-confirmation-${payment._id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <section className="py-12 sm:py-16 container mx-auto px-4 max-w-lg">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Subscription confirmed</h1>
        <p className="text-gray-600">Your payment has been received and your subscription is pending verification.</p>
      </div>
      <div ref={cardRef} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-heading font-semibold text-gray-900">Subscription details</h2>
        </div>
        <div className="p-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Plan</span>
            <span className="font-medium">{planName}</span>
          </div>
          {base != null && base > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Package price</span>
              <span className={discount > 0 ? 'text-gray-400 line-through' : 'font-medium'}>₨{base}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Promo discount</span>
              <span>-₨{discount}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Amount paid</span>
            <span className="font-medium text-primary">₨{totalPaid != null && !Number.isNaN(totalPaid) ? totalPaid : payment.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status</span>
            <span className="font-medium text-amber-600">Pending verification</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="text-gray-500">Subscription ID</span>
            <span className="text-xs font-mono text-gray-600">{payment.subscriptionId || payment._id}</span>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleSaveAsImage}
        className="w-full py-3.5 bg-white border-2 border-primary text-primary font-heading font-semibold rounded-lg hover:bg-primary/5 flex items-center justify-center gap-2 mb-4"
      >
        <Download className="w-5 h-5" />
        Save confirmation as image
      </button>
      <Link
        to="/student/resources"
        className="block w-full py-3.5 bg-primary text-white font-heading font-semibold rounded-lg hover:bg-primary/90 text-center"
      >
        Go to Resources
      </Link>
    </section>
  );
}
