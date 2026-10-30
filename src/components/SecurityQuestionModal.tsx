import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiHelpCircle } from 'react-icons/fi';

const PREDEFINED_QUESTIONS = [
    "What was the name of your first pet?",
    "What is your mother's maiden name?",
    "What city were you born in?",
    "What was the name of your first school?",
    "What is your favorite movie?",
    "What was your childhood nickname?",
    "What is the name of your favorite teacher?",
    "What was the make of your first car?"
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (questions: { question: string, answer: string }[]) => void;
}

export default function SecurityQuestionModal({ isOpen, onClose, onSubmit }: Props) {
    const [selections, setSelections] = useState([
        { question: '', answer: '' },
        { question: '', answer: '' },
        { question: '', answer: '' }
    ]);

    const handleQuestionChange = (index: number, val: string) => {
        const updated = [...selections];
        updated[index].question = val;
        setSelections(updated);
    };

    const handleAnswerChange = (index: number, val: string) => {
        const updated = [...selections];
        updated[index].answer = val;
        setSelections(updated);
    };

    const isComplete = selections.every(s => s.question && s.answer.trim().length >= 2);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-sv-surface rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-sv-border"
                >
                    <div className="px-6 py-4 border-b border-sv-border flex items-center justify-between bg-sv-surface-muted">
                        <div className="flex items-center gap-2 text-sv-text-primary">
                            <FiHelpCircle className="text-xl text-sv-primary" />
                            <h3 className="font-bold text-lg">Security Questions</h3>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-sv-surface rounded-full transition-colors">
                            <FiX className="text-sv-text-muted" />
                        </button>
                    </div>

                    <div className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        <p className="text-sm text-sv-info bg-sv-info-soft p-3 rounded-xl border border-sv-info/20">
                            Please set 3 security questions. These will be used to recover your account if you lose your 2FA device.
                        </p>

                        {selections.map((item, index) => (
                            <div key={index} className="space-y-3 p-4 border border-sv-border rounded-xl bg-sv-surface-muted">
                                <label className="block text-sm font-bold text-sv-text-primary">
                                    Question {index + 1}
                                </label>
                                <select 
                                    value={item.question}
                                    onChange={(e) => handleQuestionChange(index, e.target.value)}
                                    className="w-full px-4 py-2 bg-sv-surface border border-sv-border rounded-xl text-sv-text-primary focus:ring-2 focus:ring-sv-primary/20 outline-none text-sm"
                                >
                                    <option value="">Select a question...</option>
                                    {PREDEFINED_QUESTIONS.map(q => (
                                        <option key={q} value={q} disabled={selections.some((s, idx) => s.question === q && idx !== index)}>
                                            {q}
                                        </option>
                                    ))}
                                </select>
                                <input 
                                    type="text"
                                    value={item.answer}
                                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                                    placeholder="Your answer"
                                    className="w-full px-4 py-2 bg-sv-surface border border-sv-border rounded-xl text-sv-text-primary focus:ring-2 focus:ring-sv-primary/20 outline-none text-sm"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="px-6 py-4 bg-sv-surface-muted border-t border-sv-border flex justify-end gap-3">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-sv-text-secondary hover:text-sv-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => onSubmit(selections)}
                            disabled={!isComplete}
                            className="px-6 py-2 bg-sv-primary text-sv-text-inverse rounded-xl font-bold hover:bg-sv-primary-hover transition-all disabled:opacity-50 text-sm shadow-sm"
                        >
                            Complete Setup
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
