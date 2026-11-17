// Homepage — News feed with: Category Tabs, Infinite Scroll,
// Search History, Bookmark button, and AI Summarizer (Gemini)

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDarkMode } from "../../context/DarkModeContext";
import api from "../../api";
import logo from "../../assets/logo16-1.png";
import srch from "../../assets/srch.png";
import "./HomePage.css";

const NEWS_API_KEY = process.env.REACT_APP_NEWS_API_KEY;
const NEWS_URL     = "https://newsapi.org/v2/everything?";
const PAGE_SIZE    = 20;
const MAX_HISTORY  = 5;

const CATEGORIES = [
  { id: "India",         label: "Top",          icon: "fas fa-fire" },
  { id: "technology",    label: "Technology",   icon: "fas fa-microchip" },
  { id: "sports",        label: "Sports",       icon: "fas fa-futbol" },
  { id: "business",      label: "Business",     icon: "fas fa-briefcase" },
  { id: "health",        label: "Health",       icon: "fas fa-heartbeat" },
  { id: "entertainment", label: "Entertainment",icon: "fas fa-film" },
];

// ── Live clock ──────────────────────────────────────────────────────
const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  return (
    <div className="live-clock">
      <span className="clock-time">{timeStr}</span>
      <span className="clock-date">{dateStr}</span>
    </div>
  );
};

// ── Profile dropdown ────────────────────────────────────────────────
const ProfileMenu = ({ firstName, email, onLogout }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initial = (firstName || "?")[0].toUpperCase();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="profile-menu" ref={ref}>
      <button className="avatar-btn" onClick={() => setOpen(v => !v)} aria-label="Profile menu" aria-expanded={open}>
        {initial}
      </button>
      {open && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-info">
            <div className="profile-dropdown-avatar">{initial}</div>
            <div className="profile-dropdown-text">
              <span className="profile-dropdown-name">{firstName}</span>
              <span className="profile-dropdown-email">{email}</span>
            </div>
          </div>
          <div className="profile-dropdown-divider" />
          <button className="profile-dropdown-item" onClick={() => { setOpen(false); navigate("/profile"); }}>
            <i className="fas fa-user" /> View Profile
          </button>
          <button className="profile-dropdown-item" onClick={() => { setOpen(false); navigate("/bookmarks"); }}>
            <i className="fas fa-bookmark" /> Saved Articles
          </button>
          <div className="profile-dropdown-divider" />
          <button className="profile-dropdown-logout" onClick={onLogout}>
            <i className="fas fa-sign-out-alt" /> Log out
          </button>
        </div>
      )}
    </div>
  );
};

// ── Summary modal ───────────────────────────────────────────────────
const SummaryModal = ({ summary, title, onClose }) => (
  <div className="summary-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Article summary">
    <div className="summary-modal" onClick={e => e.stopPropagation()}>
      <div className="summary-header">
        <div className="summary-badge"><i className="fas fa-robot" /> AI Summary</div>
        <button className="summary-close" onClick={onClose} aria-label="Close"><i className="fas fa-times" /></button>
      </div>
      <h3 className="summary-title">{title}</h3>
      <p className="summary-body">{summary}</p>
    </div>
  </div>
);

// ── News card ───────────────────────────────────────────────────────
const NewsCard = ({ article, onBookmark, bookmarkedUrls, onSummarize, summarizing, idx }) => {
  const isBookmarked = bookmarkedUrls.has(article.url);
  const pubDate  = new Date(article.publishedAt);
  const now      = new Date();
  const diffHrs  = Math.floor((now - pubDate) / 3600000);
  const diffDays = Math.floor((now - pubDate) / 86400000);
  const timeAgo  =
    diffHrs  < 1  ? "Just now"
    : diffHrs < 24 ? `${diffHrs}h ago`
    : diffDays < 7 ? `${diffDays}d ago`
    : pubDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const textBlob  = [article.title || "", article.description || "", article.content || ""].join(" ");
  const wc        = textBlob.split(/\s+/).filter(Boolean).length;
  const estimated = article.content ? wc * 4 : wc * 12;
  const readMins  = Math.max(1, Math.round(estimated / 200));

  return (
    <div className="card">
      <div className="card-header" onClick={() => window.open(article.url, "_blank")} style={{ cursor: "pointer" }}>
        <img
          src={article.urlToImage}
          alt={article.title || "News"}
          loading={idx < 8 ? "eager" : "lazy"}
          onError={e => { e.target.onerror = null; e.target.src = "https://placehold.co/400x200/1e293b/64748b?text=No+Image"; }}
        />
        <div className="card-read-time">{readMins} min read</div>
        {article.source?.name && (
          <div className="card-category-chip">{article.source.name}</div>
        )}
      </div>

      <div className="card-content">
        <h5
          className="news-title"
          onClick={() => window.open(article.url, "_blank")}
          style={{ cursor: "pointer" }}
        >
          {article.title}
        </h5>

        <div className="card-meta-row">
          <span className="news-source-badge">{article.source.name}</span>
          <span className="news-time">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            {timeAgo}
          </span>
        </div>

        <p className="news-des">{article.description}</p>

        <div className="card-actions-row">
          <button
            className={`card-action-btn summarize-btn${summarizing ? " loading" : ""}`}
            onClick={() => onSummarize(article)}
            disabled={summarizing}
            title="AI Summarize"
          >
            {summarizing ? <span className="mini-spinner" /> : <i className="fas fa-robot" />}
            {summarizing ? "Summarizing…" : "Summarize"}
          </button>
          <button
            className={`card-action-btn bookmark-btn${isBookmarked ? " bookmarked" : ""}`}
            onClick={() => onBookmark(article)}
            title={isBookmarked ? "Remove bookmark" : "Save article"}
            aria-label={isBookmarked ? "Remove bookmark" : "Save article"}
          >
            <i className={isBookmarked ? "fas fa-bookmark" : "far fa-bookmark"} />
            {isBookmarked ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Search + dark toggle + avatar ───────────────────────────────────
const SearchControls = ({
  isVoiceListening, toggleVoiceSearch,
  searchQuery, setSearchQuery,
  message, setMessage,
  handleKeyDown, handleSearch,
  searchInputRef,
  darkMode, toggleDarkMode,
  firstName, email, onLogout,
}) => (
  <>
    <div className="search-bar">
      <button
        className={`news-mic-btn${isVoiceListening ? " listening" : ""}`}
        onClick={toggleVoiceSearch}
        aria-label={isVoiceListening ? "Stop voice search" : "Voice search"}
        title={isVoiceListening ? "Stop listening" : "Search by voice"}
        type="button"
      >
        {isVoiceListening ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        )}
      </button>
      <input
        type="text" className="news-input"
        placeholder={isVoiceListening ? "Listening…" : "Search news…"}
        value={searchQuery}
        onChange={e => { setSearchQuery(e.target.value); if (message) setMessage(""); }}
        onKeyDown={handleKeyDown}
        ref={searchInputRef}
        aria-label="Search news"
        autoComplete="off"
      />
      <button className="search-button" onClick={handleSearch} aria-label="Search">
        <img src={srch} alt="" aria-hidden="true" />
      </button>
    </div>
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      <button className="toggle-button" onClick={toggleDarkMode} aria-label="Toggle dark mode">
        <div className="icons">
          {darkMode ? <i className="fas fa-sun" /> : <i className="fas fa-moon" />}
        </div>
      </button>
      <ProfileMenu firstName={firstName} email={email} onLogout={onLogout} />
    </div>
  </>
);

// ── Main HomePage ───────────────────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();

  const firstName = (localStorage.getItem("firstName") || "").slice(0, 20);
  const email     = localStorage.getItem("email") || "";

  const [menuOpen, setMenuOpen] = useState(false);

  const navRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const voiceRecognitionRef = useRef(null);

  const [articles,       setArticles]       = useState([]);
  const [currentQuery,   setCurrentQuery]   = useState("India");
  const [activeCategory, setActiveCategory] = useState("India");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchHistory,  setSearchHistory]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("newsSearchHistory") || "[]"); } catch { return []; }
  });
  const [message,        setMessage]        = useState("");
  const [loading,        setLoading]        = useState(false);
  const [page,           setPage]           = useState(1);
  const [hasMore,        setHasMore]        = useState(true);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [bookmarkedUrls, setBookmarkedUrls] = useState(new Set());
  const [summaryData,    setSummaryData]    = useState(null);
  const [summarizingUrl, setSummarizingUrl] = useState(null);

  const searchInputRef = useRef(null);
  const sentinelRef    = useRef(null);

  useEffect(() => {
    api.get("/bookmarks")
      .then(res => setBookmarkedUrls(new Set(res.data.map(b => b.url))))
      .catch(() => {});
  }, []);

  const fetchNews = useCallback(async (query, lang = "en") => {
    setMessage(""); setLoading(true); setArticles([]); setPage(1); setHasMore(true);
    try {
      const url = `${NEWS_URL}q=${encodeURIComponent(query)}&apiKey=${NEWS_API_KEY}&language=${lang}&pageSize=${PAGE_SIZE}&page=1&sortBy=publishedAt`;
      const res = await fetch(url);
      if (!res.ok) { setMessage(`Error: ${res.statusText || "Unknown error"}`); setLoading(false); return; }
      const data = await res.json();
      const withImg = (data.articles || [])
        .filter(a => a.urlToImage)
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      setArticles(withImg);
      setHasMore((data.articles || []).length === PAGE_SIZE);
      if (withImg.length === 0) setMessage("No articles found. Try a different search term.");
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const url = `${NEWS_URL}q=${encodeURIComponent(currentQuery)}&apiKey=${NEWS_API_KEY}&language=en&pageSize=${PAGE_SIZE}&page=${nextPage}&sortBy=publishedAt`;
      const res = await fetch(url);
      if (!res.ok) { setHasMore(false); return; }
      const data = await res.json();
      const withImg = (data.articles || []).filter(a => a.urlToImage);
      setArticles(prev => {
        const existing = new Set(prev.map(a => a.url));
        return [...prev, ...withImg.filter(a => !existing.has(a.url))];
      });
      setPage(nextPage);
      if (withImg.length < PAGE_SIZE) setHasMore(false);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [currentQuery, page, hasMore, loadingMore]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loading) fetchMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchMore, hasMore, loading]);

  useEffect(() => { fetchNews("India"); }, [fetchNews]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US"; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsVoiceListening(false);
      setSearchHistory(prev => {
        const updated = [transcript, ...prev.filter(h => h.toLowerCase() !== transcript.toLowerCase())].slice(0, MAX_HISTORY);
        localStorage.setItem("newsSearchHistory", JSON.stringify(updated));
        return updated;
      });
      setCurrentQuery(transcript); setActiveCategory(null); fetchNews(transcript);
    };
    rec.onerror = () => setIsVoiceListening(false);
    rec.onend   = () => setIsVoiceListening(false);
    voiceRecognitionRef.current = rec;
  }, [fetchNews]);

  const toggleVoiceSearch = useCallback(() => {
    if (!voiceRecognitionRef.current) return;
    if (isVoiceListening) { voiceRecognitionRef.current.stop(); setIsVoiceListening(false); }
    else { voiceRecognitionRef.current.start(); setIsVoiceListening(true); setSearchQuery(""); }
  }, [isVoiceListening]);

  const onCategoryClick = useCallback((catId) => {
    setActiveCategory(catId); setCurrentQuery(catId); setSearchQuery(""); fetchNews(catId);
  }, [fetchNews]);

  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    if (!q) { setMessage("Please enter a search term."); searchInputRef.current?.focus(); return; }
    setSearchHistory(prev => {
      const updated = [q, ...prev.filter(h => h.toLowerCase() !== q.toLowerCase())].slice(0, MAX_HISTORY);
      localStorage.setItem("newsSearchHistory", JSON.stringify(updated));
      return updated;
    });
    setCurrentQuery(q); setActiveCategory(null); fetchNews(q);
  }, [fetchNews, searchQuery]);

  const handleKeyDown = useCallback(e => { if (e.key === "Enter") handleSearch(); }, [handleSearch]);

  const removeHistory = useCallback((term) => {
    setSearchHistory(prev => {
      const updated = prev.filter(h => h !== term);
      localStorage.setItem("newsSearchHistory", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleBookmark = useCallback(async (article) => {
    const url = article.url;
    if (bookmarkedUrls.has(url)) {
      try {
        const res = await api.get("/bookmarks");
        const bm = res.data.find(b => b.url === url);
        if (bm) await api.delete(`/bookmarks/${bm.id}`);
        setBookmarkedUrls(prev => { const s = new Set(prev); s.delete(url); return s; });
      } catch { alert("Could not remove bookmark."); }
    } else {
      try {
        await api.post("/bookmarks", { url, title: article.title, image: article.urlToImage, source: article.source?.name || "" });
        setBookmarkedUrls(prev => new Set([...prev, url]));
      } catch (err) {
        if (err.response?.status === 409) alert("Already bookmarked.");
        else alert("Could not save bookmark.");
      }
    }
  }, [bookmarkedUrls]);

  const handleSummarize = useCallback(async (article) => {
    setSummarizingUrl(article.url);
    const GEMINI_KEY = process.env.REACT_APP_GEMINI_API_KEY;
    if (!GEMINI_KEY || GEMINI_KEY === "your_gemini_api_key_here" || !GEMINI_KEY.startsWith("AIza")) {
      setSummaryData({ title: article.title, text: "Gemini API key not configured. Add REACT_APP_GEMINI_API_KEY to frontend/.env and restart." });
      setSummarizingUrl(null); return;
    }
    const content = `Summarize this news article in exactly 3 clear, concise sentences:\n\nTitle: ${article.title}\nDescription: ${article.description || ""}\nContent: ${(article.content || "").substring(0, 1000)}`;
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];
    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
          { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: content }] }], generationConfig: { maxOutputTokens: 300, temperature: 0.3 } }) }
        );
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) { setSummaryData({ title: article.title, text: text.trim() }); setSummarizingUrl(null); return; }
        if (data?.error?.code === 429) continue;
        if (data?.error) { setSummaryData({ title: article.title, text: `Gemini error: ${data.error.message}` }); setSummarizingUrl(null); return; }
      } catch {
        // try next model
      }
    }
    setSummaryData({ title: article.title, text: "All Gemini models are rate-limited. Please wait 30 seconds and try again." });
    setSummarizingUrl(null);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("firstName");
    localStorage.removeItem("email");
    navigate("/");
  }, [navigate]);

  const searchControlsProps = {
    isVoiceListening, toggleVoiceSearch,
    searchQuery, setSearchQuery,
    message, setMessage,
    handleKeyDown, handleSearch,
    searchInputRef,
    darkMode, toggleDarkMode,
    firstName, email,
    onLogout: handleLogout,
  };

  return (
    <>
      <nav ref={navRef}>
        <div className="nav_top">
          <div className="nav-shimmer" />

          <button
            className="company-logo"
            onClick={() => window.location.reload()}
            aria-label="Reload page"
          >
            <img src={logo} alt="Site logo" />
          </button>

          <div className={`nav-links${menuOpen ? " active" : ""}`}>
            <ul>
              <li><Link to="/weather"   onClick={() => setMenuOpen(false)}><i className="fas fa-cloud-sun" />Weather</Link></li>
              <li><Link to="/notes"     onClick={() => setMenuOpen(false)}><i className="fas fa-sticky-note" />Notes</Link></li>
              <li><Link to="/bookmarks" onClick={() => setMenuOpen(false)}><i className="fas fa-bookmark" />Bookmarks</Link></li>
            </ul>
          </div>

          <button
            className={`hamburger${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>

          <div className="assign">
            <LiveClock />
            <SearchControls {...searchControlsProps} />
          </div>
        </div>
      </nav>

      <div className="mobile-search-row">
        <SearchControls {...searchControlsProps} />
      </div>

      {searchHistory.length > 0 && (
        <div className="search-history-bar">
          <span className="sh-label"><i className="fas fa-history" /> Recent:</span>
          {searchHistory.map(term => (
            <div key={term} className="sh-chip">
              <span onClick={() => { setSearchQuery(term); setCurrentQuery(term); setActiveCategory(null); fetchNews(term); }}>
                {term}
              </span>
              <button className="sh-remove" onClick={() => removeHistory(term)} aria-label={`Remove ${term}`}>×</button>
            </div>
          ))}
        </div>
      )}

      <div className="category-tabs-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`cat-tab-btn${activeCategory === cat.id ? " active" : ""}`}
            onClick={() => onCategoryClick(cat.id)}
          >
            <i className={cat.icon} />{cat.label}
          </button>
        ))}
      </div>

      {message && <div className="page-message">{message}</div>}

      <div className="cards-container">
        {loading ? (
          <div className="news-loader">
            <div className="dots"><span /><span /><span /></div>
            <div className="loading-text">Loading the latest stories…</div>
          </div>
        ) : articles.length > 0 ? (
          articles.map((article, idx) => (
            <NewsCard
              key={article.url || idx}
              article={article}
              onBookmark={handleBookmark}
              bookmarkedUrls={bookmarkedUrls}
              onSummarize={handleSummarize}
              summarizing={summarizingUrl === article.url}
              idx={idx}
            />
          ))
        ) : (
          !message && <div className="no-news">No articles found. Try a different search.</div>
        )}
      </div>

      <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" />
      {loadingMore && (
        <div className="load-more-spinner">
          <div className="dots"><span /><span /><span /></div>
          <span>Loading more…</span>
        </div>
      )}
      {!hasMore && articles.length > 0 && (
        <p className="no-more-text">You've reached the end of results.</p>
      )}

      {summaryData && (
        <SummaryModal title={summaryData.title} summary={summaryData.text} onClose={() => setSummaryData(null)} />
      )}
    </>
  );
};

export default HomePage;
