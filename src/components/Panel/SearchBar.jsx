import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { searchLocation } from '../../services/geocodingService';
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
            const features = await searchLocation(query);
            setResults(features);
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
                    id="searchLocation"
                    name="searchLocation"
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
