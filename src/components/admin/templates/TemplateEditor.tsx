'use client';

import { useState, useEffect } from 'react';
import Editor from 'react-simple-wysiwyg';
import { EmailTemplate, GradeRange } from '@/types';
import Spinner from '../shared/Spinner';

interface TemplateEditorProps {
  template: EmailTemplate | null;
  gradeRange: GradeRange;
  subject: string;
  body: string;
  isEditing: boolean;
  isSaving: boolean;
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
  isSaving,
  onSubjectChange,
  onBodyChange,
  onStartEdit,
  onSave,
  onCancel,
}: TemplateEditorProps) {
  const [editorValue, setEditorValue] = useState(body);

  // Sync editor value when body prop changes (e.g., when starting to edit)
  useEffect(() => {
    if (isEditing) {
      setEditorValue(body);
    }
  }, [body, isEditing]);

  const getTemplateTitle = (range: GradeRange) => {
    if (range === 'A') return 'Grade A/A- Template';
    if (range === 'BC') return 'Grade B/C Template';
    return 'Grade D/F Template';
  };

  const handleEditorChange = (event: { target: { value: string } }) => {
    const nextValue = event.target.value;
    setEditorValue(nextValue);
    onBodyChange(nextValue);
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
            <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-teal">
              <Editor
                value={editorValue}
                onChange={handleEditorChange}
                containerProps={{
                  style: {
                    minHeight: '200px',
                    fontFamily: 'inherit',
                    padding: '0.75rem',
                  },
                }}
              />
            </div>
            <p className="text-xs text-slate mt-1">
              Placeholders: {`{{snapshot_html}}`} (stats block), {`{{cta_url}}`}, {`{{grade}}`},{' '}
              {`{{risk_low}}`}, {`{{risk_high}}`}, {`{{dropoff_percent}}`}
            </p>
            <p className="text-xs text-slate mt-1">
              Use the editor to format your message. HTML will be stored and rendered in emails.
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
              disabled={isSaving}
              className="px-4 py-2 bg-teal text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size={16} color="#ffffff" />
                  Saving...
                </span>
              ) : (
                'Save'
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 bg-white border border-gray-200 text-slate rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
              <div
                className="text-sm text-slate break-words prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: template.body || '' }}
              />
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
