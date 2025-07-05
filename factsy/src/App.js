// src/App.js
import React, { useState } from "react";

// API key should be stored in .env.local file for security
const API_KEY = process.env.REACT_APP_GOOGLE_FACT_CHECK_API_KEY;

// Check if API key is configured
const isApiKeyConfigured = () => {
  return API_KEY && API_KEY !== "your_api_key_here" && API_KEY !== "AIzaSyD-9tS6d1qxJmMjt4S6b37qzI0J0PbwwoQ";
};

if (!isApiKeyConfigured()) {
  console.warn("⚠️ Google Fact Check API key not found. Please create a .env.local file with REACT_APP_GOOGLE_FACT_CHECK_API_KEY=your_key_here");
}

const styles = {
  container: { 
    padding: 20, 
    maxWidth: 800, 
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search for fact-checked claims using the Google Fact Check Tools API
  const searchFacts = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    
    // Debug: Log API key status
    console.log("API Key configured:", isApiKeyConfigured());
    console.log("API Key length:", API_KEY ? API_KEY.length : 0);
    console.log("API Key starts with:", API_KEY ? API_KEY.substring(0, 8) : "none");
    
    try {
      const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(query)}&key=${API_KEY}`;
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

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>🕵️ Factsy</h1>
      <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: 30 }}>
        Fact-check claims and headlines using Google's Fact Check Tools
      </p>
      
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
          onClick={searchFacts}
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

      {error && <div style={styles.error}>{error}</div>}
      {loading && <div style={styles.loading}>Loading results...</div>}

      {!loading && !error && results.length === 0 && query.trim() && (
        <div style={styles.noResults}>No fact checks found for this query.</div>
      )}

      <ul style={styles.list}>
        {results.map((claim, index) => {
          const review = claim.claimReview?.[0] || {};
          const rating = review.textualRating?.toLowerCase() || '';
          
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default App;
