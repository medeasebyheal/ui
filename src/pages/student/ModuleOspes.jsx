import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';

export default function StudentModuleOspes() {
  const { moduleId } = useParams();
  const [ospes, setOspes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/ospes/modules/${moduleId}`).then(({ data }) => setOspes(data)).catch(() => setOspes([])).finally(() => setLoading(false));
  }, [moduleId]);

  return (
    <section className="py-12 container mx-auto px-4">
      <h1 className="text-2xl font-heading font-bold text-gray-900 mb-6">OSPEs</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-2">
          {ospes.map((ospe) => (
            <li key={ospe._id}>
              <Link to={`/student/ospes/${ospe._id}`} className="block p-4 bg-white rounded-xl border border-primary/20 hover:border-primary/30 hover:bg-primary/5 transition-all">
                {ospe.name}
              </Link>
            </li>
          ))}
          {ospes.length === 0 && <p className="text-gray-500">No OSPEs in this module.</p>}
        </ul>
      )}
    </section>
  );
}
