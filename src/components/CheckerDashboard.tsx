import React, { useEffect, useState } from 'react';
import { Check, X, Shield, Info, ExternalLink, Clock, User, AlertCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Request {
  id: string;
  customerId: string;
  changeType: string;
  oldValue: string;
  newValue: string;
  status: string;
  confidenceScore: number;
  aiSummary: string;
  extractedData: any;
  scores: { nameMatch: number; authenticity: number; forgeryCheck: string };
  recommendation: string;
  documentUrl: string;
  createdAt: string;
}

export default function CheckerDashboard() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selected, setSelected] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/pending');
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/${action}/${id}`, { method: 'POST' });
      if (res.ok) {
        setSelected(null);
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Checker Review</h1>
          <p className="text-slate-500">Human-in-the-Loop decision authority for account changes</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-100">
          <Shield className="w-4 h-4" />
          {requests.length} Pending Review
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List */}
        <div className="lg:col-span-1 space-y-4">
          <AnimatePresence mode="popLayout">
            {requests.map((req) => (
              <motion.div
                key={req.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelected(req)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selected?.id === req.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{req.id}</span>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    req.confidenceScore > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {req.confidenceScore}% Match
                  </div>
                </div>
                <h3 className="font-bold text-slate-800">{req.changeType}</h3>
                <p className="text-sm text-slate-500 mb-3">{req.customerId} • {new Date(req.createdAt).toLocaleTimeString()}</p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  AI Verified Pending
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {requests.length === 0 && !loading && (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">No pending requests</p>
            </div>
          )}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
          {selected ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
                    <User className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selected.customerId}</h2>
                    <p className="text-sm text-slate-500">Request ID: {selected.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(selected.id, 'reject')}
                    className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => handleAction(selected.id, 'approve')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95"
                  >
                    <Check className="w-4 h-4" /> Approve & Update RPS
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* AI Score Card */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Name Match</p>
                    <div className="text-2xl font-bold text-slate-800">{selected.scores.nameMatch}%</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Authenticity</p>
                    <div className="text-2xl font-bold text-slate-800">{selected.scores.authenticity}%</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Forgery Check</p>
                    <div className={`text-lg font-bold ${selected.scores.forgeryCheck === 'Pass' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {selected.scores.forgeryCheck}
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold">
                    <Shield className="w-5 h-5" />
                    AI Agent Insights
                  </div>
                  <p className="text-blue-900 leading-relaxed">{selected.aiSummary}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-700">
                    <AlertCircle className="w-4 h-4" />
                    Recommendation: {selected.recommendation}
                  </div>
                </div>

                {/* Data Comparison */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      RPS Current State
                    </h4>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-400 mb-1">Full Name</p>
                      <p className="font-medium text-slate-700 line-through">{selected.oldValue}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-500" />
                      Requested Change
                    </h4>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs text-blue-400 mb-1">New Name</p>
                      <p className="font-bold text-blue-900">{selected.newValue}</p>
                    </div>
                  </div>
                </div>

                {/* Document Preview */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    Supporting Document
                  </h4>
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 flex items-center justify-center">
                    <img
                      src={selected.documentUrl}
                      alt="Document"
                      className="w-full h-full object-contain"
                    />
                    <a
                      href={selected.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-2"
                    >
                      <ExternalLink className="w-6 h-6" />
                      View Full Document
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
              <Info className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">Select a request to review details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
