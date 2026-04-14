import React, { useState } from 'react';
import { Upload, CheckCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function IntakeForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [customerId, setCustomerId] = useState('C001');
  const [changeType, setChangeType] = useState('Legal Name');
  const [newValue, setNewValue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);

    try {
      // 1. Upload file to server for storage/reference
      const formData = new FormData();
      formData.append('document', file);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const { url: documentUrl } = await uploadRes.json();

      // 2. AI Processing (Document Processor Agent)
      const base64Data = await fileToBase64(file);
      const prompt = `
        You are an Intelligent Account Servicing Workflow (IASW) Document Processor.
        Analyze this document for a ${changeType} request.
        
        Customer Request:
        - New Value: ${newValue}
        
        Tasks:
        1. Perform OCR and extract relevant names/dates.
        2. Cross-reference extracted data with the requested change.
        3. Perform a basic forgery check (look for inconsistencies, blurriness, or digital tampering artifacts).
        4. Generate a Confidence Score Card (0-100) for:
           - Name Match
           - Document Authenticity
           - Forgery Check
        5. Provide a human-readable summary and recommended action.
        
        Return JSON format:
        {
          "extractedData": { "brideName": "...", "marriedName": "...", "eventDate": "..." },
          "scores": { "nameMatch": 95, "authenticity": 90, "forgeryCheck": "Pass" },
          "summary": "...",
          "recommendation": "Approve" | "Reject" | "Flag"
        }
      `;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: file.type
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = aiResponse.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

      // 3. Stage to Pending Table via Backend
      const intakeRes = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          changeType,
          newValue,
          aiResult,
          documentUrl
        }),
      });

      if (intakeRes.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setNewValue('');
          setFile(null);
          onSubmitted();
        }, 2000);
      }
    } catch (err) {
      console.error('Intake Error:', err);
      alert('Failed to process document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-50 rounded-lg">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Account Change Intake</h2>
          <p className="text-slate-500">Submit a new request for AI-augmented verification</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Customer ID</label>
            <input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. C001"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Change Type</label>
            <select
              value={changeType}
              onChange={(e) => setChangeType(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option>Legal Name</option>
              <option>Address</option>
              <option>Date of Birth</option>
              <option>Contact</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">New Value</label>
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="e.g. Priya Mehta"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Supporting Document</label>
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-2 ${
              file ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept="image/*,.pdf"
            />
            <Upload className={`w-8 h-8 ${file ? 'text-blue-500' : 'text-slate-400'}`} />
            <p className="text-sm font-medium text-slate-600">
              {file ? file.name : 'Click or drag to upload document'}
            </p>
            <p className="text-xs text-slate-400">Marriage Certificate, Passport, or Govt ID</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className={`w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
            loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing AI Pipeline...
            </>
          ) : success ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Request Staged
            </>
          ) : (
            'Initiate Verification'
          )}
        </button>
      </form>
    </div>
  );
}
