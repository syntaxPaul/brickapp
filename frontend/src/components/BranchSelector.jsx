//frontend/src/components/BranchSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Check, ChevronDown } from 'lucide-react';

export default function BranchSelector({ collapsed = false }) {
    const { branches, currentBranch, switchBranch } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!branches || branches.length <= 1) {
        return null;
    }

    const currentBranchName = branches.find(b => b.branch_id === currentBranch)?.name || 'Select Branch';

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-lg transition text-white text-sm border border-white/10 ${
                    collapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-2'
                }`}
                title={collapsed ? currentBranchName : ''}
            >
                <Building2 size={16} className="flex-shrink-0" />
                {!collapsed && (
                    <>
                        <span className="truncate text-sm font-medium">{currentBranchName}</span>
                        <ChevronDown size={16} className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
                {collapsed && isOpen && (
                    <ChevronDown size={16} className="flex-shrink-0 transition-transform duration-200 rotate-180" />
                )}
            </button>
            
            {isOpen && (
                <div className={`absolute top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 py-1 ${
                    collapsed ? 'left-1/2 -translate-x-1/2 min-w-[180px]' : 'left-0 w-full min-w-[180px]'
                }`}>
                    {branches.map((branch) => (
                        <button
                            key={branch.branch_id}
                            onClick={() => {
                                switchBranch(branch.branch_id);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between transition ${
                                branch.branch_id === currentBranch ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                        >
                            <span>{branch.name}</span>
                            {branch.branch_id === currentBranch && (
                                <Check size={16} className="text-blue-600 flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}