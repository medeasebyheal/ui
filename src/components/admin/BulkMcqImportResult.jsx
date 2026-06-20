import { AlertCircle } from 'lucide-react';

function sourceLabel(source) {
  if (source === 'gemini') return 'Gemini';
  if (source === 'openai') return 'OpenAI';
  if (source === 'hybrid') return 'Hybrid';
  if (source === 'rule-based') return 'Rule-based';
  return source;
}

export default function BulkMcqImportResult({ result }) {
  if (!result) return null;
  if (!result.success) {
    return (
      <div className="p-3 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200">
        <span>{result.message}</span>
      </div>
    );
  }
  return (
    <div className="p-3 rounded-lg text-sm bg-green-50 text-green-800 border border-green-200 space-y-2">
      <div>
        <span className="font-medium">Imported {result.created} MCQ(s).</span>
        {result.source && (
          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 font-medium">
            {sourceLabel(result.source)}
          </span>
        )}
        {result.usage && (
          <span className="ml-2 text-xs text-gray-600" title="Token usage">
            ({[
              result.usage.promptTokenCount != null && `In: ${result.usage.promptTokenCount}`,
              result.usage.outputTokenCount != null && `Out: ${result.usage.outputTokenCount}`,
              result.usage.totalTokenCount != null && `Total: ${result.usage.totalTokenCount}`,
            ].filter(Boolean).join(' · ')})
          </span>
        )}
      </div>
      {result.errors?.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded p-2 space-y-1">
          <p className="text-amber-800 font-medium flex items-center gap-1">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {result.errors.length} warning(s) — some blocks could not be fully parsed
          </p>
          {result.errors.slice(0, 5).map((err, i) => (
            <p key={i} className="text-amber-700 text-xs">
              {err.blockIndex ? `Block ${err.blockIndex}: ` : ''}{err.message}
            </p>
          ))}
          {result.errors.length > 5 && (
            <p className="text-amber-700 text-xs">…and {result.errors.length - 5} more</p>
          )}
        </div>
      )}
      {result.partialBlockIndices?.length > 0 && (
        <p className="text-amber-700">
          Block(s) {result.partialBlockIndices.join(', ')} were saved with incomplete options — please edit those MCQs after import.
        </p>
      )}
      {result.created === 0 && (
        <p className="text-amber-700">No MCQs could be extracted. Try adjusting the pasted content and import again.</p>
      )}
    </div>
  );
}
