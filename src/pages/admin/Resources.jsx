import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  useAdminYears, 
  useAdminYearModules, 
  useAdminModuleSubjects, 
  useAdminSubjectTopics, 
  useAdminModuleOspes, 
  useAdminTopicMcqs,
  useDeleteYear,
  useDeleteModule,
  useDeleteSubject,
  useDeleteTopic,
  useDeleteMcq,
  useDeleteOspe
} from '../../hooks/useAdmin';
import { YearForm, ModuleForm, SubjectForm, TopicForm } from '../../components/admin/ResourceForms';
import Modal from '../../components/admin/Modal';
import McqForm from '../../components/admin/McqForm';
import BulkMcqModal from '../../components/admin/BulkMcqModal';
import { ChevronDown, ChevronRight, Pencil, Trash2, Plus, FileText, List } from 'lucide-react';

export default function AdminResources() {
  const { data: years = [], isLoading } = useAdminYears();
  const [yearForm, setYearForm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  if (isLoading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900">Resource management</h1>
        <button type="button" onClick={() => setYearForm({})} className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium text-sm">
          <Plus className="w-4 h-4" /> Add year
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-6">Academic structure: Years → Modules → Subjects → Topics. Each topic has MCQs; each module can have OSPEs (picture MCQs or viva written).</p>

      <div className="space-y-1">
        {years.map((year) => (
          <YearRow key={year._id} year={year} onSetDelete={setDeleteConfirm} onEditYear={setYearForm} />
        ))}
      </div>

      {years.length === 0 && <p className="text-gray-500 py-8">No years. Click &quot;Add year&quot; to start.</p>}

      {/* Forms & Modal */}
      {yearForm && <YearForm year={yearForm._id ? yearForm : null} onSave={() => {}} onClose={() => setYearForm(null)} />}
      <DeleteModal confirm={deleteConfirm} onCancel={() => setDeleteConfirm(null)} />
    </div>
  );
}

function YearRow({ year, onSetDelete, onEditYear }) {
  const [expanded, setExpanded] = useState(false);
  const { data: modules = [] } = useAdminYearModules(year._id, expanded);
  const [moduleForm, setModuleForm] = useState(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 hover:bg-gray-50">
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 font-semibold text-gray-900">
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          {year.name}
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onEditYear(year)} className="p-2 text-gray-500 hover:text-primary" title="Edit"><Pencil className="w-4 h-4" /></button>
          <button type="button" onClick={() => setModuleForm({ yearId: year._id })} className="text-primary text-sm font-medium">+ Module</button>
          <button type="button" onClick={() => onSetDelete({ type: 'year', id: year._id })} className="p-2 text-gray-500 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      {expanded && modules.map((mod) => (
        <ModuleRow key={mod._id} mod={mod} yearId={year._id} onSetDelete={onSetDelete} />
      ))}
      {moduleForm && <ModuleForm yearId={year._id} module={null} onSave={() => {}} onClose={() => setModuleForm(null)} />}
    </div>
  );
}

function ModuleRow({ mod, yearId, onSetDelete }) {
  const [expanded, setExpanded] = useState(false);
  const { data: subjects = [] } = useAdminModuleSubjects(mod._id, expanded);
  const { data: ospes = [] } = useAdminModuleOspes(mod._id, expanded);
  const [moduleForm, setModuleForm] = useState(null);
  const [subjectForm, setSubjectForm] = useState(null);

  return (
    <div className="border-t border-gray-100 bg-gray-50/50">
      <div className="flex items-center justify-between px-4 py-3 pl-8">
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-gray-800 font-medium">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {mod.name}
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setModuleForm({ yearId, module: mod })} className="p-1.5 text-gray-500 hover:text-primary" title="Edit"><Pencil className="w-4 h-4" /></button>
          <Link to={`/admin/resources/years/${yearId}/modules/${mod._id}/ospes`} className="text-primary text-sm font-medium">+ OSPE</Link>
          <button type="button" onClick={() => setSubjectForm({ moduleId: mod._id })} className="text-primary text-sm font-medium">+ Subject</button>
          <button type="button" onClick={() => onSetDelete({ type: 'module', id: mod._id, parentId: yearId })} className="p-1.5 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {expanded && (
        <>
          {ospes.length > 0 && (
            <div className="pl-12 pr-4 pb-2">
              <p className="text-xs font-medium text-gray-500 mb-1">OSPEs</p>
              <div className="flex flex-wrap gap-2">
                {ospes.map((ospe) => (
                  <div key={ospe._id} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm">
                    <List className="w-4 h-4 text-primary" />
                    <span>{ospe.name}</span>
                    <Link to={`/admin/resources/years/${yearId}/modules/${mod._id}/ospes/${ospe._id}/edit`} className="text-primary hover:underline">Edit</Link>
                    <button type="button" onClick={() => onSetDelete({ type: 'ospe', id: ospe._id, parentId: mod._id })} className="text-red-600">Delete</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {subjects.map((sub) => (
            <SubjectRow key={sub._id} sub={sub} moduleId={mod._id} onSetDelete={onSetDelete} />
          ))}
        </>
      )}
      {moduleForm && <ModuleForm yearId={yearId} module={mod} onSave={() => {}} onClose={() => setModuleForm(null)} />}
      {subjectForm && <SubjectForm moduleId={mod._id} subject={null} onSave={() => {}} onClose={() => setSubjectForm(null)} />}
    </div>
  );
}

function SubjectRow({ sub, moduleId, onSetDelete }) {
  const [expanded, setExpanded] = useState(false);
  const { data: topics = [] } = useAdminSubjectTopics(sub._id, expanded);
  const [subjectForm, setSubjectForm] = useState(null);
  const [topicForm, setTopicForm] = useState(null);

  return (
    <div className="border-t border-gray-100 pl-8">
      <div className="flex items-center justify-between px-4 py-2">
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-gray-700">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {sub.name}
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setSubjectForm({ moduleId, subject: sub })} className="p-1.5 text-gray-500 hover:text-primary"><Pencil className="w-4 h-4" /></button>
          <button type="button" onClick={() => setTopicForm({ subjectId: sub._id })} className="text-primary text-sm">+ Topic</button>
          <button type="button" onClick={() => onSetDelete({ type: 'subject', id: sub._id, parentId: moduleId })} className="p-1.5 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      {expanded && topics.map((topic) => (
        <TopicRow key={topic._id} topic={topic} subjectId={sub._id} onSetDelete={onSetDelete} />
      ))}
      {subjectForm && <SubjectForm moduleId={moduleId} subject={sub} onSave={() => {}} onClose={() => setSubjectForm(null)} />}
      {topicForm && <TopicForm subjectId={sub._id} topic={null} onSave={() => {}} onClose={() => setTopicForm(null)} />}
    </div>
  );
}

function TopicRow({ topic, subjectId, onSetDelete }) {
  const [expanded, setExpanded] = useState(false);
  const { data: mcqs = [] } = useAdminTopicMcqs(topic._id, expanded);
  const [topicForm, setTopicForm] = useState(null);
  const [mcqForm, setMcqForm] = useState(null);
  const [bulkMcqTopicId, setBulkMcqTopicId] = useState(null);

  return (
    <div className="border-t border-gray-100 pl-12 bg-white">
      <div className="flex items-center justify-between px-4 py-2">
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-gray-700 text-sm">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <FileText className="w-4 h-4 text-primary" />
          {topic.name}
          {topic.videoUrl && <span className="text-xs text-gray-400">(video)</span>}
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setTopicForm({ subjectId, topic })} className="p-1.5 text-gray-500 hover:text-primary"><Pencil className="w-4 h-4" /></button>
          <button type="button" onClick={() => setMcqForm({ topicId: topic._id })} className="text-primary text-sm">+ MCQ</button>
          <button type="button" onClick={() => setBulkMcqTopicId(topic._id)} className="text-gray-600 text-sm">Bulk MCQs</button>
          <button type="button" onClick={() => onSetDelete({ type: 'topic', id: topic._id, parentId: subjectId })} className="p-1.5 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-3 pl-16">
          <p className="text-xs font-medium text-gray-500 mb-1">MCQs ({mcqs.length})</p>
          <ul className="space-y-1">
            {mcqs.map((mcq) => (
              <li key={mcq._id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-gray-50">
                <span className="truncate flex-1">{mcq.question}</span>
                <span className="text-xs text-gray-500 mr-2">({mcq.type})</span>
                <button type="button" onClick={() => setMcqForm({ topicId: topic._id, mcq })} className="text-primary text-xs">Edit</button>
                <button type="button" onClick={() => onSetDelete({ type: 'mcq', id: mcq._id, topicId: topic._id })} className="text-red-600 text-xs">Delete</button>
              </li>
            ))}
          </ul>
          {mcqs.length === 0 && <p className="text-xs text-gray-400">No MCQs yet. Add one or use Bulk import.</p>}
        </div>
      )}
      {topicForm && <TopicForm subjectId={subjectId} topic={topic} onSave={() => {}} onClose={() => setTopicForm(null)} />}
      {mcqForm && <McqForm topicId={topic._id} mcq={mcqForm.mcq ?? null} onSave={() => {}} onClose={() => setMcqForm(null)} />}
      {bulkMcqTopicId && <BulkMcqModal topicId={bulkMcqTopicId} onSave={() => {}} onClose={() => setBulkMcqTopicId(null)} />}
    </div>
  );
}

function DeleteModal({ confirm, onCancel }) {
  const deleteYear = useDeleteYear();
  const deleteModule = useDeleteModule(confirm?.parentId);
  const deleteSubject = useDeleteSubject(confirm?.parentId);
  const deleteTopic = useDeleteTopic(confirm?.parentId);
  const deleteMcq = useDeleteMcq(confirm?.topicId);
  const deleteOspe = useDeleteOspe(confirm?.parentId);

  const handleDelete = async () => {
    if (!confirm) return;
    if (confirm.type === 'year') await deleteYear.mutateAsync(confirm.id);
    if (confirm.type === 'module') await deleteModule.mutateAsync(confirm.id);
    if (confirm.type === 'subject') await deleteSubject.mutateAsync(confirm.id);
    if (confirm.type === 'topic') await deleteTopic.mutateAsync(confirm.id);
    if (confirm.type === 'mcq') await deleteMcq.mutateAsync(confirm.id);
    if (confirm.type === 'ospe') await deleteOspe.mutateAsync(confirm.id);
    onCancel();
  };

  if (!confirm) return null;

  return (
    <Modal open onClose={onCancel} title="Confirm delete">
      <p className="text-gray-600 mb-4">Are you sure you want to delete this? This may remove nested data.</p>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancel</button>
        <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
      </div>
    </Modal>
  );
}
