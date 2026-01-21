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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                >
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F5F5DC]/30">
                        <div className="flex items-center gap-2 text-[#4A3728]">
                            <FiHelpCircle className="text-xl text-[#D4AF37]" />
                            <h3 className="font-bold text-lg">Security Questions</h3>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <FiX className="text-gray-400" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                            Please set 3 security questions. These will be used to recover your account if you lose your 2FA device.
                        </p>

                        {selections.map((item, index) => (
                            <div key={index} className="space-y-3 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                                <label className="block text-sm font-bold text-[#4A3728]">
                                    Question {index + 1}
                                </label>
                                <select 
                                    value={item.question}
                                    onChange={(e) => handleQuestionChange(index, e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-sm"
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
                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-sm"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => onSubmit(selections)}
                            disabled={!isComplete}
                            className="px-6 py-2 bg-[#D4AF37] text-white rounded-lg font-bold hover:bg-[#B3902E] transition-all disabled:opacity-50 text-sm shadow-sm"
                        >
                            Complete Setup
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
