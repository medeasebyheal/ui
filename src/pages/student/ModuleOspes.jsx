import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import api from '../../api/client';

export default function StudentModuleOspes() {
  const { moduleId } = useParams();
  const [ospes, setOspes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/ospes/modules/${moduleId}`)
      .then(({ data }) => setOspes(data || []))
      .catch(() => setOspes([]))
      .finally(() => setLoading(false));
  }, [moduleId]);

  if (loading) {
    return (
      <section className="py-12 container mx-auto px-4">
        <p className="text-slate-500">Loading OSPEs...</p>
      </section>
    );
  }

  return (
    <section className="py-12 container mx-auto px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">OSPEs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Practice OSPE stations and viva-style questions for this module.
          </p>
        </div>
      </div>

      {ospes.length === 0 ? (
        <p className="text-slate-500">No OSPEs in this module.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ospes.map((ospe) => {
            const stationCount = ospe.stations?.length || 0;
            const totalQuestions = stationCount
              ? (ospe.stations || []).reduce(
                  (n, s) => n + (s.questions?.length || 0),
                  0
                )
              : (ospe.questions || []).length;

            const thumb =
              ospe.thumbnailUrl ||
              ospe.stations?.[0]?.imageUrl ||
              ospe.questions?.[0]?.imageUrl ||
              null;

            return (
              <Link
                key={ospe._id}
                to={`/student/ospes/${ospe._id}`}
                className="group bg-white rounded-2xl border border-primary/10 hover:border-primary/30 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                <div className="relative h-32 bg-slate-100 flex items-center justify-center overflow-hidden">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={ospe.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <FileText className="w-10 h-10 text-primary/60" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-70 group-hover:opacity-60 transition-opacity" />
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-white/90">
                    <span className="px-2 py-0.5 rounded-full bg-black/40 font-semibold">
                      OSPE
                    </span>
                    {stationCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-black/30">
                        {stationCount} station{stationCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h2 className="font-semibold text-slate-900 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {ospe.name}
                  </h2>
                  <p className="text-xs text-slate-500 mb-3">
                    {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} ·{' '}
                    {stationCount > 0 ? 'Station-based OSPE' : 'Legacy OSPE'}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                    Start practice
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
