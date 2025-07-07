import React, { useEffect, useState } from "react";

export default function Options() {
  const [factsyUrl, setFactsyUrl] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [status, setStatus] = useState("");

  // Load options from chrome.storage
  useEffect(() => {
    if (window.chrome && chrome.storage) {
      chrome.storage.local.get(["factsy_url", "factsy_dark_mode"], (result) => {
        setFactsyUrl(result.factsy_url || "");
        setDarkMode(!!result.factsy_dark_mode);
      });
    } else {
      setFactsyUrl(localStorage.getItem("factsy_url") || "");
      setDarkMode(localStorage.getItem("factsy_dark_mode") === "true");
    }
  }, []);

  // Save options
  const saveOptions = () => {
    if (window.chrome && chrome.storage) {
      chrome.storage.local.set({
        factsy_url: factsyUrl,
        factsy_dark_mode: darkMode
      }, () => setStatus("Saved!"));
    } else {
      localStorage.setItem("factsy_url", factsyUrl);
      localStorage.setItem("factsy_dark_mode", darkMode);
      setStatus("Saved!");
    }
    setTimeout(() => setStatus(""), 1500);
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, fontFamily: 'sans-serif', background: darkMode ? '#181c20' : '#fff', color: darkMode ? '#f1f1f1' : '#222', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginTop: 0 }}>Factsy Extension Options</h2>
      <div style={{ marginBottom: 18 }}>
        <label htmlFor="factsy-url" style={{ fontWeight: 600 }}>Factsy App URL:</label>
        <input
          id="factsy-url"
          type="url"
          value={factsyUrl}
          onChange={e => setFactsyUrl(e.target.value)}
          placeholder="https://your-factsy-app-url.com"
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ccc', marginTop: 6, fontSize: 15, background: darkMode ? '#222' : '#fff', color: darkMode ? '#f1f1f1' : '#222' }}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={e => setDarkMode(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          Enable Dark Mode by default
        </label>
      </div>
      <button
        onClick={saveOptions}
        style={{
          background: darkMode ? '#222' : '#3498db',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: 16,
          cursor: 'pointer',
          marginBottom: 8
        }}
      >
        Save
      </button>
      {status && <span style={{ marginLeft: 12, color: '#43a047' }}>{status}</span>}
    </div>
  );
} 