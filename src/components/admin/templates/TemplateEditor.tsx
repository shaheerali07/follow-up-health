'use client';

import { EmailTemplate, GradeRange } from '@/types';

interface TemplateEditorProps {
  template: EmailTemplate | null;
  gradeRange: GradeRange;
  subject: string;
  body: string;
  isEditing: boolean;
  onSubjectChange: (subject: string) => void;
  onBodyChange: (body: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function TemplateEditor({
  template,
  gradeRange,
  subject,
  body,
  isEditing,
  onSubjectChange,
  onBodyChange,
  onStartEdit,
  onSave,
  onCancel,
}: TemplateEditorProps) {
  const getTemplateTitle = (range: GradeRange) => {
    if (range === 'A') return 'Grade A/A- Template';
    if (range === 'BC') return 'Grade B/C Template';
    return 'Grade D/F Template';
  };

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <h3 className="text-lg font-semibold text-navy">{getTemplateTitle(gradeRange)}</h3>
        {!isEditing && (
          <button
            onClick={onStartEdit}
            className="text-sm text-teal hover:underline whitespace-nowrap"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Body</label>
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal font-mono text-sm"
              placeholder="Your custom message appears in the email before the grade, revenue, and scores. Use {{snapshot_html}} to insert the stats block exactly where you want it; otherwise it is appended after your message."
            />
            <p className="text-xs text-slate mt-1">
              Placeholders: {`{{snapshot_html}}`} (stats block), {`{{cta_url}}`}, {`{{grade}}`},{' '}
              {`{{risk_low}}`}, {`{{risk_high}}`}, {`{{dropoff_percent}}`}
            </p>
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-navy mb-1">
              Config (JSON) - Optional constants
            </label>
            <textarea
              value={config}
              onChange={(e) => onConfigChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal font-mono text-sm"
              placeholder='{"cta_url": "https://example.com"}'
            />
            <p className="text-xs text-slate mt-1">
              JSON object for configurable values (e.g., CTA URL). Leave empty to use defaults.
            </p>
          </div> */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={onSave}
              className="px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-white border border-gray-200 text-slate rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {template ? (
            <>
              <p className="text-sm text-slate mb-2">
                <strong>Subject:</strong> {template.subject}
              </p>
              <p className="text-sm text-slate whitespace-pre-wrap break-words">{template.body}</p>
              <p className="text-xs text-slate mt-4">
                Last updated: {new Date(template.updated_at).toLocaleString()}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate">
              No template configured. Click Edit to create one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
