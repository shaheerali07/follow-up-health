'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Submission, EmailTemplate, GradeRange } from '@/types';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  total: number;
  withEmail: number;
}

interface User {
  id: string;
  email: string;
  name: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, withEmail: 0 });
  const [loading, setLoading] = useState(false);

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<GradeRange | null>(null);
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');

  // Filters
  const [filterGrade, setFilterGrade] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Active tab
  const [activeTab, setActiveTab] = useState<'submissions' | 'templates'>('submissions');

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          router.push('/admin/login');
        }
      } catch {
        router.push('/admin/login');
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const fetchSubmissions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
      });

      if (filterGrade) params.set('grade', filterGrade);
      if (filterEmail) params.set('hasEmail', filterEmail);

      const response = await fetch(`/api/submissions?${params}`);

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setSubmissions(data.submissions);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, filterGrade, filterEmail]);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/submissions', { method: 'HEAD' });

      setStats({
        total: parseInt(response.headers.get('X-Total-Submissions') || '0'),
        withEmail: parseInt(response.headers.get('X-With-Email') || '0'),
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [user]);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/email-templates');

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
      fetchStats();
      fetchTemplates();
    }
  }, [user, fetchSubmissions, fetchStats, fetchTemplates]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSaveTemplate = async (gradeRange: GradeRange) => {
    try {
      const response = await fetch('/api/email-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_range: gradeRange,
          subject: templateSubject,
          body: templateBody,
        }),
      });

      if (response.ok) {
        setEditingTemplate(null);
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const startEditingTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template.grade_range);
    setTemplateSubject(template.subject);
    setTemplateBody(template.body);
  };

  const exportToCSV = () => {
    if (!submissions.length) return;

    const headers = [
      'Date',
      'Monthly Inquiries',
      'Response Time',
      'Follow-up Depth',
      'Patient Value',
      'After Hours',
      'Grade',
      'Loss Rate',
      'Risk Low',
      'Risk High',
      'Email',
    ];

    const rows = submissions.map((s) => [
      new Date(s.created_at).toISOString(),
      s.monthly_inquiries,
      s.response_time,
      s.follow_up_depth,
      s.patient_value,
      s.after_hours,
      s.grade,
      s.loss_rate,
      s.risk_low,
      s.risk_high,
      s.email || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-slate">Loading...</div>
      </div>
    );
  }

  // If not authenticated, this will redirect (handled in useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-navy">Admin Dashboard</h1>
              <p className="text-sm text-slate">Welcome, {user.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-slate hover:text-navy px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-slate">Total Submissions</p>
            <p className="text-3xl font-bold text-navy">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-slate">With Email</p>
            <p className="text-3xl font-bold text-teal">{stats.withEmail}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-slate">Conversion Rate</p>
            <p className="text-3xl font-bold text-navy">
              {stats.total > 0
                ? ((stats.withEmail / stats.total) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'submissions'
                ? 'bg-teal text-white'
                : 'bg-white text-slate hover:bg-gray-50'
            }`}
          >
            Submissions
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-teal text-white'
                : 'bg-white text-slate hover:bg-gray-50'
            }`}
          >
            Email Templates
          </button>
        </div>

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    Grade
                  </label>
                  <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal"
                  >
                    <option value="">All</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="F">F</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    Email Status
                  </label>
                  <select
                    value={filterEmail}
                    onChange={(e) => setFilterEmail(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal"
                  >
                    <option value="">All</option>
                    <option value="true">Has Email</option>
                    <option value="false">No Email</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setCurrentPage(1);
                    fetchSubmissions();
                  }}
                  className="px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-600"
                >
                  Apply Filters
                </button>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-white border border-gray-200 text-navy rounded-lg hover:bg-gray-50"
                >
                  Export CSV
                </button>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-navy">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-navy">
                          Grade
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-navy">
                          Inquiries
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-navy">
                          Revenue at Risk
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-navy">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {submissions.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-slate">
                            {new Date(s.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-1 rounded text-sm font-medium ${
                                s.grade.startsWith('A')
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : s.grade.startsWith('B')
                                  ? 'bg-teal-100 text-teal-700'
                                  : s.grade.startsWith('C')
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {s.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate">
                            {s.monthly_inquiries}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate">
                            ${s.risk_low.toLocaleString()} - ${s.risk_high.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate">
                            {s.email || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-slate">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 rounded border border-gray-200 text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 rounded border border-gray-200 text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            {['A', 'BC', 'DF'].map((range) => {
              const template = templates.find((t) => t.grade_range === range);
              const isEditing = editingTemplate === range;

              return (
                <div
                  key={range}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-navy">
                      {range === 'A' && 'Grade A/A- Template'}
                      {range === 'BC' && 'Grade B/C Template'}
                      {range === 'DF' && 'Grade D/F Template'}
                    </h3>
                    {!isEditing && (
                      <button
                        onClick={() =>
                          startEditingTemplate(
                            template || {
                              id: '',
                              grade_range: range as GradeRange,
                              subject: '',
                              body: '',
                              updated_at: '',
                            }
                          )
                        }
                        className="text-sm text-teal hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={templateSubject}
                          onChange={(e) => setTemplateSubject(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1">
                          Body
                        </label>
                        <textarea
                          value={templateBody}
                          onChange={(e) => setTemplateBody(e.target.value)}
                          rows={6}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveTemplate(range as GradeRange)}
                          className="px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingTemplate(null)}
                          className="px-4 py-2 bg-white border border-gray-200 text-slate rounded-lg hover:bg-gray-50"
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
                          <p className="text-sm text-slate whitespace-pre-wrap">
                            {template.body}
                          </p>
                          <p className="text-xs text-slate mt-4">
                            Last updated:{' '}
                            {new Date(template.updated_at).toLocaleString()}
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
            })}
          </div>
        )}
      </main>
    </div>
  );
}
