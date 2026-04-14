import React, { useState } from 'react';
import { Shield, FileText, LayoutDashboard, BookOpen, Building2 } from 'lucide-react';
import IntakeForm from './components/IntakeForm';
import CheckerDashboard from './components/CheckerDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState<'intake' | 'checker' | 'design'>('intake');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar / Nav */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">IASW <span className="text-blue-600">Core</span></span>
        </div>
        
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('intake')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'intake' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" /> Staff Intake
          </button>
          <button
            onClick={() => setActiveTab('checker')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'checker' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Checker Review
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'design' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Solution Design
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900">A. Thorat</p>
            <p className="text-[10px] text-slate-500 font-medium">System Administrator</p>
          </div>
          <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ame" alt="avatar" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6">
        {activeTab === 'intake' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <IntakeForm onSubmitted={() => setActiveTab('checker')} />
          </div>
        )}

        {activeTab === 'checker' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CheckerDashboard />
          </div>
        )}

        {activeTab === 'design' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Building2 className="text-blue-600" />
                System Architecture
              </h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                  The Intelligent Account Servicing Workflow (IASW) is designed as a multi-agentic system that balances high-speed automation with strict regulatory compliance.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-2">1. Intake & Validation Agent</h4>
                    <p className="text-sm text-slate-600">Validates request fields against Core Banking (RPS) records synchronously. Ensures customer existence before processing.</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-2">2. Document Processor (GenAI)</h4>
                    <p className="text-sm text-slate-600">Uses Gemini 1.5 Flash for OCR, field extraction, and forgery detection. Cross-references document data with requested changes.</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-2">3. Confidence Scorer</h4>
                    <p className="text-sm text-slate-600">Generates a Score Card based on name matching, document authenticity, and tampering checks. Stages data to Pending Table.</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-2">4. HITL Checker Boundary</h4>
                    <p className="text-sm text-slate-600">Enforces a strict human-only write-call to RPS. AI provides recommendations, but humans trigger the final commit.</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-4">Data Model (Pending Table)</h3>
                <pre className="bg-slate-900 text-blue-300 p-6 rounded-xl overflow-x-auto text-sm">
{`interface PendingRequest {
  id: string;          // Unique Request ID
  customerId: string;  // RPS Reference
  changeType: string;  // e.g. "Legal Name"
  oldValue: string;    // Current RPS value
  newValue: string;    // Requested value
  status: string;      // AI_VERIFIED_PENDING_HUMAN
  scores: {            // Confidence Score Card
    nameMatch: number;
    authenticity: number;
    forgeryCheck: string;
  };
  aiSummary: string;   // Natural language summary
  documentUrl: string; // FileNet (Mock) reference
  createdAt: string;   // Audit timestamp
}`}
                </pre>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 h-10 bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>IASW Prototype v1.0.0</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> System Online</span>
          <span>© 2026 Core Banking Solutions</span>
        </div>
      </footer>
    </div>
  );
}
