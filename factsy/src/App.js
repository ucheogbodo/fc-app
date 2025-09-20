// src/App.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

// API key should be stored in .env.local file for security
const API_KEY = process.env.REACT_APP_GOOGLE_FACT_CHECK_API_KEY;

// Check if API key is configured
const isApiKeyConfigured = () => {
  return API_KEY && API_KEY !== "your_api_key_here" && API_KEY !== "AIzaSyD-9tS6d1qxJmMjt4S6b37qzI0J0PbwwoQ";
};

if (!isApiKeyConfigured()) {
  console.warn("⚠️ Google Fact Check API key not found. Please create a .env.local file with REACT_APP_GOOGLE_FACT_CHECK_API_KEY=your_key_here");
}

// Define theme styles (moved up for component access)
const themeStyles = {
  light: {
    background: '#f4f6fb',
    card: '#fff',
    text: '#222',
    subtext: '#666',
    border: '#e0e0e0',
    accent: '#3498db',
    error: '#e74c3c',
    shadow: '0 2px 8px rgba(0,0,0,0.07)'
  },
  dark: {
    background: '#181a20',
    card: '#23262f',
    text: '#f4f6fb',
    subtext: '#b0b8c1',
    border: '#2c2f36',
    accent: '#4f8cff',
    error: '#ff7675',
    shadow: '0 2px 12px rgba(0,0,0,0.25)'
  },
  highContrast: {
    background: '#000000',
    card: '#ffffff',
    text: '#000000',
    subtext: '#333333',
    border: '#000000',
    accent: '#0000ff',
    error: '#ff0000',
    shadow: '0 0 0 2px #000000'
  }
};

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

const styles = {
  container: { 
    padding: 20, 
    maxWidth: 800,
    margin: '0 auto',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#2c3e50'
  },
  searchContainer: {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap'
  },
  input: { 
    flex: 1,
    minWidth: 250,
    padding: 12, 
    border: '2px solid #e0e0e0',
    borderRadius: 8,
    fontSize: 16,
    outline: 'none',
    transition: 'border-color 0.3s ease'
  },
  button: { 
    padding: '12px 24px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    cursor: 'pointer',
    transition: 'background-color 0.3s ease'
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
    cursor: 'not-allowed'
  },
  list: { 
    marginTop: 30,
    listStyle: 'none',
    padding: 0
  },
  listItem: { 
    marginTop: 15, 
    padding: 20, 
    border: '1px solid #e0e0e0', 
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  listItemHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
  },
  error: { 
    color: '#e74c3c', 
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fdf2f2',
    borderRadius: 8,
    border: '1px solid #fecaca'
  },
  loading: { 
    marginTop: 20, 
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#7f8c8d'
  },
  noResults: { 
    marginTop: 20, 
    color: '#7f8c8d',
    textAlign: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8
  },
  claimText: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 10,
    color: '#2c3e50'
  },
  rating: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 10
  },
  ratingTrue: {
    backgroundColor: '#d4edda',
    color: '#155724'
  },
  ratingFalse: {
    backgroundColor: '#f8d7da',
    color: '#721c24'
  },
  ratingMixed: {
    backgroundColor: '#fff3cd',
    color: '#856404'
  },
  source: {
    color: '#7f8c8d',
    fontSize: 14,
    marginBottom: 10
  },
  sourceLink: {
    color: '#3498db',
    textDecoration: 'none',
    fontWeight: 600
  },
  sourceLinkHover: {
    textDecoration: 'underline'
  }
};

// Toast notification system
function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 2200);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(40,40,50,0.97)',
      color: '#fff',
      padding: '14px 32px',
      borderRadius: 24,
      fontSize: 16,
      fontWeight: 600,
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
      zIndex: 9999,
      letterSpacing: 0.2,
      opacity: 0.98,
      pointerEvents: 'none',
      transition: 'opacity 0.3s',
    }}>{message}</div>
  );
}

// Skeleton loader component
function SkeletonLoader({ theme, themeStyles }) {
  const t = themeStyles[theme];
  return (
    <div style={{
      marginTop: 30,
      listStyle: 'none',
      padding: 0
    }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          marginTop: 15,
          padding: 20,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          backgroundColor: t.card,
          boxShadow: t.shadow,
          animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          <div style={{
            height: 20,
            backgroundColor: t.border,
            borderRadius: 4,
            marginBottom: 10,
            width: '80%'
          }} />
          <div style={{
            height: 16,
            backgroundColor: t.border,
            borderRadius: 4,
            marginBottom: 8,
            width: '40%'
          }} />
          <div style={{
            height: 14,
            backgroundColor: t.border,
            borderRadius: 4,
            width: '60%'
          }} />
        </div>
      ))}
    </div>
  );
}

// Simple Bar Chart Component
function SimpleBarChart({ data, title, color = '#3498db', theme, themeStyles }) {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.count));
  const t = themeStyles[theme];
  
  return (
    <div style={{ marginBottom: 20 }}>
      <h4 style={{ margin: '0 0 12px 0', color: t.text, fontSize: 16 }}>{title}</h4>
      <div style={{ display: 'flex', alignItems: 'end', gap: 4, height: 120, padding: '0 8px' }}>
        {data.map((item, index) => (
          <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                height: `${(item.count / maxValue) * 100}px`,
                backgroundColor: color,
                width: '100%',
                borderRadius: '2px 2px 0 0',
                minHeight: item.count > 0 ? '4px' : '0px',
                transition: 'height 0.3s ease'
              }}
            />
            <div style={{ 
              fontSize: 10, 
              color: t.subtext, 
              marginTop: 4, 
              textAlign: 'center',
              transform: 'rotate(-45deg)',
              transformOrigin: 'center',
              whiteSpace: 'nowrap'
            }}>
              {item.name || item.day || item.hour}
            </div>
            <div style={{ fontSize: 10, color: t.text, fontWeight: 600, marginTop: 2 }}>
              {item.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Result Preview Tooltip Component
function ResultPreview({ claim, position, theme, themeStyles }) {
  if (!claim) return null;
  
  const review = claim.claimReview?.[0] || {};
  const t = themeStyles[theme];
  
  return (
    <div style={{
      position: 'fixed',
      left: position.x,
      top: position.y,
      transform: 'translateX(-50%) translateY(-100%)',
      background: t.card,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: 16,
      maxWidth: 300,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 10000,
      pointerEvents: 'none',
      fontSize: 14
    }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: t.text }}>
        {claim.text?.substring(0, 100)}{claim.text?.length > 100 ? '...' : ''}
      </div>
      <div style={{ marginBottom: 6 }}>
        <span style={{ 
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: review.textualRating?.toLowerCase().includes('true') ? '#d4edda' : 
                          review.textualRating?.toLowerCase().includes('false') ? '#f8d7da' : '#fff3cd',
          color: review.textualRating?.toLowerCase().includes('true') ? '#155724' :
                 review.textualRating?.toLowerCase().includes('false') ? '#721c24' : '#856404'
        }}>
          {review.textualRating || 'Unknown'}
        </span>
      </div>
      <div style={{ color: t.subtext, fontSize: 12, marginBottom: 4 }}>
        Source: {review.publisher?.name || 'Unknown'}
      </div>
      {review.url && (
        <div style={{ color: t.accent, fontSize: 12 }}>
          Click to view full fact-check →
        </div>
      )}
    </div>
  );
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 20,
          margin: 20,
          border: '2px solid #e74c3c',
          borderRadius: 8,
          backgroundColor: '#fdf2f2',
          color: '#721c24'
        }}>
          <h2 style={{ marginTop: 0, color: '#e74c3c' }}>⚠️ Something went wrong</h2>
          <p>We're sorry, but something unexpected happened. Please try refreshing the page.</p>
          <details style={{ marginTop: 10, fontSize: 14 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Error Details</summary>
            <pre style={{ 
              marginTop: 10, 
              padding: 10, 
              backgroundColor: '#f8f9fa', 
              borderRadius: 4,
              overflow: 'auto',
              fontSize: 12
            }}>
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 15,
              padding: '8px 16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [shareMenu, setShareMenu] = useState({ open: false, url: '', anchor: null });
  const [copySuccess, setCopySuccess] = useState("");
  const [filters, setFilters] = useState({
    rating: '',
    source: '',
    text: ''
  });
  const [urlInput, setUrlInput] = useState("");
  const [urlExtractError, setUrlExtractError] = useState("");
  const [trending, setTrending] = useState([]);
  const [theme, setTheme] = useState(() => {
    // Try to use system preference or default to light
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });
  const [highContrast, setHighContrast] = useState(false);
  const [toast, setToast] = useState("");
  const toastRef = useRef();
  
  // Search suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [inputFocused, setInputFocused] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Search analytics state
  const [searchStats, setSearchStats] = useState({
    totalSearches: 0,
    successfulSearches: 0,
    averageResults: 0,
    lastSearchTime: null,
    searchTime: 0
  });

  // Search categories state
  const [searchCategories, setSearchCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Result preview state
  const [previewClaim, setPreviewClaim] = useState(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });

  // Search trends state
  const [showTrendsChart, setShowTrendsChart] = useState(false);
  const [trendsData, setTrendsData] = useState([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("factsy_search_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("factsy_search_history", JSON.stringify(history));
  }, [history]);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("factsy_bookmarks");
    if (saved) setBookmarks(JSON.parse(saved));
  }, []);

  // Save bookmarks to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("factsy_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Load search analytics from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("factsy_search_stats");
    if (saved) setSearchStats(JSON.parse(saved));
  }, []);

  // Save search analytics to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("factsy_search_stats", JSON.stringify(searchStats));
  }, [searchStats]);

  // Load search categories from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("factsy_search_categories");
    if (saved) setSearchCategories(JSON.parse(saved));
  }, []);

  // Save search categories to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("factsy_search_categories", JSON.stringify(searchCategories));
  }, [searchCategories]);

  // Trending topics should refresh daily
  // Helper to get today's date string
  const getToday = () => new Date().toISOString().slice(0, 10);

  // Load trending from localStorage on mount, reset if not today
  useEffect(() => {
    const saved = localStorage.getItem("factsy_trending");
    const savedDate = localStorage.getItem("factsy_trending_date");
    if (saved && savedDate === getToday()) {
      setTrending(JSON.parse(saved));
    } else {
      setTrending([]);
      localStorage.setItem("factsy_trending", JSON.stringify([]));
      localStorage.setItem("factsy_trending_date", getToday());
    }
  }, []);

  // Debounced input for suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Generate suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery && inputFocused) {
      const newSuggestions = generateSuggestions(debouncedQuery, history, trending);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setSelectedSuggestion(-1);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [debouncedQuery, history, trending, inputFocused]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSuggestions && !event.target.closest('[data-suggestions-container]')) {
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  // Save trending topics when a new search is made, and update the date
  const updateTrending = (q) => {
    if (!q.trim()) return;
    setTrending((prev) => {
      const counts = {};
      (prev || []).forEach(item => { counts[item.query] = item.count; });
      counts[q] = (counts[q] || 0) + 1;
      const arr = Object.entries(counts).map(([query, count]) => ({ query, count }));
      arr.sort((a, b) => b.count - a.count);
      const top = arr.slice(0, 5);
      localStorage.setItem("factsy_trending", JSON.stringify(top));
      localStorage.setItem("factsy_trending_date", getToday());
      return top;
    });
  };

  // Add to history with category support (no duplicates, most recent first, max 10)
  const addToHistory = (q, category = '') => {
    if (!q.trim()) return;
    setHistory((prev) => {
      const filtered = prev.filter((item) => {
        if (typeof item === 'string') return item.toLowerCase() !== q.toLowerCase();
        return item.query.toLowerCase() !== q.toLowerCase();
      });
      const newItem = category ? { query: q, category, timestamp: Date.now() } : q;
      return [newItem, ...filtered].slice(0, 10);
    });
    updateTrending(q);
  };

  // Add new category
  const addCategory = () => {
    if (newCategory.trim() && !searchCategories.includes(newCategory.trim())) {
      setSearchCategories(prev => [...prev, newCategory.trim()]);
      setNewCategory('');
      setShowCategoryInput(false);
    }
  };

  // Filter history by category
  const filteredHistory = useMemo(() => {
    if (!selectedCategory) return history;
    return history.filter(item => {
      if (typeof item === 'string') return false;
      return item.category === selectedCategory;
    });
  }, [history, selectedCategory]);

  // Generate search suggestions based on query, history, and trending
  const generateSuggestions = (query, history, trending) => {
    if (!query || query.length < 2) return [];
    
    const queryLower = query.toLowerCase();
    const allSuggestions = [];
    
    // Add history matches (exact and partial)
    history.forEach(item => {
      const itemLower = item.toLowerCase();
      if (itemLower.includes(queryLower) && itemLower !== queryLower) {
        allSuggestions.push({
          text: item,
          type: 'history',
          priority: itemLower.startsWith(queryLower) ? 3 : 2
        });
      }
    });
    
    // Add trending matches
    trending.forEach(item => {
      const itemLower = item.query.toLowerCase();
      if (itemLower.includes(queryLower) && itemLower !== queryLower) {
        allSuggestions.push({
          text: item.query,
          type: 'trending',
          priority: itemLower.startsWith(queryLower) ? 4 : 1
        });
      }
    });
    
    // Remove duplicates and sort by priority
    const unique = allSuggestions.filter((item, index, self) => 
      index === self.findIndex(t => t.text.toLowerCase() === item.text.toLowerCase())
    );
    
    return unique
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 8)
      .map(item => item.text);
  };


  // Search for fact-checked claims using the Google Fact Check Tools API
  const searchFacts = async (q) => {
    const searchQuery = typeof q === "string" ? q : query;
    if (!searchQuery.trim()) return;
    
    const startTime = Date.now();
    setLoading(true);
    setError("");
    setResults([]);
    addToHistory(searchQuery);
    
    // Update search analytics
    setSearchStats(prev => ({
      ...prev,
      totalSearches: prev.totalSearches + 1,
      lastSearchTime: new Date().toISOString()
    }));
    
    // Debug: Log API key status
    console.log("API Key configured:", isApiKeyConfigured());
    console.log("API Key length:", API_KEY ? API_KEY.length : 0);
    console.log("API Key starts with:", API_KEY ? API_KEY.substring(0, 8) : "none");
    
    try {
      const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(searchQuery)}&key=${API_KEY}`;
      console.log("Making request to:", url.substring(0, 100) + "...");
      
      const response = await fetch(url);
      
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response body:", errorText);
        
        if (response.status === 403) {
          throw new Error("API key is invalid or quota exceeded");
        } else if (response.status === 429) {
          throw new Error("Too many requests. Please try again later.");
        } else if (response.status === 400) {
          throw new Error(`Bad request (400) - Check if API is enabled and key is correct. Response: ${errorText}`);
        } else {
          throw new Error(`API request failed (${response.status}): ${errorText}`);
        }
      }
      
      const data = await response.json();
      console.log("API response data:", data);
      
      if (data.error) {
        throw new Error(data.error.message || "API returned an error");
      }
      
      const claims = data.claims || [];
      setResults(claims);
      
      // Update successful search analytics
      const searchTime = Date.now() - startTime;
      setSearchStats(prev => {
        const newSuccessfulSearches = prev.successfulSearches + 1;
        const newAverageResults = Math.round(
          (prev.averageResults * prev.successfulSearches + claims.length) / newSuccessfulSearches
        );
        return {
          ...prev,
          successfulSearches: newSuccessfulSearches,
          averageResults: newAverageResults,
          searchTime: searchTime
        };
      });
      
    } catch (err) {
      console.error("Search error:", err);
      setError("Error fetching facts: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
    searchFacts(suggestion);
  };

  // Handle Enter key in input
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (showSuggestions && selectedSuggestion >= 0) {
        // Select highlighted suggestion
        handleSuggestionSelect(suggestions[selectedSuggestion]);
      } else {
        // Normal search
      searchFacts();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (showSuggestions) {
        setSelectedSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (showSuggestions) {
        setSelectedSuggestion(prev => prev > 0 ? prev - 1 : -1);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }
  };

  // Share helpers
  const handleShare = (url, e) => {
    if (navigator.share) {
      navigator.share({ url })
        .catch(() => {});
    } else {
      setShareMenu({ open: true, url, anchor: e ? e.target : null });
    }
  };

  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 1500);
    } catch {
      setCopySuccess("Failed to copy");
      setTimeout(() => setCopySuccess(""), 1500);
    }
  };

  const closeShareMenu = () => setShareMenu({ open: false, url: '', anchor: null });

  // Export functionality
  const exportToCSV = (data, filename) => {
    const csvContent = data.map(item => `"${item.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportBookmarks = () => {
    const bookmarkData = bookmarks.map(bookmark => 
      `"${bookmark.text || 'N/A'}"` + 
      `,"${bookmark.claimReview?.[0]?.publisher?.name || 'Unknown'}"` +
      `,"${bookmark.claimReview?.[0]?.textualRating || 'N/A'}"` +
      `,"${bookmark.claimReview?.[0]?.url || 'N/A'}"`
    );
    const csvContent = 'Claim,Source,Rating,URL\n' + bookmarkData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `factsy-bookmarks-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast("Bookmarks exported successfully!");
  };

  const exportHistory = () => {
    exportToCSV(history, `factsy-search-history-${new Date().toISOString().slice(0, 10)}.csv`);
    setToast("Search history exported successfully!");
  };

  // Memoized filtered results for performance
  const filteredResults = useMemo(() => {
    return results.filter(claim => {
      const review = claim.claimReview?.[0] || {};
      const rating = review.textualRating?.toLowerCase() || '';
      const source = review.publisher?.name?.toLowerCase() || '';
      const text = claim.text?.toLowerCase() || '';

      // Rating filter
      if (filters.rating && !rating.includes(filters.rating.toLowerCase())) {
        return false;
      }

      // Source filter
      if (filters.source && !source.includes(filters.source.toLowerCase())) {
        return false;
      }

      // Text filter
      if (filters.text && !text.includes(filters.text.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [results, filters]);

  // Memoized unique sources from results
  const uniqueSources = useMemo(() => {
    return [...new Set(results.map(claim => claim.claimReview?.[0]?.publisher?.name).filter(Boolean))];
  }, [results]);

  // Memoized unique ratings from results
  const uniqueRatings = useMemo(() => {
    return [...new Set(results.map(claim => claim.claimReview?.[0]?.textualRating).filter(Boolean))];
  }, [results]);

  // Memoized clear filters function
  const clearFilters = useCallback(() => {
    setFilters({ rating: '', source: '', text: '' });
  }, []);

  // Memoized toggle bookmark function
  const toggleBookmark = useCallback((claim) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.text === claim.text && b.claimReview?.[0]?.url === claim.claimReview?.[0]?.url);
      if (exists) {
        return prev.filter((b) => !(b.text === claim.text && b.claimReview?.[0]?.url === claim.claimReview?.[0]?.url));
      } else {
        return [claim, ...prev];
      }
    });
  }, []);

  // Memoized is bookmarked function
  const isBookmarked = useCallback((claim) => {
    return bookmarks.some((b) => b.text === claim.text && b.claimReview?.[0]?.url === claim.claimReview?.[0]?.url);
  }, [bookmarks]);

  // Preview handlers
  const handlePreviewEnter = (claim, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setPreviewClaim(claim);
  };

  const handlePreviewLeave = () => {
    setPreviewClaim(null);
  };

  // Generate trends data from search history
  const generateTrendsData = useCallback(() => {
    const categoryCounts = {};
    const hourlyCounts = new Array(24).fill(0);
    const dailyCounts = new Array(7).fill(0);
    
    history.forEach(item => {
      const searchTime = typeof item === 'object' && item.timestamp ? new Date(item.timestamp) : new Date();
      const category = typeof item === 'object' && item.category ? item.category : 'Uncategorized';
      
      // Count by category
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      
      // Count by hour
      hourlyCounts[searchTime.getHours()]++;
      
      // Count by day of week
      dailyCounts[searchTime.getDay()]++;
    });
    
    setTrendsData({
      categories: Object.entries(categoryCounts).map(([name, count]) => ({ name, count })),
      hourly: hourlyCounts.map((count, hour) => ({ hour, count })),
      daily: dailyCounts.map((count, day) => ({ 
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day], 
        count 
      }))
    });
  }, [history]);

  // Extract headline from URL
  const extractHeadlineFromUrl = async () => {
    setUrlExtractError("");
    if (!urlInput.trim()) return;
    try {
      // Use a public CORS proxy for demo (for production, use your own backend)
      const proxy = "https://corsproxy.io/?";
      const response = await fetch(proxy + encodeURIComponent(urlInput.trim()));
      if (!response.ok) throw new Error("Failed to fetch the page");
      const html = await response.text();
      // Try to extract <title>
      const match = html.match(/<title>(.*?)<\/title>/i);
      if (match && match[1]) {
        setQuery(match[1].trim());
        setUrlExtractError("");
      } else {
        throw new Error("Could not extract headline from the page");
      }
    } catch (err) {
      setUrlExtractError("Error extracting headline: " + err.message);
    }
  };

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const t = highContrast ? themeStyles.highContrast : themeStyles[theme];

  // Add ripple effect for buttons
  const createRipple = (event) => {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");
    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) ripple.remove();
    button.appendChild(circle);
  };

  // Enhanced keyboard navigation
  const handleGlobalKeyDown = (e) => {
    // Focus management
    if (e.key === 'Tab') {
      // Ensure proper tab order
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
    
    // Quick actions
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'k':
          e.preventDefault();
          document.getElementById('fact-query')?.focus();
          break;
        case 'r':
          e.preventDefault();
          if (query.trim()) searchFacts();
          break;
        case 'b':
          e.preventDefault();
          // Focus on first bookmark if available
          const firstBookmark = document.querySelector('[aria-label*="bookmark"]');
          if (firstBookmark) firstBookmark.focus();
          break;
      }
    }
  };

  // Add global keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [query]);

  // Add header gradient
  const headerGradient = theme === 'light'
    ? 'linear-gradient(90deg, #e3f0ff 0%, #f4f6fb 100%)'
    : 'linear-gradient(90deg, #23262f 0%, #181a20 100%)';

  return (
    <ErrorBoundary>
      <div style={{...styles.container, backgroundColor: t.background, color: t.text, minHeight: '100vh', transition: 'background 0.3s, color 0.3s', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
      {/* Header with gradient and animated theme toggle */}
      <div style={{
        background: headerGradient,
        borderRadius: 18,
        margin: '0 auto 18px auto',
        maxWidth: 820,
        boxShadow: t.shadow,
        padding: '18px 24px 12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <h1 style={{...styles.header, color: t.text, marginBottom: 0, fontWeight: 700, fontSize: 32, letterSpacing: 0.5}}>🕵️ Factsy</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* High Contrast Toggle */}
          <button
            onClick={e => { createRipple(e); setHighContrast(!highContrast); }}
            aria-label="Toggle high contrast mode"
            style={{
              background: highContrast ? '#0000ff' : t.card,
              color: highContrast ? '#ffffff' : t.text,
              border: `1.5px solid ${highContrast ? '#0000ff' : t.border}`,
              borderRadius: 20,
              padding: '8px 12px',
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: t.shadow,
              transition: 'all 0.2s',
              outline: 'none',
              position: 'relative',
              overflow: 'hidden',
              fontWeight: 600
            }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setHighContrast(!highContrast); } }}
            tabIndex={0}
          >
            {highContrast ? '🔍' : '👁️'} {highContrast ? 'High Contrast' : 'Normal'}
          </button>
          
          {/* Theme Toggle */}
          <button
            onClick={e => { createRipple(e); toggleTheme(); }}
            aria-label="Toggle dark/light mode"
            style={{
              background: t.card,
              color: t.text,
              border: `1.5px solid ${t.border}`,
              borderRadius: 20,
              padding: '8px 18px',
              fontSize: 17,
              cursor: 'pointer',
              boxShadow: t.shadow,
              transition: 'background 0.2s, color 0.2s',
              outline: 'none',
              position: 'relative',
              overflow: 'hidden',
              minWidth: 56
            }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { toggleTheme(); } }}
            tabIndex={0}
          >
            <span style={{
              display: 'inline-block',
              transition: 'transform 0.4s cubic-bezier(.68,-0.55,.27,1.55)',
              transform: theme === 'light' ? 'rotate(0deg)' : 'rotate(180deg)',
              fontSize: 22,
              marginRight: 6
            }}>{theme === 'light' ? '🌙' : '☀️'}</span>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{theme === 'light' ? 'Dark' : 'Light'} Mode</span>
          </button>
        </div>
      </div>
      {/* Section divider */}
      <div style={{ height: 2, background: theme === 'light' ? 'linear-gradient(90deg,#e3f0ff,#f4f6fb)' : 'linear-gradient(90deg,#23262f,#181a20)', borderRadius: 2, margin: '0 0 18px 0' }} />
      {/* Toast notification */}
      <Toast message={toast} onClose={() => setToast("")} />
      
      {/* Result Preview Tooltip */}
      <ResultPreview 
        claim={previewClaim} 
        position={previewPosition} 
        theme={theme}
        themeStyles={themeStyles}
      />
      <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: 20 }}>
        Fact-check claims and headlines using Google's Fact Check Tools
      </p>
      
      {/* Keyboard Shortcuts Info */}
      <div style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        fontSize: 13,
        color: t.subtext,
        textAlign: 'center'
      }}>
        <strong>Keyboard Shortcuts:</strong> Ctrl+K (focus search) • Ctrl+R (search) • Ctrl+B (bookmarks) • ↑↓ (navigate suggestions)
      </div>
      {/* Trending Topics */}
      {trending.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 6, color: '#888', fontSize: 14 }}>Trending topics:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {trending.map((item, idx) => (
              <button
                key={item.query + idx}
                style={{
                  background: '#e3f2fd',
                  border: '1px solid #90caf9',
                  borderRadius: 16,
                  padding: '4px 12px',
                  fontSize: 14,
                  cursor: 'pointer',
                  marginBottom: 4
                }}
                onClick={() => {
                  setQuery(item.query);
                  searchFacts(item.query);
                }}
                aria-label={`Search for trending topic ${item.query}`}
              >
                {item.query}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* URL Input */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="url"
          placeholder="Paste a news/article URL to extract headline..."
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: 10,
            border: '2px solid #e0e0e0',
            borderRadius: 8,
            fontSize: 15
          }}
          aria-label="Paste a news or article URL"
        />
        <button
          onClick={extractHeadlineFromUrl}
          style={{
            ...styles.button,
            ...(loading || !urlInput.trim() ? styles.buttonDisabled : {})
          }}
          disabled={loading || !urlInput.trim()}
        >
          Extract Headline
        </button>
      </div>
      {urlExtractError && <div style={{ color: '#e74c3c', marginBottom: 10 }}>{urlExtractError}</div>}
      {!isApiKeyConfigured() && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: 8,
          padding: 20,
          marginBottom: 20,
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#856404', marginTop: 0 }}>🔑 API Key Required</h3>
          <p style={{ color: '#856404', marginBottom: 10 }}>
            To use this app, you need to set up your Google Fact Check API key.
          </p>
          <div style={{ textAlign: 'left', backgroundColor: '#f8f9fa', padding: 15, borderRadius: 5, fontSize: 14 }}>
            <strong>Steps to set up:</strong>
            <ol style={{ margin: '10px 0', paddingLeft: 20 }}>
              <li>Create a file called <code>.env.local</code> in the <code>factsy</code> folder</li>
              <li>Add this line: <code>REACT_APP_GOOGLE_FACT_CHECK_API_KEY=your_api_key_here</code></li>
              <li>Replace <code>your_api_key_here</code> with your actual API key</li>
              <li>Restart the development server</li>
            </ol>
            <p style={{ margin: '10px 0 0 0', fontSize: 12 }}>
              <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: '#3498db' }}>
                Get API key from Google Cloud Console →
              </a>
            </p>
          </div>
        </div>
      )}
      <div style={styles.searchContainer}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250 }} data-suggestions-container>
      <input
        id="fact-query"
        type="text"
            placeholder="Enter a claim or headline to fact-check..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => {
              // Delay to allow clicking on suggestions
              setTimeout(() => setInputFocused(false), 200);
            }}
        style={styles.input}
        aria-label="Enter a claim or headline"
        autoFocus
      />
          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: t.card,
              border: `1px solid ${t.border}`,
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              boxShadow: t.shadow,
              zIndex: 1000,
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion + index}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  onMouseEnter={() => setSelectedSuggestion(index)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 ? `1px solid ${t.border}` : 'none',
                    backgroundColor: selectedSuggestion === index ? t.accent + '20' : 'transparent',
                    color: t.text,
                    fontSize: '15px',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '14px', opacity: 0.7 }}>🔍</span>
                  <span style={{ 
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {suggestion}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      <button
          onClick={() => searchFacts()}
          style={{
            ...styles.button,
            ...(loading || !query.trim() || !isApiKeyConfigured() ? styles.buttonDisabled : {})
          }}
          disabled={loading || !query.trim() || !isApiKeyConfigured()}
        aria-label="Search for fact checks"
      >
          {!isApiKeyConfigured() ? "🔑 Setup Required" : loading ? "🔍 Searching..." : "🔍 Search"}
      </button>
      </div>

      {/* Search Statistics */}
      {searchStats.totalSearches > 0 && (
        <div style={{
          background: t.card,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          boxShadow: t.shadow
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 600, color: t.text }}>📊 Search Statistics</div>
            <button
              onClick={() => {
                generateTrendsData();
                setShowTrendsChart(!showTrendsChart);
              }}
              style={{
                background: t.accent,
                color: 'white',
                border: 'none',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {showTrendsChart ? '📊 Hide Charts' : '📈 Show Trends'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, fontSize: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: t.subtext, fontSize: 12 }}>Total Searches</div>
              <div style={{ fontWeight: 600, color: t.text, fontSize: 18 }}>{searchStats.totalSearches}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: t.subtext, fontSize: 12 }}>Successful</div>
              <div style={{ fontWeight: 600, color: t.text, fontSize: 18 }}>{searchStats.successfulSearches}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: t.subtext, fontSize: 12 }}>Avg Results</div>
              <div style={{ fontWeight: 600, color: t.text, fontSize: 18 }}>{searchStats.averageResults}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: t.subtext, fontSize: 12 }}>Last Search</div>
              <div style={{ fontWeight: 600, color: t.text, fontSize: 12 }}>
                {searchStats.lastSearchTime ? new Date(searchStats.lastSearchTime).toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </div>
          
          {/* Search Trends Charts */}
          {showTrendsChart && trendsData.categories && (
            <div style={{ marginTop: 20, borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                <SimpleBarChart 
                  data={trendsData.categories} 
                  title="Searches by Category" 
                  color="#3498db"
                  theme={theme}
                  themeStyles={themeStyles}
                />
                <SimpleBarChart 
                  data={trendsData.hourly} 
                  title="Searches by Hour" 
                  color="#e74c3c"
                  theme={theme}
                  themeStyles={themeStyles}
                />
                <SimpleBarChart 
                  data={trendsData.daily} 
                  title="Searches by Day" 
                  color="#2ecc71"
                  theme={theme}
                  themeStyles={themeStyles}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search History UI */}
      {history.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ color: '#888', fontSize: 14 }}>Recent searches:</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #e0e0e0',
                  borderRadius: 6,
                  fontSize: 12,
                  background: 'white'
                }}
              >
                <option value="">All Categories</option>
                {searchCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                onClick={() => setShowCategoryInput(!showCategoryInput)}
                style={{
                  background: '#e3f2fd',
                  border: '1px solid #90caf9',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 12,
                  cursor: 'pointer',
                  color: '#1565c0'
                }}
              >
                + Category
              </button>
            </div>
          </div>
          
          {showCategoryInput && (
            <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="New category name..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #e0e0e0',
                  borderRadius: 6,
                  fontSize: 12,
                  flex: 1
                }}
              />
              <button
                onClick={addCategory}
                style={{
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowCategoryInput(false);
                  setNewCategory('');
                }}
                style={{
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          )}
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(selectedCategory ? filteredHistory : history).map((item, idx) => {
              const query = typeof item === 'string' ? item : item.query;
              const category = typeof item === 'string' ? null : item.category;
              return (
                <div key={query + idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    style={{
                      background: '#f1f1f1',
                      border: '1px solid #e0e0e0',
                      borderRadius: 16,
                      padding: '4px 12px',
                      fontSize: 14,
                      cursor: 'pointer',
                      marginBottom: 4
                    }}
                    onClick={() => {
                      setQuery(query);
                      searchFacts(query);
                    }}
                    aria-label={`Search for ${query}`}
                  >
                    {query}
                  </button>
                  {category && (
                    <span style={{
                      background: '#e3f2fd',
                      color: '#1565c0',
                      padding: '2px 6px',
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: 600
                    }}>
                      {category}
                    </span>
                  )}
                </div>
              );
            })}
            <button
              style={{
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: 16,
                padding: '4px 12px',
                fontSize: 14,
                color: '#856404',
                cursor: 'pointer',
                marginBottom: 4
              }}
              onClick={() => setHistory([])}
              aria-label="Clear search history"
            >
              Clear History
            </button>
            <button
              style={{
                background: '#e8f5e8',
                border: '1px solid #c3e6c3',
                borderRadius: 16,
                padding: '4px 12px',
                fontSize: 14,
                color: '#2d5a2d',
                cursor: 'pointer',
                marginBottom: 4
              }}
              onClick={exportHistory}
              aria-label="Export search history"
            >
              📥 Export
            </button>
          </div>
        </div>
      )}

      {/* Bookmarks Section */}
      {bookmarks.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ color: '#2c3e50', margin: 0 }}>🔖 Bookmarks</h3>
            <button
              style={{
                background: '#e8f5e8',
                border: '1px solid #c3e6c3',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 14,
                color: '#2d5a2d',
                cursor: 'pointer',
                fontWeight: 600
              }}
              onClick={exportBookmarks}
              aria-label="Export bookmarks"
            >
              📥 Export Bookmarks
            </button>
          </div>
          <ul style={{ ...styles.list, background: '#f8f9fa', borderRadius: 8, padding: 16 }}>
            {bookmarks.map((claim, index) => {
              const review = claim.claimReview?.[0] || {};
              const factUrl = review.url || window.location.href;
              return (
                <li key={index} style={styles.listItem}>
                  <div style={styles.claimText}>{claim.text || "N/A"}</div>
                  <div style={styles.source}>Source: {review.publisher?.name || "Unknown"}</div>
                  <div style={{ margin: '8px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => toggleBookmark(claim)}
                      style={{
                        background: '#f8d7da',
                        color: '#721c24',
                        border: '1px solid #f5c6cb',
                        borderRadius: 16,
                        padding: '4px 12px',
                        fontSize: 14,
                        cursor: 'pointer',
                        marginRight: 8
                      }}
                      aria-label="Remove bookmark"
                    >
                      Remove Bookmark
                    </button>
                    <button
                      onClick={(e) => handleShare(factUrl, e)}
                      style={{
                        background: '#e3f2fd',
                        color: '#1565c0',
                        border: '1px solid #90caf9',
                        borderRadius: 16,
                        padding: '4px 12px',
                        fontSize: 14,
                        cursor: 'pointer',
                        marginRight: 8
                      }}
                      aria-label="Share fact check"
                    >
                      Share
                    </button>
                    <a
                      href={`https://www.snopes.com/search/?q=${encodeURIComponent(claim.text || '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: '#fffbe6',
                        color: '#b38f00',
                        border: '1px solid #ffe58f',
                        borderRadius: 16,
                        padding: '4px 12px',
                        fontSize: 14,
                        textDecoration: 'none',
                        fontWeight: 600
                      }}
                      aria-label="Search on Snopes"
                    >
                      Snopes
                    </a>
                    <a
                      href={`https://www.politifact.com/search/?q=${encodeURIComponent(claim.text || '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: '#e3f2fd',
                        color: '#1565c0',
                        border: '1px solid #90caf9',
                        borderRadius: 16,
                        padding: '4px 12px',
                        fontSize: 14,
                        textDecoration: 'none',
                        fontWeight: 600
                      }}
                      aria-label="Search on PolitiFact"
                    >
                      PolitiFact
                    </a>
                    {review.url && (
                      <a href={review.url} target="_blank" rel="noreferrer" style={styles.sourceLink}>
                        View Source
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Advanced Filters */}
      {results.length > 0 && (
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #e0e0e0',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20
        }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: '#2c3e50' }}>🔍 Filter Results</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={filters.rating}
              onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
              style={{
                padding: '8px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 14,
                minWidth: 120
              }}
            >
              <option value="">All Ratings</option>
              {uniqueRatings.map(rating => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
            <select
              value={filters.source}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
              style={{
                padding: '8px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 14,
                minWidth: 150
              }}
            >
              <option value="">All Sources</option>
              {uniqueSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Filter by text..."
              value={filters.text}
              onChange={(e) => setFilters(prev => ({ ...prev, text: e.target.value }))}
              style={{
                padding: '8px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 14,
                minWidth: 200
              }}
            />
            <button
              onClick={clearFilters}
              style={{
                background: '#fff3cd',
                color: '#856404',
                border: '1px solid #ffeaa7',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
          {/* Filter Summary */}
          <div style={{ marginTop: 12, fontSize: 14, color: '#666' }}>
            Showing {filteredResults.length} of {results.length} results
            {(filters.rating || filters.source || filters.text) && (
              <span style={{ marginLeft: 8 }}>
                (filtered by: {[filters.rating, filters.source, filters.text].filter(Boolean).join(', ')})
              </span>
            )}
          </div>
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}
      {loading && <SkeletonLoader theme={theme} themeStyles={themeStyles} />}

      {!loading && !error && results.length === 0 && query.trim() && (
        <div style={styles.noResults}>No fact checks found for this query.</div>
      )}

      {!loading && (
      <ul style={styles.list}>
        {filteredResults.map((claim, index) => {
          const review = claim.claimReview?.[0] || {};
          const rating = review.textualRating?.toLowerCase() || '';
          const factUrl = review.url || window.location.href;
          
          const getRatingStyle = (rating) => {
            if (rating.includes('true') || rating.includes('correct')) return styles.ratingTrue;
            if (rating.includes('false') || rating.includes('incorrect')) return styles.ratingFalse;
            if (rating.includes('mixed') || rating.includes('partially')) return styles.ratingMixed;
            return { backgroundColor: '#e0e0e0', color: '#555' };
          };

          return (
            <li 
              key={index} 
              style={styles.listItem}
              onMouseEnter={(e) => {
                e.target.style.transform = styles.listItemHover.transform;
                e.target.style.boxShadow = styles.listItemHover.boxShadow;
                handlePreviewEnter(claim, e);
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'none';
                e.target.style.boxShadow = styles.listItem.boxShadow;
                handlePreviewLeave();
              }}
            >
              <div style={styles.claimText}>
                {claim.text || "N/A"}
              </div>
              <div style={{ ...styles.rating, ...getRatingStyle(rating) }}>
                {review.textualRating || "N/A"}
              </div>
              <div style={styles.source}>
                Source: {review.publisher?.name || "Unknown"}
              </div>
              <div style={{ margin: '8px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => toggleBookmark(claim)}
                  style={{
                    background: isBookmarked(claim) ? '#d4edda' : '#f1f1f1',
                    color: isBookmarked(claim) ? '#155724' : '#555',
                    border: isBookmarked(claim) ? '1px solid #c3e6cb' : '1px solid #e0e0e0',
                    borderRadius: 16,
                    padding: '4px 12px',
                    fontSize: 14,
                    cursor: 'pointer',
                    marginRight: 8
                  }}
                  aria-label={isBookmarked(claim) ? "Remove bookmark" : "Add bookmark"}
                >
                  {isBookmarked(claim) ? 'Bookmarked' : 'Bookmark'}
                </button>
                <button
                  onClick={(e) => handleShare(factUrl, e)}
                  style={{
                    background: '#e3f2fd',
                    color: '#1565c0',
                    border: '1px solid #90caf9',
                    borderRadius: 16,
                    padding: '4px 12px',
                    fontSize: 14,
                    cursor: 'pointer',
                    marginRight: 8
                  }}
                  aria-label="Share fact check"
                >
                  Share
                </button>
                <a
                  href={`https://www.snopes.com/search/?q=${encodeURIComponent(claim.text || '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#fffbe6',
                    color: '#b38f00',
                    border: '1px solid #ffe58f',
                    borderRadius: 16,
                    padding: '4px 12px',
                    fontSize: 14,
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                  aria-label="Search on Snopes"
                >
                  Snopes
                </a>
                <a
                  href={`https://www.politifact.com/search/?q=${encodeURIComponent(claim.text || '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#e3f2fd',
                    color: '#1565c0',
                    border: '1px solid #90caf9',
                    borderRadius: 16,
                    padding: '4px 12px',
                    fontSize: 14,
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                  aria-label="Search on PolitiFact"
                >
                  PolitiFact
                </a>
              {review.url && (
                  <a 
                    href={review.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={styles.sourceLink}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    📰 View Full Fact Check →
                </a>
              )}
              </div>
            </li>
          );
        })}
      </ul>
      )}
      {/* Share Menu Popup */}
      {shareMenu.open && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.15)',
            zIndex: 1000
          }}
          onClick={closeShareMenu}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '30%',
              transform: 'translate(-50%, 0)',
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: 12,
              padding: 24,
              minWidth: 260,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Share this fact check</div>
            <button
              onClick={() => handleCopy(shareMenu.url)}
              style={{
                background: '#f1f1f1',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: '6px 16px',
                fontSize: 15,
                cursor: 'pointer',
                marginBottom: 8,
                width: '100%'
              }}
            >
              {copySuccess ? copySuccess : 'Copy Link'}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareMenu.url)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block',
                background: '#e8f5fd',
                color: '#1da1f2',
                border: '1px solid #b3e5fc',
                borderRadius: 8,
                padding: '6px 16px',
                fontSize: 15,
                textAlign: 'center',
                textDecoration: 'none',
                marginBottom: 8
              }}
            >
              Share on Twitter/X
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareMenu.url)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block',
                background: '#e7f3ff',
                color: '#1877f2',
                border: '1px solid #b3d8fd',
                borderRadius: 8,
                padding: '6px 16px',
                fontSize: 15,
                textAlign: 'center',
                textDecoration: 'none',
                marginBottom: 8
              }}
            >
              Share on Facebook
            </a>
            <button
              onClick={closeShareMenu}
              style={{
                background: '#fff3cd',
                color: '#856404',
                border: '1px solid #ffeaa7',
                borderRadius: 8,
                padding: '6px 16px',
                fontSize: 15,
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Close
            </button>
    </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
