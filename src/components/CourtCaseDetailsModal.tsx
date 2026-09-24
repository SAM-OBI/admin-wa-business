import { useState } from 'react';
import { FiX, FiClock } from 'react-icons/fi';
import api from '../api/axios';
import Swal from 'sweetalert2';

interface CourtCase {
  _id: string;
  caseNumber: string;
  status: string;
  plaintiff: {
    name: string;
    email: string;
  };
  defendant: {
    name: string;
    email: string;
  };
  evidence?: Array<{
    type: string;
    url: string;
    description: string;
    uploadedBy: string;
    uploadedAt: string;
  }>;
  timeline?: Array<{
    action: string;
    actor: {
      name: string;
    };
    actorType: string;
    date: string;
    description?: string;
  }>;
  judgment?: {
    ruling: string;
    decision: string;
    compensation?: number;
    judgedAt: string;
  };
}

interface CourtCaseDetailsModalProps {
  caseId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function CourtCaseDetailsModal({ caseId, onClose, onUpdate }: CourtCaseDetailsModalProps) {
  const [courtCase, setCourtCase] = useState<CourtCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'evidence' | 'timeline'>('details');

  useState(() => {
    fetchCaseDetails();
  });

  const fetchCaseDetails = async () => {
    try {
      const response = await api.get(`/admin/court-cases/${caseId}/details`);
      setCourtCase(response.data.data);
    } catch (error) {
      console.error('Failed to fetch case details:', error);
      Swal.fire('Error', 'Failed to load case details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordJudgment = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Record Judgment',
      html: `
        <select id="ruling" class="swal2-input">
          <option value="">Select Ruling</option>
          <option value="favor_plaintiff">Favor Plaintiff</option>
          <option value="favor_defendant">Favor Defendant</option>
          <option value="partial">Partial</option>
        </select>
        <textarea id="decision" class="swal2-textarea" placeholder="Decision details..."></textarea>
        <input id="compensation" type="number" class="swal2-input" placeholder="Compensation (optional)">
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const ruling = (document.getElementById('ruling') as HTMLSelectElement).value;
        const decision = (document.getElementById('decision') as HTMLTextAreaElement).value;
        const compensation = (document.getElementById('compensation') as HTMLInputElement).value;

        if (!ruling || !decision) {
          Swal.showValidationMessage('Ruling and decision are required');
          return false;
        }

        return {
          ruling,
          decision,
          compensation: compensation ? parseFloat(compensation) : undefined
        };
      }
    });

    if (formValues) {
      try {
        await api.post(`/admin/court-cases/${caseId}/judgment`, formValues);
        Swal.fire('Success', 'Judgment recorded successfully', 'success');
        fetchCaseDetails();
        onUpdate();
      } catch (error: any) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to record judgment', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-sv-surface rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sv-primary mx-auto"></div>
          <p className="text-sv-text-secondary mt-4">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (!courtCase) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-sv-surface rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-sv-surface border-b border-sv-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-sv-text-primary">{courtCase.caseNumber}</h2>
            <p className="text-sm text-sv-text-secondary mt-1">
              {courtCase.plaintiff.name} vs {courtCase.defendant.name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-sv-surface-muted rounded-lg transition">
            <FiX className="text-xl text-sv-text-secondary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-sv-border bg-sv-surface-muted">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'details'
                  ? 'border-sv-primary text-sv-primary'
                  : 'border-transparent text-sv-text-muted hover:text-sv-text-secondary'
              }`}
            >
              Case Details
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'evidence'
                  ? 'border-sv-primary text-sv-primary'
                  : 'border-transparent text-sv-text-muted hover:text-sv-text-secondary'
              }`}
            >
              Evidence ({courtCase.evidence?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'timeline'
                  ? 'border-sv-primary text-sv-primary'
                  : 'border-transparent text-sv-text-muted hover:text-sv-text-secondary'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Status */}
              <div className="bg-sv-surface-muted rounded-lg p-4">
                <label className="text-sm text-sv-text-secondary block mb-1">Status</label>
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-sv-info-soft text-sv-info capitalize">
                  {courtCase.status.replace('_', ' ')}
                </span>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-sv-surface-muted rounded-lg p-4">
                  <h3 className="font-semibold text-sv-text-primary mb-2">Plaintiff</h3>
                  <p className="text-sv-text-secondary">{courtCase.plaintiff.name}</p>
                  <p className="text-sm text-sv-text-muted">{courtCase.plaintiff.email}</p>
                </div>
                <div className="bg-sv-surface-muted rounded-lg p-4">
                  <h3 className="font-semibold text-sv-text-primary mb-2">Defendant</h3>
                  <p className="text-sv-text-secondary">{courtCase.defendant.name}</p>
                  <p className="text-sm text-sv-text-muted">{courtCase.defendant.email}</p>
                </div>
              </div>

              {/* Judgment */}
              {courtCase.judgment ? (
                <div className="bg-sv-success-soft border border-sv-success/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FiClock className="text-sv-success" />
                    <h3 className="font-semibold text-sv-text-primary">Judgment</h3>
                  </div>
                  <div className="space-y-2">
                    <p><span className="font-medium">Ruling:</span> {courtCase.judgment.ruling.replace('_', ' ')}</p>
                    <p><span className="font-medium">Decision:</span> {courtCase.judgment.decision}</p>
                    {courtCase.judgment.compensation && (
                      <p><span className="font-medium">Compensation:</span> ${courtCase.judgment.compensation}</p>
                    )}
                    <p className="text-sm text-sv-text-secondary">
                      Judged on {new Date(courtCase.judgment.judgedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-sv-warning-soft border border-sv-warning/30 rounded-lg p-4 text-center">
                  <p className="text-sv-text-secondary mb-3">No judgment recorded yet</p>
                  <button
                    onClick={handleRecordJudgment}
                    className="px-4 py-2 bg-sv-primary text-sv-text-inverse rounded-lg hover:bg-sv-primary-hover transition"
                  >
                    Record Judgment
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-4">
              {courtCase.evidence && courtCase.evidence.length > 0 ? (
                courtCase.evidence.map((item, index) => (
                  <div key={index} className="bg-sv-surface-muted rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-sv-border text-sv-text-secondary capitalize">
                          {item.type.replace('_', ' ')}
                        </span>
                        <p className="text-sm text-sv-text-secondary mt-1">Uploaded by {item.uploadedBy}</p>
                      </div>
                      <p className="text-xs text-sv-text-muted">
                        {new Date(item.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sv-text-secondary mb-2">{item.description}</p>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sv-primary hover:underline text-sm"
                    >
                      View Evidence
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-center text-sv-text-secondary py-8">No evidence uploaded yet</p>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {courtCase.timeline && courtCase.timeline.length > 0 ? (
                courtCase.timeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-sv-primary rounded-full mt-2"></div>
                    <div className="flex-1 pb-4 border-b border-sv-border last:border-0">
                      <p className="font-medium text-sv-text-primary">{event.action}</p>
                      {event.description && <p className="text-sm text-sv-text-secondary mt-1">{event.description}</p>}
                      <div className="flex items-center gap-2 mt-2 text-sm text-sv-text-muted">
                        <span>{event.actor.name}</span>
                        <span>•</span>
                        <span className="capitalize">{event.actorType}</span>
                        <span>•</span>
                        <span>{new Date(event.date).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sv-text-secondary py-8">No timeline events yet</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-sv-surface-muted border-t border-sv-border px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-sv-surface border border-sv-border text-sv-text-primary rounded-lg hover:bg-sv-surface-muted transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
