import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus, FaEdit, FaSave, FaTimes,
  FaCheckCircle, FaExclamationTriangle,
  FaPlay, FaExchangeAlt
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface WorkflowDefinition {
  id: string;
  name: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  nodes: WorkflowNode[];
  createdAt: string;
  updatedAt: string;
}

interface WorkflowNode {
  id: string;
  type: 'TRIGGER' | 'CONDITION' | 'ACTION' | 'WAIT';
  name: string;
  config: any;
  nextNodes: string[];
}

// Mock initial data
const MOCK_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'wf-1',
    name: 'Refund Triage',
    version: 3,
    status: 'PUBLISHED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      { id: 'n1', type: 'TRIGGER', name: 'On New Message', config: {}, nextNodes: ['n2'] },
      { id: 'n2', type: 'CONDITION', name: 'Intent == Refund', config: {}, nextNodes: ['n3'] },
      { id: 'n3', type: 'ACTION', name: 'Route to Finance', config: {}, nextNodes: [] },
    ]
  },
  {
    id: 'wf-2',
    name: 'SLA Escalation',
    version: 1,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      { id: 'n1', type: 'TRIGGER', name: 'SLA Breached', config: {}, nextNodes: ['n2'] },
      { id: 'n2', type: 'ACTION', name: 'Notify Manager', config: {}, nextNodes: [] },
    ]
  }
];

export default function WorkflowManager() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [, setLoading] = useState(true);
  
  // Editor State
  const [editingWf, setEditingWf] = useState<WorkflowDefinition | null>(null);
  const [, setViewingDiff] = useState<WorkflowDefinition | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{valid: boolean; errors: string[]} | null>(null);

  useEffect(() => {
    // Mock fetch
    setTimeout(() => {
      setWorkflows(MOCK_WORKFLOWS);
      setLoading(false);
    }, 600);
  }, []);

  const handleValidate = () => {
    setValidating(true);
    setTimeout(() => {
      if (!editingWf) return;
      
      const errors: string[] = [];
      // Mock Cycle Detection
      const hasCycle = editingWf.nodes.some(n => n.nextNodes.includes(n.id));
      if (hasCycle) errors.push('Cycle detected: Node points to itself.');
      
      // Mock Unreachable Nodes
      const reachable = new Set(['n1']);
      editingWf.nodes.forEach(n => n.nextNodes.forEach(nxt => reachable.add(nxt)));
      if (reachable.size < editingWf.nodes.length) {
        errors.push('Unreachable nodes detected in workflow.');
      }

      setValidationResult({ valid: errors.length === 0, errors });
      setValidating(false);
    }, 800);
  };

  const handlePublish = () => {
    if (validationResult && !validationResult.valid) {
      toast.error('Cannot publish workflow with validation errors.');
      return;
    }
    
    toast.success('Workflow Published to Production!');
    setEditingWf(null);
    setValidationResult(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Workflow Definitions</h2>
          <p className="text-xs font-medium text-slate-400">Manage data-driven COP operations and routing.</p>
        </div>
        <button
          onClick={() => setEditingWf({
            id: `wf-${Date.now()}`, name: 'New Workflow', version: 1, status: 'DRAFT', 
            nodes: [{ id: 'n1', type: 'TRIGGER', name: 'Start', config: {}, nextNodes: [] }],
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
          })}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-[5px] text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
        >
          <FaPlus size={10} /> Create Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map(wf => (
          <div key={wf.id} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-white/10 rounded-[5px] p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">{wf.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">v{wf.version}</p>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-[3px] border ${
                wf.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' : 
                wf.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {wf.status}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-6">
              <button onClick={() => setEditingWf(wf)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 rounded-[5px] flex items-center justify-center gap-2 transition-colors">
                <FaEdit size={12} /> Edit
              </button>
              {wf.status === 'PUBLISHED' && (
                <button onClick={() => setViewingDiff(wf)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-2 rounded-[5px] flex items-center justify-center gap-2 transition-colors">
                  <FaExchangeAlt size={12} /> View Diff
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {editingWf && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[5px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-4">
                  <h3 className="font-black text-xl">Workflow Editor</h3>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                    Editing Draft v{editingWf.version + (editingWf.status === 'PUBLISHED' ? 1 : 0)}
                  </span>
                </div>
                <button onClick={() => { setEditingWf(null); setValidationResult(null); }} className="text-slate-400 hover:text-red-500">
                  <FaTimes />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
                {/* Node List Simulator */}
                <div className="space-y-4 max-w-2xl mx-auto relative">
                  {/* Validation Results */}
                  {validationResult && (
                    <div className={`p-4 rounded-[5px] border ${validationResult.valid ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      <h4 className="font-black text-sm flex items-center gap-2">
                        {validationResult.valid ? <FaCheckCircle /> : <FaExclamationTriangle />}
                        {validationResult.valid ? 'Validation Passed' : 'Validation Failed'}
                      </h4>
                      {!validationResult.valid && (
                        <ul className="mt-2 text-xs font-bold list-disc pl-5">
                          {validationResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                      )}
                    </div>
                  )}

                  {editingWf.nodes.map((node, i) => (
                    <div key={node.id} className="relative">
                      {i > 0 && <div className="absolute left-1/2 -top-4 bottom-full w-0.5 bg-slate-300" />}
                      <div className="bg-white border rounded-[5px] p-4 shadow-sm z-10 relative">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            node.type === 'TRIGGER' ? 'bg-purple-100 text-purple-700' :
                            node.type === 'CONDITION' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {node.type}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{node.id}</span>
                        </div>
                        <input 
                          value={node.name}
                          onChange={(e) => {
                            const newNodes = [...editingWf.nodes];
                            newNodes[i].name = e.target.value;
                            setEditingWf({...editingWf, nodes: newNodes});
                            setValidationResult(null); // invalidate checks
                          }}
                          className="w-full text-sm font-black text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-primary outline-none"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button className="mx-auto block mt-4 bg-white border border-dashed border-slate-300 text-slate-500 font-bold text-xs px-4 py-2 rounded-full hover:bg-slate-50 transition-colors">
                    + Add Node
                  </button>
                </div>
              </div>

              <div className="p-6 border-t bg-white flex justify-between items-center">
                <button 
                  onClick={handleValidate} 
                  disabled={validating}
                  className="text-xs font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-6 py-3 rounded-[5px] flex items-center gap-2 hover:bg-slate-200"
                >
                  {validating ? <div className="animate-spin w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full"/> : <FaPlay size={10} />}
                  Validate Workflow
                </button>
                
                <div className="flex gap-3">
                  <button className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-6 py-3 rounded-[5px] flex items-center gap-2 hover:bg-primary/20">
                    <FaSave size={10} /> Save Draft
                  </button>
                  <button 
                    onClick={handlePublish}
                    disabled={!validationResult?.valid}
                    className="text-xs font-black uppercase tracking-widest text-white bg-primary px-6 py-3 rounded-[5px] flex items-center gap-2 disabled:opacity-50 hover:bg-primary-600 transition-all shadow-lg shadow-primary/20"
                  >
                    <FaCheckCircle size={10} /> Publish Version
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
