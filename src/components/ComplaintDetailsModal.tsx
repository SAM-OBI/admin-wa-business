import { useState } from 'react';
import { FiX, FiUser, FiMessageSquare, FiSend } from 'react-icons/fi';
import api from '../api/axios';
import Swal from 'sweetalert2';

interface Complaint {
  _id: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  status: string;
  evidence?: string[];
  complainant: {
    name: string;
    email: string;
    phone?: string;
  };
  defendant: {
    name: string;
    email: string;
  };
  responses?: Array<{
    respondent: {
      name: string;
      role: string;
    };
    respondentType: string;
    message: string;
    timestamp: string;
    attachments?: string[];
  }>;
  createdAt: string;
  assignedTo?: {
    name: string;
    email: string;
  };
  // 🛡️ [#8D] Already sent by the backend (admin.helpers.ts::getComplaintDetails
  // populates it in full) but never declared/rendered here — a DT complaint
  // had no link back to its order anywhere in this modal.
  order?: {
    _id: string;
    orderId?: string;
    status?: string;
    paymentInfo?: { method?: string; status?: string };
  };
}

interface ComplaintDetailsModalProps {
  complaint: Complaint;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ComplaintDetailsModal({ complaint, onClose, onUpdate }: ComplaintDetailsModalProps) {
  const [responseMessage, setResponseMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendResponse = async () => {
    if (!responseMessage.trim()) return;

    setSending(true);
    try {
      await api.post(`/admin/complaints/${complaint._id}/respond`, {
        message: responseMessage
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Response Sent',
        text: 'Your response has been added to the complaint thread',
        timer: 2000
      });

      setResponseMessage('');
      onUpdate();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to send response'
      });
    } finally {
      setSending(false);
    }
  };

  const handleEscalate = async () => {
    const result = await Swal.fire({
      title: 'Escalate to Court Case?',
      text: 'This will create a formal court case from this complaint',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, Escalate'
    });

    if (result.isConfirmed) {
      try {
        await api.post(`/admin/complaints/${complaint._id}/escalate`);
        Swal.fire({
          icon: 'success',
          title: 'Escalated', 
          text: 'Court case has been created',
          timer: 2000
        });
        onUpdate();
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'Failed to escalate'
        });
      }
    }
  };

  const handleResolve = async () => {
    const { value: resolution } = await Swal.fire({
      title: 'Resolve Complaint',
      input: 'textarea',
      inputLabel: 'Resolution Details',
      inputPlaceholder: 'Enter resolution details...',
      showCancelButton: true,
      confirmButtonText: 'Resolve'
    });

    if (resolution) {
      try {
        await api.patch(`/admin/complaints/${complaint._id}/resolve`, {
          resolution,
          adminResponse: resolution
        });
        Swal.fire({
          icon: 'success',
          title: 'Resolved',
          text: 'Complaint has been marked as resolved',
          timer: 2000
        });
        onUpdate();
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'Failed to resolve'
        });
      }
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-sv-danger-soft text-sv-danger';
      case 'medium': return 'bg-sv-warning-soft text-sv-warning';
      default: return 'bg-sv-success-soft text-sv-success';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-sv-surface rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-sv-surface border-b border-sv-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-sv-text-primary">{complaint.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(complaint.severity)}`}>
                {complaint.severity} Severity
              </span>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sv-info-soft text-sv-info">
                {complaint.type.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-sv-surface-muted rounded-lg transition">
            <FiX className="text-xl text-sv-text-secondary" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-sv-surface-muted rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiUser className="text-sv-text-secondary" />
                <h3 className="font-semibold text-sv-text-primary">Complainant</h3>
              </div>
              <p className="text-sv-text-secondary">{complaint.complainant.name}</p>
              <p className="text-sm text-sv-text-muted">{complaint.complainant.email}</p>
            </div>
            <div className="bg-sv-surface-muted rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiUser className="text-sv-text-secondary" />
                <h3 className="font-semibold text-sv-text-primary">Defendant</h3>
              </div>
              <p className="text-sv-text-secondary">{complaint.defendant.name}</p>
              <p className="text-sm text-sv-text-muted">{complaint.defendant.email}</p>
            </div>
          </div>

          {/* 🛡️ [#8D] Linked order — previously arrived from the backend but was dropped by this modal entirely. */}
          {complaint.order && (
            <div className="bg-sv-surface-muted rounded-lg p-4 text-sm">
              <h3 className="font-semibold text-sv-text-primary mb-1">Linked Order</h3>
              <p className="text-sv-text-secondary">
                Order #{complaint.order.orderId || complaint.order._id.slice(-8)}
                {complaint.order.status && <span className="text-sv-text-muted"> · {complaint.order.status}</span>}
                {complaint.order.paymentInfo?.method === 'transfer' && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-sv-tag-soft text-sv-tag">Direct Transfer</span>
                )}
              </p>
            </div>
          )}

          {/* Description */}
          <div className="bg-sv-surface-muted rounded-lg p-4">
            <h3 className="font-semibold text-sv-text-primary mb-2">Description</h3>
            <p className="text-sv-text-secondary whitespace-pre-wrap">{complaint.description}</p>
          </div>

          {/* Evidence */}
          {complaint.evidence && complaint.evidence.length > 0 && (
            <div>
              <h3 className="font-semibold text-sv-text-primary mb-3">Evidence</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {complaint.evidence.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-sv-border cursor-pointer hover:opacity-80 transition"
                    onClick={() => window.open(url, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Response Thread */}
          {complaint.responses && complaint.responses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FiMessageSquare className="text-sv-text-secondary" />
                <h3 className="font-semibold text-sv-text-primary">Response Thread</h3>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {complaint.responses.map((response, index) => (
                  <div key={index} className={`p-4 rounded-lg ${
                    response.respondentType === 'admin' ? 'bg-sv-info-soft ml-4' : 'bg-sv-surface-muted mr-4'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sv-text-primary">{response.respondent.name}</p>
                        <p className="text-xs text-sv-text-muted capitalize">{response.respondentType}</p>
                      </div>
                      <p className="text-xs text-sv-text-muted">
                        {new Date(response.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sv-text-secondary text-sm">{response.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🛡️ [BATCH-11] Canonical status is RESOLVED|DISMISSED as terminal —
              escalation is RESOLVED + courtCase, not a separate status string. */}
          {complaint.status !== 'RESOLVED' && complaint.status !== 'DISMISSED' && (
            <div className="bg-sv-surface-muted rounded-lg p-4">
              <label className="block text-sm font-medium text-sv-text-secondary mb-2">
                Add Response
              </label>
              <div className="flex gap-2">
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Type your response..."
                  className="flex-1 px-4 py-2 border border-sv-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sv-primary"
                  rows={3}
                />
                <button
                  onClick={handleSendResponse}
                  disabled={sending || !responseMessage.trim()}
                  className="px-4 py-2 bg-sv-primary text-sv-text-inverse rounded-lg hover:bg-sv-primary-hover transition disabled:opacity-50 h-fit"
                >
                  <FiSend />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-sv-surface-muted border-t border-sv-border px-6 py-4 flex justify-between gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-sv-surface border border-sv-border text-sv-text-primary rounded-lg hover:bg-sv-surface-muted transition font-medium"
          >
            Close
          </button>
          <div className="flex gap-3">
            {complaint.status !== 'RESOLVED' && complaint.status !== 'DISMISSED' && (
              <>
                <button
                  onClick={handleResolve}
                  className="px-6 py-2 bg-sv-success text-sv-text-inverse rounded-lg hover:opacity-90 transition font-medium"
                >
                  Resolve
                </button>
                <button
                  onClick={handleEscalate}
                  className="px-6 py-2 bg-sv-danger text-sv-text-inverse rounded-lg hover:opacity-90 transition font-medium"
                >
                  Escalate to Court
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
