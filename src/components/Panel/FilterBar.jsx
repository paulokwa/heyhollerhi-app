import React from 'react';
import { Heart, MessageCircle, AlertTriangle, Check, Layers } from 'lucide-react';
import './FilterBar.css';

const FilterBar = ({ filters, onToggle }) => {
    const categories = [
        { id: 'positive', icon: Heart, color: '#10b981', label: 'Positive' },
        { id: 'rant', icon: AlertTriangle, color: '#f43f5e', label: 'Rant' },
        { id: 'general', icon: MessageCircle, color: '#3b82f6', label: 'General' },
        { id: 'found', icon: Check, color: '#eab308', label: 'Found' },
    ];

    return (
        <div className="filter-bar">
            <div className="filter-scroll">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = filters[cat.id];
                    return (
                        <button
                            key={cat.id}
                            className={`filter-btn ${isActive ? 'active' : ''}`}
                            onClick={() => onToggle(cat.id)}
                            style={{
                                borderColor: isActive ? cat.color : 'transparent',
                                backgroundColor: isActive ? `${cat.color}20` : 'rgba(255,255,255,0.05)'
                            }}
                        >
                            <Icon size={16} color={isActive ? cat.color : '#94a3b8'} />
                            <span>{cat.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default FilterBar;
