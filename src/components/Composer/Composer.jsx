import React, { useState } from 'react';
import { Heart, MessageCircle, AlertTriangle, Check, X, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { searchLocation } from '../../services/geocodingService';
import './Composer.css';

const Composer = ({ onClose, onSubmit }) => {
    const [step, setStep] = useState(1); // 1: Location, 2: Category, 3: Content

    // Data State
    const [location, setLocation] = useState(null);
    const [locationQuery, setLocationQuery] = useState('');
    const [locationResults, setLocationResults] = useState([]);
    const [loadingLocation, setLoadingLocation] = useState(false);

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

    // --- Location Search ---
    const handleLocationSearch = async (e) => {
        e.preventDefault();
        if (!locationQuery.trim()) return;

        setLoadingLocation(true);
        try {
            const results = await searchLocation(locationQuery);
            setLocationResults(results);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingLocation(false);
        }
    };

    const selectLocation = (loc) => {
        setLocation(loc);
        setLocationQuery(loc.place_name || loc.text); // Display friendly name
        setLocationResults([]); // Clear dropdown
    };

    // --- Navigation ---
    const nextStep = () => {
        if (step === 1 && !location) return; // Validation: Must pick location
        setStep(s => s + 1);
    };

    const prevStep = () => {
        setStep(s => s - 1);
    };

    // --- Submit ---
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (category !== 'found' && !text.trim()) return;
        if (category === 'found') {
            if (!foundData.itemType || !foundData.date || !foundData.disposition) return;
        }

        const payload = {
            category,
            content: category === 'found' ? null : text,
            foundData: category === 'found' ? foundData : null,
            location: location, // Pass the selected feature
            timestamp: new Date().toISOString()
        };

        if (onSubmit) onSubmit(payload);
        onClose();
    };

    return (
        <div className="composer glass-panel">
            <div className="composer-header">
                <h3>
                    {step === 1 && "Where is this?"}
                    {step === 2 && "What kind of vibe?"}
                    {step === 3 && (category === 'found' ? "What did you find?" : "Say it loud!")}
                </h3>
                <button onClick={onClose} className="close-btn"><X size={20} /></button>
            </div>

            {/* Progress dots (Optional visual cue) */}
            <div className="step-dots">
                {[1, 2, 3].map(s => (
                    <div key={s} className={`dot ${s <= step ? 'active' : ''}`} />
                ))}
            </div>

            <div className="composer-body">

                {/* STEP 1: LOCATION */}
                {step === 1 && (
                    <div className="step-content">
                        <form onSubmit={handleLocationSearch} className="location-search-form">
                            <div className="input-group">
                                <MapPin size={18} className="icon-prefix" />
                                <input
                                    type="text"
                                    id="composerLocationSearch"
                                    name="composerLocationSearch"
                                    placeholder="Search street, city, or place..."
                                    value={locationQuery}
                                    onChange={e => setLocationQuery(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" disabled={loadingLocation}>
                                    {loadingLocation ? "..." : "Search"}
                                </button>
                            </div>
                        </form>

                        {locationResults.length > 0 && (
                            <ul className="location-results">
                                {locationResults.map(res => (
                                    <li key={res.id} onClick={() => selectLocation(res)}>
                                        {res.place_name}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {location && (
                            <div className="selected-location-preview">
                                <Check size={16} color="#10b981" />
                                <span>Selected: <strong>{location.place_name || location.text}</strong></span>
                            </div>
                        )}

                        <p className="helper-text">Enter a postcode, street name, town, or city.</p>
                    </div>
                )}

                {/* STEP 2: CATEGORY */}
                {step === 2 && (
                    <div className="step-content">
                        <div className="category-select-grid">
                            {categories.map(cat => {
                                const Icon = cat.icon;
                                const active = category === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategory(cat.id)}
                                        className={`cat-card ${active ? 'active' : ''}`}
                                        style={{
                                            '--cat-color': cat.color
                                        }}
                                    >
                                        <div className="cat-icon-wrapper" style={{ background: active ? cat.color : 'rgba(255,255,255,0.1)' }}>
                                            <Icon size={24} color={active ? 'white' : cat.color} />
                                        </div>
                                        <span>{cat.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* STEP 3: CONTENT */}
                {step === 3 && (
                    <div className="step-content">
                        <form id="final-form" onSubmit={handleSubmit}>
                            {category === 'rant' && (
                                <div className="warning-banner">
                                    <AlertTriangle size={14} />
                                    <span>Kindness matters. No names, no hate.</span>
                                </div>
                            )}

                            {category !== 'found' ? (
                                <>
                                    <textarea
                                        className="composer-input"
                                        id="postContent"
                                        name="postContent"
                                        placeholder={category === 'rant' ? "Vent safely..." : "What's happening?"}
                                        value={text}
                                        onChange={e => setText(e.target.value)}
                                        maxLength={280}
                                        rows={6}
                                        autoFocus
                                    />
                                    <div className="char-count" style={{
                                        textAlign: 'right',
                                        fontSize: '0.75rem',
                                        color: text.length > 250 ? '#f43f5e' : 'rgba(255,255,255,0.5)',
                                        marginTop: '5px'
                                    }}>
                                        {280 - text.length} chars left
                                    </div>
                                </>
                            ) : (
                                <div className="found-form">
                                    <div className="form-group">
                                        <label htmlFor="foundItemType">What did you find?</label>
                                        <select
                                            id="foundItemType"
                                            name="foundItemType"
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
                                        <label htmlFor="foundDate">When?</label>
                                        <input
                                            type="datetime-local"
                                            id="foundDate"
                                            name="foundDate"
                                            value={foundData.date}
                                            onChange={e => setFoundData({ ...foundData, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="foundDisposition">Disposition (Where is it?)</label>
                                        <select
                                            id="foundDisposition"
                                            name="foundDisposition"
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
                        </form>
                    </div>
                )}

            </div>

            <div className="composer-footer">
                {step > 1 && (
                    <button onClick={prevStep} className="nav-btn back">
                        <ChevronLeft size={16} /> Back
                    </button>
                )}

                {step < 3 ? (
                    <button
                        onClick={nextStep}
                        className="nav-btn next"
                        disabled={step === 1 && !location} // Disable next until location picked
                    >
                        Next <ChevronRight size={16} />
                    </button>
                ) : (
                    <button
                        type="submit"
                        form="final-form"
                        className="submit-btn"
                        style={{ backgroundColor: categories.find(c => c.id === category).color }}
                    >
                        Post to Map
                    </button>
                )}
            </div>
        </div>
    );
};

export default Composer;
