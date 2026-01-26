'use client';

interface SubmissionsFiltersProps {
  filterGrade: string;
  filterEmail: string;
  onGradeChange: (grade: string) => void;
  onEmailChange: (hasEmail: string) => void;
  onApplyFilters: () => void;
  onExportCSV: () => void;
  onAddSubmission: () => void;
}

export default function SubmissionsFilters({
  filterGrade,
  filterEmail,
  onGradeChange,
  onEmailChange,
  onApplyFilters,
  onExportCSV,
  onAddSubmission,
}: SubmissionsFiltersProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
        <div className="flex flex-wrap gap-4 items-end flex-1">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-navy mb-1">Grade</label>
            <select
              value={filterGrade}
              onChange={(e) => onGradeChange(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal text-sm"
            >
              <option value="">All</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="F">F</option>
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-navy mb-1">Email Status</label>
            <select
              value={filterEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal text-sm"
            >
              <option value="">All</option>
              <option value="true">Has Email</option>
              <option value="false">No Email</option>
            </select>
          </div>
          <button
            onClick={onApplyFilters}
            className="w-full sm:w-auto px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium"
          >
            Apply Filters
          </button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={onExportCSV}
            className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-200 text-navy rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Export CSV
          </button>
          <button
            onClick={onAddSubmission}
            className="flex-1 sm:flex-none px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
