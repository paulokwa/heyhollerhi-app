import React, { useState } from 'react';
import { Heart, MessageCircle, AlertTriangle, Check, X } from 'lucide-react';
import './Composer.css';

const Composer = ({ onClose, onSubmit }) => {
    const [category, setCategory] = useState('positive');
    const [text, setText] = useState('');
    const [foundData, setFoundData] = useState({
        itemType: '',
        itemClass: '',
        date: new Date().toISOString().slice(0, 16),
        disposition: 'left_there',
        businessType: ''
    });

    const categories = [
        { id: 'positive', icon: Heart, label: 'Positive', color: '#10b981' },
        { id: 'rant', icon: AlertTriangle, label: 'Rant', color: '#f43f5e' },
        { id: 'general', icon: MessageCircle, label: 'General', color: '#3b82f6' },
        { id: 'found', icon: Check, label: 'Found', color: '#eab308' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic Validation
        if (category !== 'found' && !text.trim()) return;
        if (category === 'found') {
            if (!foundData.itemType || !foundData.date || !foundData.disposition) return;
        }

        const payload = {
            category,
            content: category === 'found' ? null : text,
            foundData: category === 'found' ? foundData : null,
            timestamp: new Date().toISOString()
        };

        if (onSubmit) onSubmit(payload);
        onClose();
    };

    return (
        <div className="composer glass-panel">
            <div className="composer-header">
                <h3>Say something</h3>
                <button onClick={onClose} className="close-btn"><X size={20} /></button>
            </div>

            <div className="category-select">
                {categories.map(cat => {
                    const Icon = cat.icon;
                    const active = category === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`cat-btn ${active ? 'active' : ''}`}
                            style={{
                                borderColor: active ? cat.color : 'transparent',
                                color: active ? 'white' : 'var(--color-text-muted)'
                            }}
                        >
                            <Icon size={18} color={active ? cat.color : 'currentColor'} />
                            <span>{cat.label}</span>
                        </button>
                    )
                })}
            </div>

            <form onSubmit={handleSubmit} className="composer-form">
                {category === 'rant' && (
                    <div className="warning-banner">
                        <AlertTriangle size={14} />
                        <span>Kindness matters. No names, no hate.</span>
                    </div>
                )}

                {category !== 'found' ? (
                    <textarea
                        className="composer-input"
                        placeholder={category === 'rant' ? "Vent safely..." : "What's happening?"}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        maxLength={280}
                        rows={4}
                    />
                ) : (
                    <div className="found-form">
                        <div className="form-group">
                            <label>What did you find?</label>
                            <select
                                value={foundData.itemType}
                                onChange={e => setFoundData({ ...foundData, itemType: e.target.value })}
                                required
                            >
                                <option value="">Select Item Type</option>
                                <option value="keys">Keys</option>
                                <option value="wallet">Wallet</option>
                                <option value="phone">Phone</option>
                                <option value="bag">Bag</option>
                                <option value="jewellery">Jewellery</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>When?</label>
                            <input
                                type="datetime-local"
                                value={foundData.date}
                                onChange={e => setFoundData({ ...foundData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Disposition (Where is it?)</label>
                            <select
                                value={foundData.disposition}
                                onChange={e => setFoundData({ ...foundData, disposition: e.target.value })}
                                required
                            >
                                <option value="left_there">Left it there</option>
                                <option value="police">Given to Police</option>
                                <option value="business">Left with Business</option>
                            </select>
                        </div>
                    </div>
                )}

                <button type="submit" className="submit-btn" style={{
                    backgroundColor: categories.find(c => c.id === category).color
                }}>
                    Post to Map
                </button>
            </form>
        </div>
    );
};

export default Composer;
