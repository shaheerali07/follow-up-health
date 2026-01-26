'use client';

import { EmailTemplate, GradeRange } from '@/types';
import TemplateEditor from './TemplateEditor';

interface TemplatesListProps {
  templates: EmailTemplate[];
  editingTemplate: GradeRange | null;
  templateSubject: string;
  templateBody: string;
  templateConfig: string;
  onStartEdit: (template: EmailTemplate | null, gradeRange: GradeRange) => void;
  onSubjectChange: (subject: string) => void;
  onBodyChange: (body: string) => void;
  onConfigChange: (config: string) => void;
  onSave: (gradeRange: GradeRange) => void;
  onCancel: () => void;
}

export default function TemplatesList({
  templates,
  editingTemplate,
  templateSubject,
  templateBody,
  templateConfig,
  onStartEdit,
  onSubjectChange,
  onBodyChange,
  onConfigChange,
  onSave,
  onCancel,
}: TemplatesListProps) {
  const gradeRanges: GradeRange[] = ['A', 'BC', 'DF'];

  return (
    <div className="space-y-4">
      {gradeRanges.map((range) => {
        const template = templates.find((t) => t.grade_range === range) || null;
        const isEditing = editingTemplate === range;

        return (
          <TemplateEditor
            key={range}
            template={template}
            gradeRange={range}
            subject={templateSubject}
            body={templateBody}
            config={templateConfig}
            isEditing={isEditing}
            onSubjectChange={onSubjectChange}
            onBodyChange={onBodyChange}
            onConfigChange={onConfigChange}
            onStartEdit={() => onStartEdit(template, range)}
            onSave={() => onSave(range)}
            onCancel={onCancel}
          />
        );
      })}
    </div>
  );
}
