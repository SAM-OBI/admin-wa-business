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
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{complaint.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(complaint.severity)}`}>
                {complaint.severity} Severity
              </span>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                {complaint.type.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <FiX className="text-xl text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiUser className="text-gray-600" />
                <h3 className="font-semibold text-gray-900">Complainant</h3>
              </div>
              <p className="text-gray-700">{complaint.complainant.name}</p>
              <p className="text-sm text-gray-500">{complaint.complainant.email}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiUser className="text-gray-600" />
                <h3 className="font-semibold text-gray-900">Defendant</h3>
              </div>
              <p className="text-gray-700">{complaint.defendant.name}</p>
              <p className="text-sm text-gray-500">{complaint.defendant.email}</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
          </div>

          {/* Evidence */}
          {complaint.evidence && complaint.evidence.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Evidence</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {complaint.evidence.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition"
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
                <FiMessageSquare className="text-gray-600" />
                <h3 className="font-semibold text-gray-900">Response Thread</h3>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {complaint.responses.map((response, index) => (
                  <div key={index} className={`p-4 rounded-lg ${
                    response.respondentType === 'admin' ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{response.respondent.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{response.respondentType}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(response.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-gray-700 text-sm">{response.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Response */}
          {complaint.status !== 'resolved' && complaint.status !== 'escalated_to_court' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Response
              </label>
              <div className="flex gap-2">
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Type your response..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <button
                  onClick={handleSendResponse}
                  disabled={sending || !responseMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 h-fit"
                >
                  <FiSend />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Close
          </button>
          <div className="flex gap-3">
            {complaint.status !== 'resolved' && complaint.status !== 'escalated_to_court' && (
              <>
                <button
                  onClick={handleResolve}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Resolve
                </button>
                <button
                  onClick={handleEscalate}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
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
