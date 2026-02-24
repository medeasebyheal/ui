import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

const JSMU_PAPERS = [
  { name: 'Paper 1 (Mix MCQs)', type: 'mcq' },
  { name: 'Paper 2 (Mix MCQs)', type: 'mcq' },
  { name: 'OSPE 1', type: 'ospe' },
  { name: 'OSPE 2', type: 'ospe' },
];

export default function AdminProff() {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otherYears, setOtherYears] = useState([]);
  const [expandedYear, setExpandedYear] = useState(null);

  useEffect(() => {
    api.get('/admin/proff').then(({ data }) => {
      setStructures(data);
      const other = data.find((s) => s.university === 'other');
      setOtherYears(other?.years || []);
    }).catch(() => setStructures([])).finally(() => setLoading(false));
  }, []);

  const jsmu = structures.find((s) => s.university === 'jsmu');
  const other = structures.find((s) => s.university === 'other');

  const saveJsmu = async () => {
    const papers = [...JSMU_PAPERS];
    await api.put('/admin/proff', { university: 'jsmu', papers });
    const { data } = await api.get('/admin/proff');
    setStructures(data);
  };

  const saveOther = async () => {
    await api.put('/admin/proff', { university: 'other', years: otherYears });
    const { data } = await api.get('/admin/proff');
    setStructures(data);
    setOtherYears(data.find((s) => s.university === 'other')?.years || []);
  };

  const addYear = () => setOtherYears((y) => [...y, { name: '', subjects: [] }]);
  const setYear = (yi, field, value) => setOtherYears((y) => { const n = [...y]; n[yi] = { ...n[yi], [field]: value }; return n; });
  const removeYear = (yi) => { setOtherYears((y) => y.filter((_, i) => i !== yi)); setExpandedYear(null); };

  const addSubject = (yi) => setOtherYears((y) => { const n = [...y]; const subs = [...(n[yi].subjects || []), { name: '' }]; n[yi] = { ...n[yi], subjects: subs }; return n; });
  const setSubject = (yi, si, field, value) => setOtherYears((y) => { const n = [...y]; const subs = [...(n[yi].subjects || [])]; subs[si] = { ...subs[si], [field]: value }; n[yi] = { ...n[yi], subjects: subs }; return n; });
  const removeSubject = (yi, si) => setOtherYears((y) => { const n = [...y]; n[yi] = { ...n[yi], subjects: (n[yi].subjects || []).filter((_, i) => i !== si) }; return n; });

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-gray-900 mb-6">Proff structure</h1>
      <div className="space-y-6 max-w-2xl">
        {/* JSMU */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-heading font-semibold text-gray-900">JSMU</h3>
            <p className="text-sm text-gray-500 mt-0.5">Year-wise</p>
          </div>
          <ul className="divide-y divide-gray-100">
            {JSMU_PAPERS.map((p, i) => (
              <li key={i} className="px-4 py-3 flex items-center justify-between">
                <span className="font-medium text-gray-900">{p.name}</span>
                <span className="text-xs text-gray-500">({p.type === 'mcq' ? 'Mix MCQs' : 'OSPE'})</span>
              </li>
            ))}
          </ul>
          <div className="p-4 border-t border-gray-100">
            <button type="button" onClick={saveJsmu} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow">
              Save JSMU
            </button>
          </div>
        </div>

        {/* Other University */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-heading font-semibold text-gray-900">Other University</h3>
            <p className="text-sm text-gray-500 mt-0.5">Years → subject-wise MCQs and OSPE</p>
          </div>
          <div className="p-4 space-y-3">
            {(otherYears || []).map((yr, yi) => (
              <div key={yi} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 p-3 bg-gray-50/80">
                  <button
                    type="button"
                    onClick={() => setExpandedYear(expandedYear === yi ? null : yi)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {expandedYear === yi ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <input
                    value={yr.name || ''}
                    onChange={(e) => setYear(yi, 'name', e.target.value)}
                    placeholder="Year name"
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium"
                  />
                  <button type="button" onClick={() => removeYear(yi)} className="p-1.5 text-gray-500 hover:text-red-600" title="Remove year">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {expandedYear === yi && (
                  <div className="p-3 pt-0 space-y-2">
                    <p className="text-xs font-medium text-gray-500 mb-2">Subjects (Mix MCQs + OSPE per subject)</p>
                    {(yr.subjects || []).map((sub, si) => (
                      <div key={si} className="flex items-center gap-2 pl-4">
                        <input
                          value={sub.name || ''}
                          onChange={(e) => setSubject(yi, si, 'name', e.target.value)}
                          placeholder="Subject name"
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        />
                        <button type="button" onClick={() => removeSubject(yi, si)} className="p-1.5 text-gray-500 hover:text-red-600" title="Remove subject">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addSubject(yi)} className="ml-4 inline-flex items-center gap-1 text-primary text-sm font-medium hover:underline">
                      <Plus className="w-4 h-4" /> Add subject
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={addYear} className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline">
              <Plus className="w-4 h-4" /> Add year
            </button>
          </div>
          <div className="p-4 border-t border-gray-100">
            <button type="button" onClick={saveOther} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow">
              Save Other University
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
