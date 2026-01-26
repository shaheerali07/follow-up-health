'use client';

import { Submission } from '@/types';
import Modal from '../shared/Modal';

interface DeleteSubmissionModalProps {
  submission: Submission | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteSubmissionModal({
  submission,
  onClose,
  onConfirm,
}: DeleteSubmissionModalProps) {
  return (
    <Modal isOpen={!!submission} onClose={onClose} title="Delete Submission" maxWidth="md">
      <div>
        <p className="text-slate mb-6">
          Are you sure you want to delete this submission? This action cannot be undone.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-slate rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
