/* eslint-disable react/no-unescaped-entities */
'use client';
import { useState, useEffect } from 'react';
import { ChevronDown, MapPin, Search, X } from 'lucide-react';
import { campuses, searchCampus, submitNewCampus, type Campus } from '@voeq/data';

export function CampusSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Campus[]>(campuses);
  const [selectedCampus, setSelectedCampus] = useState<Campus>(
    campuses.find(c => c.isDefault) || campuses[0]
  );

  useEffect(() => {
    const handleSearch = async () => {
      if (search.trim() === '') {
        setResults(campuses);
      } else {
        const filtered = await searchCampus(search);
        setResults(filtered);
      }
    };
    handleSearch();
  }, [search]);

  const handleSelectCampus = (campus: Campus) => {
    setSelectedCampus(campus);
    setIsOpen(false);
    setSearch('');
  };

  const handleSubmitNewCampus = async () => {
    if (search.trim() === '') return;
    const newCampus = await submitNewCampus(search);
    setSelectedCampus(newCampus);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="campus-selector">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="campus-pill"
        aria-label="Select campus"
        aria-expanded={isOpen}
      >
        <MapPin size={16} />
        <span className="campus-pill-text">
          Discover what's open on your campus
        </span>
        <ChevronDown size={16} className={isOpen ? 'rotate-180' : ''} />
      </button>

      {isOpen && (
        <>
          <div className="campus-modal-backdrop" onClick={() => setIsOpen(false)} />
          <div className="campus-modal">
            <div className="campus-modal-header">
              <h3 className="campus-modal-title">Select your campus</h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="campus-modal-close"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="campus-search-wrapper">
              <Search size={18} className="campus-search-icon" />
              <input 
                type="text"
                placeholder="Search your university..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="campus-search-input"
                autoFocus
              />
            </div>
            
            <div className="campus-results">
              {results.length > 0 ? (
                results.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => handleSelectCampus(c)}
                    className="campus-result-item"
                  >
                    <div className="campus-result-main">
                      <span className="campus-result-name">{c.name}</span>
                      {c.status === 'verified' && (
                        <span className="campus-result-badge">Verified</span>
                      )}
                    </div>
                    <span className="campus-result-location">
                      {c.city}, {c.state}
                    </span>
                  </button>
                ))
              ) : (
                <div className="campus-no-results">
                  <p className="campus-no-results-text">
                    Can't find your campus?
                  </p>
                  <button 
                    onClick={handleSubmitNewCampus}
                    className="campus-submit-btn"
                  >
                    Add "{search}" →
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
