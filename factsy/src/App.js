// src/App.js
import React, { useState, useEffect, useRef } from "react";

// API key should be stored in .env.local file for security
const API_KEY = process.env.REACT_APP_GOOGLE_FACT_CHECK_API_KEY;

// Check if API key is configured
const isApiKeyConfigured = () => {
  return API_KEY && API_KEY !== "your_api_key_here" && API_KEY !== "AIzaSyD-9tS6d1qxJmMjt4S6b37qzI0J0PbwwoQ";
};

if (!isApiKeyConfigured()) {
  console.warn("⚠️ Google Fact Check API key not found. Please create a .env.local file with REACT_APP_GOOGLE_FACT_CHECK_API_KEY=your_key_here");
}

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
  const [toast, setToast] = useState("");
  const toastRef = useRef();

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

  // Add to history (no duplicates, most recent first, max 10)
  const addToHistory = (q) => {
    if (!q.trim()) return;
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== q.toLowerCase());
      return [q, ...filtered].slice(0, 10);
    });
    updateTrending(q);
  };

  // Add or remove a bookmark
  const toggleBookmark = (claim) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.text === claim.text && b.claimReview?.[0]?.url === claim.claimReview?.[0]?.url);
      if (exists) {
        return prev.filter((b) => !(b.text === claim.text && b.claimReview?.[0]?.url === claim.claimReview?.[0]?.url));
      } else {
        return [claim, ...prev];
      }
    });
  };

  // Check if a claim is bookmarked
  const isBookmarked = (claim) => {
    return bookmarks.some((b) => b.text === claim.text && b.claimReview?.[0]?.url === claim.claimReview?.[0]?.url);
  };

  // Search for fact-checked claims using the Google Fact Check Tools API
  const searchFacts = async (q) => {
    const searchQuery = typeof q === "string" ? q : query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    addToHistory(searchQuery);
    
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
      
      setResults(data.claims || []);
    } catch (err) {
      console.error("Search error:", err);
      setError("Error fetching facts: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key in input
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      searchFacts();
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

  // Filter results based on current filters
  const filteredResults = results.filter(claim => {
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

  // Get unique sources from results
  const uniqueSources = [...new Set(results.map(claim => claim.claimReview?.[0]?.publisher?.name).filter(Boolean))];

  // Get unique ratings from results
  const uniqueRatings = [...new Set(results.map(claim => claim.claimReview?.[0]?.textualRating).filter(Boolean))];

  // Clear all filters
  const clearFilters = () => {
    setFilters({ rating: '', source: '', text: '' });
  };

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

  // Define light and dark theme styles
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
    }
  };
  const t = themeStyles[theme];

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

  // Add header gradient
  const headerGradient = theme === 'light'
    ? 'linear-gradient(90deg, #e3f0ff 0%, #f4f6fb 100%)'
    : 'linear-gradient(90deg, #23262f 0%, #181a20 100%)';

  return (
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
        {/* Animated theme toggle */}
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
            marginLeft: 12,
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
      {/* Section divider */}
      <div style={{ height: 2, background: theme === 'light' ? 'linear-gradient(90deg,#e3f0ff,#f4f6fb)' : 'linear-gradient(90deg,#23262f,#181a20)', borderRadius: 2, margin: '0 0 18px 0' }} />
      {/* Toast notification */}
      <Toast message={toast} onClose={() => setToast("")} />
      <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: 30 }}>
        Fact-check claims and headlines using Google's Fact Check Tools
      </p>
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
        <input
          id="fact-query"
          type="text"
          placeholder="Enter a claim or headline to fact-check..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={styles.input}
          aria-label="Enter a claim or headline"
          autoFocus
        />
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

      {/* Search History UI */}
      {history.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 6, color: '#888', fontSize: 14 }}>Recent searches:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {history.map((item, idx) => (
              <button
                key={item + idx}
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
                  setQuery(item);
                  searchFacts(item);
                }}
                aria-label={`Search for ${item}`}
              >
                {item}
              </button>
            ))}
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
          </div>
        </div>
      )}

      {/* Bookmarks Section */}
      {bookmarks.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ color: '#2c3e50', marginBottom: 10 }}>🔖 Bookmarks</h3>
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
      {loading && <div style={styles.loading}>Loading results...</div>}

      {!loading && !error && results.length === 0 && query.trim() && (
        <div style={styles.noResults}>No fact checks found for this query.</div>
      )}

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
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'none';
                e.target.style.boxShadow = styles.listItem.boxShadow;
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
  );
}

export default App;
