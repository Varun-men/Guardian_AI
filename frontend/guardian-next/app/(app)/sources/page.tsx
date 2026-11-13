"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

type Source = {
  source_id: string;
  filename: string;
  file_type: string;
  version: number;
  status: string;
  created_at: string | null;
  passage_count: number;
};

type SourceResponse = {
  total: number;
  sources: Source[];
};

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10,
        fontFamily: "var(--mono)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "3px 9px",
        borderRadius: 999,
        border: `1px solid ${isActive ? "rgba(16,185,129,0.4)" : "rgba(245,184,46,0.4)"}`,
        background: isActive ? "rgba(16,185,129,0.1)" : "rgba(245,184,46,0.1)",
        color: isActive ? "#10b981" : "#F5B82E",
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: isActive ? "#10b981" : "#F5B82E",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadSources = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/sources/") as SourceResponse;
      setSources(data.sources ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sources.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSources(); }, [loadSources]);

  async function uploadSource() {
    if (!selectedFile) return;
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "txt"].includes(extension ?? "")) {
      setError("Only PDF and TXT files are supported.");
      return;
    }
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const result = await apiFetch("/api/sources/upload", { method: "POST", body: formData });
      setMessage(`${result.filename} uploaded — ${result.passage_count} passages extracted. Approval required before retrieval.`);
      setSelectedFile(null);
      if (fileInput.current) fileInput.current.value = "";
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function approveSource(source: Source) {
    if (!window.confirm(`Approve "${source.filename}" as a trusted evidence source?`)) return;
    setApproving(source.source_id);
    setError("");
    setMessage("");
    try {
      const result = await apiFetch(`/api/sources/${source.source_id}/approve`, { method: "POST" });
      setMessage(result.message ?? `${source.filename} is now active.`);
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setApproving(null);
    }
  }

  const activeCount = sources.filter((s) => s.status === "active").length;
  const pendingCount = sources.filter((s) => s.status === "pending").length;
  const passageTotal = sources.reduce((sum, s) => sum + s.passage_count, 0);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setSelectedFile(file); setError(""); setMessage(""); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 960, margin: "0 auto", fontFamily: "var(--sans)" }}>

      {/* Header */}
      <header>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" fill="#B0121B"/>
            <path d="M11 16l3.5 3.5L21 12" stroke="#F7ECE8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t3)", fontWeight: 600 }}>Evidence library</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: "clamp(32px, 4.5vw, 46px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.1, color: "var(--t1)", margin: "0 0 10px", fontFamily: "var(--sans)" }}>
              Trusted Sources
            </h1>
            <p style={{ color: "var(--t2)", fontSize: "15px", margin: 0, lineHeight: 1.6, maxWidth: 580, fontFamily: "var(--sans)" }}>
              Upload reference documents and approve them as trusted evidence for AI-backed claim verification.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadSources()}
            disabled={loading}
            style={{ padding: "10px 20px", borderRadius: 10, background: "var(--s1)", border: "1px solid var(--line)", color: "var(--t1)", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, transition: "border-color 0.15s", whiteSpace: "nowrap" }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.borderColor = "var(--t3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Total sources", value: sources.length, color: "var(--t1)" },
          { label: "Active", value: activeCount, color: "#10b981" },
          { label: "Passages indexed", value: passageTotal, color: "var(--redhi)" },
        ].map((item) => (
          <div
            key={item.label}
            style={{ background: "var(--s1)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px 22px" }}
          >
            <p style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--t3)", margin: "0 0 8px", fontWeight: 600 }}>{item.label}</p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 32, fontWeight: 700, color: item.color, margin: 0, lineHeight: 1 }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Feedback banners */}
      {message && (
        <div role="status" style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)", color: "#10b981", fontSize: 13, lineHeight: 1.5 }}>
          {message}
        </div>
      )}
      {error && (
        <div role="alert" style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(176,18,27,0.4)", background: "rgba(176,18,27,0.1)", color: "var(--redhi)", fontSize: 13, fontFamily: "var(--mono)" }}>
          {error}
        </div>
      )}

      {/* Upload Panel */}
      <section
        style={{ background: "var(--s1)", border: "1px solid var(--line)", borderRadius: 18, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}
        aria-label="Upload a source document"
      >
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--t1)", margin: "0 0 4px", fontFamily: "var(--sans)" }}>Upload reference document</h2>
          <p style={{ fontSize: 13, color: "var(--t2)", margin: 0, fontFamily: "var(--sans)" }}>Supported: PDF and TXT · Max 15 MB</p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInput.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "var(--blood)" : selectedFile ? "rgba(16,185,129,0.5)" : "var(--line)"}`,
            borderRadius: 12,
            padding: "28px 20px",
            textAlign: "center",
            cursor: "pointer",
            transition: "border-color 0.15s",
            background: dragOver ? "rgba(176,18,27,0.05)" : "var(--s2)",
          }}
        >
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            style={{ display: "none" }}
            onChange={(e) => { setSelectedFile(e.target.files?.[0] ?? null); setError(""); setMessage(""); }}
          />
          <div style={{ marginBottom: 10 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={selectedFile ? "#10b981" : "var(--t3)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          {selectedFile ? (
            <>
              <p style={{ color: "#10b981", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>{selectedFile.name}</p>
              <p style={{ color: "var(--t3)", fontSize: 12, fontFamily: "var(--mono)", margin: 0 }}>{(selectedFile.size / 1024).toFixed(1)} KB · Click to change</p>
            </>
          ) : (
            <>
              <p style={{ color: "var(--t2)", fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>Drop a file or click to browse</p>
              <p style={{ color: "var(--t3)", fontSize: 12, margin: 0 }}>PDF or TXT, up to 15 MB</p>
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260, background: "var(--s2)", border: "1px solid rgba(176,18,27,0.2)", borderRadius: 10, padding: "10px 14px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--redhi)", margin: "0 0 3px" }}>Notice: Upload requires human approval</p>
            <p style={{ fontSize: 12, color: "var(--t3)", margin: 0, lineHeight: 1.5 }}>Each document starts as pending. A reviewer must approve it before Guardian can use its passages as trusted evidence.</p>
          </div>
          <button
            type="button"
            onClick={() => void uploadSource()}
            disabled={!selectedFile || uploading}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: !selectedFile || uploading ? "rgba(176,18,27,0.3)" : "linear-gradient(135deg,#8c0e15,#b0121b)",
              color: "#fff",
              border: "none",
              cursor: !selectedFile || uploading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 14,
              whiteSpace: "nowrap",
              boxShadow: !selectedFile || uploading ? "none" : "0 0 16px rgba(176,18,27,0.4)",
              transition: "opacity 0.15s",
              alignSelf: "center",
            }}
          >
            {uploading ? "Uploading…" : "Upload source"}
          </button>
        </div>
      </section>

      {/* Sources List */}
      <section aria-label="Uploaded sources">
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--t1)", margin: 0, fontFamily: "var(--sans)" }}>Uploaded documents</h2>
          {pendingCount > 0 && (
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#F5B82E", letterSpacing: "0.06em", background: "rgba(245,184,46,0.1)", border: "1px solid rgba(245,184,46,0.3)", padding: "3px 10px", borderRadius: 999 }}>
              {pendingCount} pending approval
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {loading ? (
            <div style={{ background: "var(--s1)", border: "1px solid var(--line)", borderRadius: 14, padding: "32px 20px", textAlign: "center", color: "var(--t3)", fontSize: 13, fontFamily: "var(--mono)" }}>
              Loading sources…
            </div>
          ) : sources.length === 0 ? (
            <div style={{ background: "var(--s1)", border: "2px dashed var(--line)", borderRadius: 14, padding: "48px 20px", textAlign: "center" }}>
              <p style={{ color: "var(--t1)", fontWeight: 600, fontSize: 15, margin: "0 0 6px" }}>No sources uploaded yet</p>
              <p style={{ color: "var(--t3)", fontSize: 13, margin: 0 }}>Upload your first PDF or TXT reference document above.</p>
            </div>
          ) : (
            sources.map((source) => (
              <article
                key={source.source_id}
                style={{ background: "var(--s1)", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, transition: "border-color 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(242,103,95,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <h3 style={{ fontWeight: 600, color: "var(--t1)", fontSize: 14, margin: 0, wordBreak: "break-all" }}>{source.filename}</h3>
                    <StatusBadge status={source.status} />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--t3)" }}>
                    <span>{source.file_type.toUpperCase()}</span>
                    <span>v{source.version}</span>
                    <span>{source.passage_count} passages</span>
                    {source.created_at && <span>{new Date(source.created_at).toLocaleString()}</span>}
                  </div>
                  <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t3)", margin: "6px 0 0", opacity: 0.6, wordBreak: "break-all" }}>
                    ID: {source.source_id}
                  </p>
                </div>

                {source.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => void approveSource(source)}
                    disabled={approving === source.source_id}
                    style={{ padding: "9px 18px", borderRadius: 10, background: "linear-gradient(135deg,#8c0e15,#b0121b)", color: "#fff", border: "none", cursor: approving === source.source_id ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", opacity: approving === source.source_id ? 0.6 : 1, boxShadow: "0 0 12px rgba(176,18,27,0.3)" }}
                  >
                    {approving === source.source_id ? "Approving…" : "Approve source"}
                  </button>
                )}

                {source.status === "active" && (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981", fontWeight: 500 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                    Trusted for retrieval
                  </span>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}


