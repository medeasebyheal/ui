import { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from './Modal';

export function ProgramForm({ program, onSave, onClose }) {
  const [name, setName] = useState(program?.name ?? '');
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (program?._id) await api.put(`/admin/programs/${program._id}`, { name });
      else await api.post('/admin/programs', { name });
      onSave?.();
      onClose?.();
    } catch (_) { }
    setSaving(false);
  };
  return (
    <Modal open onClose={onClose} title={program ? 'Edit Program' : 'Add Program'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. MBBS, BDS, PharmD" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">Save</button>
        </div>
      </form>
    </Modal>
  );
}

export function YearForm({ year, onSave, onClose, programId: programIdProp }) {
  const [name, setName] = useState(year?.name ?? '');
  const [programId, setProgramId] = useState(
    () => year?.program?._id ?? year?.program ?? programIdProp ?? ''
  );
  const [programs, setPrograms] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/programs').then(({ data }) => setPrograms(data || [])).catch(() => setPrograms([]));
  }, []);
  useEffect(() => {
    const id = year?.program?._id ?? year?.program ?? programIdProp ?? '';
    setProgramId(id);
  }, [year, programIdProp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, program: programId || null };
      if (year?._id) await api.put(`/admin/years/${year._id}`, payload);
      else await api.post('/admin/years', payload);
      onSave?.();
      onClose?.();
    } catch (_) { }
    setSaving(false);
  };
  return (
    <Modal open onClose={onClose} title={year ? 'Edit Year' : 'Add Year'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="">None (standalone year)</option>
            {programs.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Associate this year with a program (e.g. MBBS, BDS) or leave as standalone.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. First Year" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">Save</button>
        </div>
      </form>
    </Modal>
  );
}

export function ModuleForm({ yearId, module, onSave, onClose }) {
  const [name, setName] = useState(module?.name ?? '');
  const [imageUrl, setImageUrl] = useState(module?.imageUrl ?? '');
  const [universityType, setUniversityType] = useState(module?.universityType ?? 'Other');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const { data } = await api.post('/admin/upload-image', form);
      setImageUrl(data.url);
    } catch (_) { }
    setUploading(false);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, imageUrl: imageUrl.trim() || undefined, universityType };
      if (module?._id) await api.put(`/admin/modules/${module._id}`, payload);
      else await api.post(`/admin/years/${yearId}/modules`, payload);
      onSave?.();
      onClose?.();
    } catch (_) { }
    setSaving(false);
  };
  return (
    <Modal open onClose={onClose} title={module ? 'Edit Module' : 'Add Module'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Foundation Module" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">University Type</label>
          <select
            value={universityType}
            onChange={(e) => setUniversityType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white"
          >
            <option value="Other">Other</option>
            <option value="DOW/KMU">DOW/KMU</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Differentiates modules for college-specific checkout filtering.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
          <p className="text-xs text-gray-500 mb-1">Optional. Used on the public Modules page.</p>
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="w-full px-3 py-2 border rounded-lg text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-primary/10 file:text-primary file:font-medium" />
          {uploading && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
          {imageUrl && (
            <div className="mt-2 flex items-center gap-2">
              <img src={imageUrl} alt="" className="max-h-32 rounded object-contain border border-gray-200" />
              <button type="button" onClick={() => setImageUrl('')} className="text-sm text-red-600 hover:underline">
                Remove
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">Save</button>
        </div>
      </form>
    </Modal>
  );
}

export function SubjectForm({ moduleId, subject, onSave, onClose }) {
  const [name, setName] = useState(subject?.name ?? '');
  const [imageUrl, setImageUrl] = useState(subject?.imageUrl ?? '');
  const [oneShotTitle, setOneShotTitle] = useState('');
  const [oneShotYoutubeUrl, setOneShotYoutubeUrl] = useState('');
  const [firstLectureId, setFirstLectureId] = useState(null);
  const [initialLectureTitle, setInitialLectureTitle] = useState('');
  const [initialLectureUrl, setInitialLectureUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [videoUrls, setVideoUrls] = useState(subject?.videoUrls ?? ['']);

  useEffect(() => {
    if (!subject?._id) return;
    api.get(`/admin/subjects/${subject._id}/one-shot-lectures`).then(({ data }) => {
      const lectures = Array.isArray(data) ? data : [];
      const first = lectures[0];
      if (first) {
        const t = first.title ?? '';
        const u = first.youtubeUrl ?? '';
        setOneShotTitle(t);
        setOneShotYoutubeUrl(u);
        setFirstLectureId(first._id);
        setInitialLectureTitle(t);
        setInitialLectureUrl(u);
      }
    }).catch(() => { });
  }, [subject?._id]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const { data } = await api.post('/admin/upload-image', form);
      setImageUrl(data.url);
    } catch (_) { }
    setUploading(false);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const trimmedImage = (imageUrl || '').trim();
      const titleTrim = (oneShotTitle || '').trim();
      const urlTrim = (oneShotYoutubeUrl || '').trim();
      const payload = {
        name: (name || '').trim(),
        imageUrl: trimmedImage || null,
        videoUrls: videoUrls.map(u => u.trim()).filter(Boolean),
      };
      let subjectId = subject?._id;
      if (subjectId) {
        if (titleTrim || urlTrim) {
          payload.oneShotTitle = titleTrim || initialLectureTitle || '';
          payload.youtubeUrl = urlTrim || initialLectureUrl || '';
        }
        await api.put(`/admin/subjects/${subjectId}`, payload);
      } else {
        const postPayload = {
          name: payload.name,
          imageUrl: trimmedImage || undefined,
        };
        const oneShotTitleTrim = (oneShotTitle || '').trim();
        const oneShotYoutubeTrim = (oneShotYoutubeUrl || '').trim();
        if (oneShotTitleTrim && oneShotYoutubeTrim) {
          postPayload.oneShotTitle = oneShotTitleTrim;
          postPayload.youtubeUrl = oneShotYoutubeTrim;
        }
        await api.post(`/admin/modules/${moduleId}/subjects`, postPayload);
      }
      onSave?.();
      onClose?.();
    } catch (_) { }
    setSaving(false);
  };
  return (
    <Modal open onClose={onClose} title={subject ? 'Edit Subject' : 'Add Subject'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image (optional)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="w-full text-sm" />
          {imageUrl && (
            <div className="mt-2 flex items-center gap-2">
              <img src={imageUrl} alt="" className="max-h-32 rounded object-contain" />
              <button type="button" onClick={() => setImageUrl('')} className="text-sm text-red-600 hover:underline">
                Remove image
              </button>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">One shot lecture title (optional)</label>
          <input value={oneShotTitle} onChange={(e) => setOneShotTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" placeholder="e.g. Foundation Module One Shot" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">One shot lecture YouTube URL (optional)</label>
          <input type="text" value={oneShotYoutubeUrl} onChange={(e) => setOneShotYoutubeUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Explanatory Videos (YouTube URLs)</label>
          <div className="space-y-2">
            {videoUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    const newUrls = [...videoUrls];
                    newUrls[index] = e.target.value;
                    setVideoUrls(newUrls);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <button
                  type="button"
                  onClick={() => setVideoUrls(videoUrls.filter((_, i) => i !== index))}
                  className="px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setVideoUrls([...videoUrls, ''])}
            className="mt-2 text-sm text-primary font-medium hover:underline flex items-center gap-1"
          >
            + Add another video
          </button>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">Save</button>
        </div>
      </form>
    </Modal>
  );
}

export function TopicForm({ subjectId, topic, onSave, onClose }) {
  const [name, setName] = useState(topic?.name ?? '');
  const [imageUrl, setImageUrl] = useState(topic?.imageUrl ?? '');
  const [videoUrl, setVideoUrl] = useState(topic?.videoUrl ?? '');
  const [videoUrls, setVideoUrls] = useState(topic?.videoUrls ?? ['']);
  const [content, setContent] = useState(topic?.content ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const { data } = await api.post('/admin/upload-image', form);
      setImageUrl(data.url);
    } catch (_) { }
    setUploading(false);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const trimmedImage = (imageUrl || '').trim();
      const validVideos = videoUrls.map(u => u.trim()).filter(Boolean);
      const payload = {
        name: (name || '').trim(),
        imageUrl: trimmedImage || null,
        videoUrl: (videoUrl || '').trim() || undefined,
        videoUrls: validVideos,
        content: (content || '').trim() || undefined,
      };
      if (topic?._id) {
        await api.put(`/admin/topics/${topic._id}`, payload);
      } else {
        await api.post(`/admin/subjects/${subjectId}/topics`, payload);
      }
      onSave?.();
      onClose?.();
    } catch (_) { }
    setSaving(false);
  };
  return (
    <Modal open onClose={onClose} title={topic ? 'Edit Topic' : 'Add Topic'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image (optional)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="w-full text-sm" />
          {imageUrl && (
            <div className="mt-2 flex items-center gap-2">
              <img src={imageUrl} alt="" className="max-h-32 rounded object-contain" />
              <button type="button" onClick={() => setImageUrl('')} className="text-sm text-red-600 hover:underline">
                Remove image
              </button>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic Main Video (YouTube URL)</label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Other Videos (YouTube URLs)</label>
          <div className="space-y-2">
            {videoUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    const newUrls = [...videoUrls];
                    newUrls[index] = e.target.value;
                    setVideoUrls(newUrls);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <button
                  type="button"
                  onClick={() => setVideoUrls(videoUrls.filter((_, i) => i !== index))}
                  className="px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  title="Remove video"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setVideoUrls([...videoUrls, ''])}
            className="mt-2 text-sm text-primary font-medium hover:underline flex items-center gap-1"
          >
            + Add another video
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content (optional)</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">Save</button>
        </div>
      </form>
    </Modal>
  );
}
