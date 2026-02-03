import React, { useState } from 'react';
import './App.css';
import { API_BASE_URL } from './config';

interface PasteResponse {
  id: string;
  url: string;
}

function App() {
  const [content, setContent] = useState('');
  const [ttlSeconds, setTtlSeconds] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PasteResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const requestBody: any = { content };
      
      if (ttlSeconds) {
        const ttl = parseInt(ttlSeconds);
        if (isNaN(ttl) || ttl < 1) {
          throw new Error('TTL must be a positive integer');
        }
        requestBody.ttl_seconds = ttl;
      }
      
      if (maxViews) {
        const views = parseInt(maxViews);
        if (isNaN(views) || views < 1) {
          throw new Error('Max views must be a positive integer');
        }
        requestBody.max_views = views;
      }

      const response = await fetch(`${API_BASE_URL}/api/pastes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create paste');
      }

      const data: PasteResponse = await response.json();
      setResult(data);
      setContent('');
      setTtlSeconds('');
      setMaxViews('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Pastebin Lite</h1>
        <p>Create a shareable text paste</p>
        
        <form onSubmit={handleSubmit} className="paste-form">
          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your text here..."
              required
              rows={10}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ttl">TTL (seconds, optional)</label>
              <input
                id="ttl"
                type="number"
                value={ttlSeconds}
                onChange={(e) => setTtlSeconds(e.target.value)}
                placeholder="e.g., 3600"
                min="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxViews">Max Views (optional)</label>
              <input
                id="maxViews"
                type="number"
                value={maxViews}
                onChange={(e) => setMaxViews(e.target.value)}
                placeholder="e.g., 10"
                min="1"
              />
            </div>
          </div>

          <button type="submit" disabled={loading || !content.trim()}>
            {loading ? 'Creating...' : 'Create Paste'}
          </button>
        </form>

        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="result">
            <h3>Paste Created!</h3>
            <p>
              <strong>Shareable URL:</strong>{' '}
              <a href={result.url} target="_blank" rel="noopener noreferrer">
                {result.url}
              </a>
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(result.url)}
              className="copy-button"
            >
              Copy URL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
