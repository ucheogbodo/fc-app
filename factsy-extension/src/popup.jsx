import React, { useEffect, useState } from "react";

const DEFAULT_FACTSY_URL = "https://your-factsy-app-url.com"; // fallback if not set
const HISTORY_KEY = "factsy_extension_history";
const HISTORY_LIMIT = 10;

export default function Popup() {
  const [text, setText] = useState("");
  const [factsyUrl, setFactsyUrl] = useState(DEFAULT_FACTSY_URL);
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState([]);

  // Load Factsy URL, dark mode, and history
  useEffect(() => {
    if (window.chrome && chrome.storage) {
      chrome.storage.local.get(["factsy_url", "factsy_dark_mode", HISTORY_KEY], (result) => {
        setFactsyUrl(result.factsy_url || DEFAULT_FACTSY_URL);
        setDarkMode(!!result.factsy_dark_mode);
        setHistory(result[HISTORY_KEY] || []);
      });
    } else {
      setFactsyUrl(localStorage.getItem("factsy_url") || DEFAULT_FACTSY_URL);
      setDarkMode(localStorage.getItem("factsy_dark_mode") === "true");
      setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"));
    }
  }, []);

  // Save dark mode preference
  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      if (window.chrome && chrome.storage) {
        chrome.storage.local.set({ factsy_dark_mode: !prev });
      } else {
        localStorage.setItem("factsy_dark_mode", !prev);
      }
      return !prev;
    });
  };

  // Try to get selected text from the current tab
  useEffect(() => {
    if (window.chrome && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: () => window.getSelection().toString(),
          },
          (results) => {
            if (results && results[0] && results[0].result) {
              setText(results[0].result);
            }
          }
        );
      });
    }
  }, []);

  // Add to history and save
  const addToHistory = (q) => {
    if (!q.trim()) return;
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== q.toLowerCase());
      const newHistory = [q, ...filtered].slice(0, HISTORY_LIMIT);
      if (window.chrome && chrome.storage) {
        chrome.storage.local.set({ [HISTORY_KEY]: newHistory });
      } else {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      }
      return newHistory;
    });
  };

  const openFactsy = () => {
    const url = `${factsyUrl}?q=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    addToHistory(text);
  };

  const bg = darkMode ? "#181c20" : "#fff";
  const fg = darkMode ? "#f1f1f1" : "#222";
  const border = darkMode ? "#333" : "#ccc";
  const btnBg = darkMode ? "#222" : "#3498db";
  const btnFg = darkMode ? "#fff" : "#fff";
  const btnBorder = darkMode ? "#444" : "#3498db";

  return (
    <div style={{ minWidth: 300, padding: 16, fontFamily: 'sans-serif', background: bg, color: fg, borderRadius: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Factsy Fact-Check</h3>
        <button
          onClick={toggleDarkMode}
          style={{
            background: darkMode ? '#333' : '#f1f1f1',
            color: darkMode ? '#ffe082' : '#333',
            border: 'none',
            borderRadius: 16,
            padding: '4px 12px',
            fontSize: 13,
            cursor: 'pointer',
            marginLeft: 8
          }}
          aria-label="Toggle dark mode"
        >
          {darkMode ? '🌙' : '☀️'}
        </button>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste or highlight text to check..."
        rows={4}
        style={{ width: '100%', borderRadius: 8, border: `1px solid ${border}`, padding: 8, fontSize: 15, marginBottom: 12, background: darkMode ? '#222' : '#fff', color: fg }}
      />
      <button
        onClick={openFactsy}
        disabled={!text.trim()}
        style={{
          width: '100%',
          padding: '10px 0',
          borderRadius: 8,
          border: `1px solid ${btnBorder}`,
          background: btnBg,
          color: btnFg,
          fontSize: 16,
          cursor: text.trim() ? 'pointer' : 'not-allowed',
        }}
      >
        Fact-check with Factsy
      </button>
      {/* History Section */}
      {history.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ color: '#888', fontSize: 14, marginBottom: 6 }}>Recent fact-checks:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {history.map((item, idx) => (
              <button
                key={item + idx}
                style={{
                  background: darkMode ? '#222' : '#f1f1f1',
                  border: `1px solid ${border}`,
                  borderRadius: 16,
                  padding: '4px 12px',
                  fontSize: 14,
                  cursor: 'pointer',
                  marginBottom: 4,
                  color: fg
                }}
                onClick={() => setText(item)}
                aria-label={`Use previous query: ${item}`}
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
              onClick={() => {
                setHistory([]);
                if (window.chrome && chrome.storage) {
                  chrome.storage.local.set({ [HISTORY_KEY]: [] });
                } else {
                  localStorage.setItem(HISTORY_KEY, "[]");
                }
              }}
              aria-label="Clear history"
            >
              Clear History
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 