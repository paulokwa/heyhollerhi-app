import React, { useState } from 'react';
import { Search } from 'lucide-react';
import './SearchBar.css';

const SearchBar = ({ onLocationSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const API_KEY = import.meta.env.VITE_MAPTILER_KEY;

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) return;
        setLoading(true);

        try {
            const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${API_KEY}`);
            const data = await response.json();
            setResults(data.features || []);
        } catch (err) {
            console.error("Geocoding failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (feature) => {
        setResults([]);
        setQuery(feature.place_name || feature.text);
        if (onLocationSelect) {
            onLocationSelect(feature);
        }
    };

    return (
        <div className="search-container">
            <form onSubmit={handleSearch} className="search-bar">
                <Search className="search-icon" size={18} />
                <input
                    type="text"
                    placeholder="Search location..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </form>

            {results.length > 0 && (
                <ul className="search-results glass-panel">
                    {results.map((feat) => (
                        <li key={feat.id} onClick={() => handleSelect(feat)}>
                            {feat.place_name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchBar;
