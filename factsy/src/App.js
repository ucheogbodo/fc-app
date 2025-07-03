// src/App.js
import React, { useState } from "react";

// TODO: Move API key to environment variable for security
const API_KEY = "AIzaSyD-9tS6d1qxJmMjt4S6b37qzI0J0PbwwoQ";

const styles = {
  container: { padding: 20 },
  input: { width: 300, padding: 10 },
  button: { marginLeft: 10, padding: '10px 20px' },
  list: { marginTop: 30 },
  listItem: { marginTop: 20, padding: 15, border: '1px solid #eee', borderRadius: 8 },
  error: { color: 'red', marginTop: 20 },
  loading: { marginTop: 20, fontStyle: 'italic' },
  noResults: { marginTop: 20, color: '#555' },
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
    try {
      const response = await fetch(
        `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(query)}&key=${API_KEY}`
      );
      if (!response.ok) {
        throw new Error("API request failed");
      }
      const data = await response.json();
      setResults(data.claims || []);
    } catch (err) {
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
      <h1>🕵️ Factsy</h1>
      <label htmlFor="fact-query" style={{ display: 'block', marginBottom: 8 }}>
        Enter a claim or headline:
      </label>
      <input
        id="fact-query"
        type="text"
        placeholder="e.g. The earth is flat"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        style={styles.input}
        aria-label="Enter a claim or headline"
        autoFocus
      />
      <button
        onClick={searchFacts}
        style={styles.button}
        disabled={loading || !query.trim()}
        aria-label="Search for fact checks"
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {error && <div style={styles.error}>{error}</div>}
      {loading && <div style={styles.loading}>Loading results...</div>}

      {!loading && !error && results.length === 0 && query.trim() && (
        <div style={styles.noResults}>No fact checks found for this query.</div>
      )}

      <ul style={styles.list}>
        {results.map((claim, index) => {
          const review = claim.claimReview?.[0] || {};
          return (
            <li key={index} style={styles.listItem}>
              <strong>Claim:</strong> {claim.text || "N/A"} <br />
              <strong>Rating:</strong> {review.textualRating || "N/A"} <br />
              <strong>Source:</strong> {review.publisher?.name || "Unknown"} <br />
              {review.url && (
                <a href={review.url} target="_blank" rel="noreferrer">
                  View Source
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
