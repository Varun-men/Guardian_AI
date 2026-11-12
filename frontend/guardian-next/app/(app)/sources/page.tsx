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

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

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

      const result = await apiFetch("/api/sources/upload", {
        method: "POST",
        body: formData,
      });

      setMessage(
        result.filename + " uploaded successfully. " +
        result.passage_count + " passages extracted. Approval is required before retrieval."
      );

      setSelectedFile(null);

      if (fileInput.current) {
        fileInput.current.value = "";
      }

      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function approveSource(source: Source) {
    if (!window.confirm('Approve "' + source.filename + '" as a trusted evidence source?')) {
      return;
    }

    setApproving(source.source_id);
    setError("");
    setMessage("");

    try {
      const result = await apiFetch(
        "/api/sources/" + source.source_id + "/approve",
        { method: "POST" }
      );

      setMessage(result.message ?? (source.filename + " is now active."));
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

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-display)]">
            Trusted Sources
          </h1>
          <p className="text-[#a1a1aa] text-sm mt-1">
            Upload reference documents and approve them for evidence retrieval.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadSources()}
          disabled={loading}
          className="btn btn-secondary"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "TOTAL SOURCES", value: sources.length },
          { label: "ACTIVE SOURCES", value: activeCount },
          { label: "STORED PASSAGES", value: passageTotal },
        ].map((item) => (
          <div key={item.label} className="panel p-5">
            <p className="text-[11px] tracking-wider text-[#a1a1aa] font-mono">
              {item.label}
            </p>
            <p className="text-2xl font-semibold text-white mt-2 font-mono">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      {message && (
        <div role="status" className="panel p-4 border border-emerald-500/30 bg-emerald-500/10 rounded-xl text-sm text-emerald-300">
          {message}
        </div>
      )}

      {error && (
        <div role="alert" className="panel p-4 border border-red-500/30 bg-red-500/10 rounded-xl text-sm text-red-300">
          {error}
        </div>
      )}

      <section className="panel p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Upload reference document
          </h2>
          <p className="text-sm text-[#a1a1aa] mt-1">
            Supported formats: PDF and TXT. Maximum file size: 15 MB.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0] ?? null);
              setError("");
              setMessage("");
            }}
            className="block w-full text-sm text-[#a1a1aa] file:mr-4 file:rounded-lg file:border-0 file:bg-[#ff6b00]/15 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-[#ff9500]"
          />

          <button
            type="button"
            onClick={() => void uploadSource()}
            disabled={!selectedFile || uploading}
            className="btn btn-primary whitespace-nowrap"
          >
            {uploading ? "Uploading..." : "Upload source"}
          </button>
        </div>

        {selectedFile && (
          <p className="text-xs text-[#a1a1aa] font-mono">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}

        <div className="rounded-lg border border-[#ff6b00]/20 bg-[#ff6b00]/5 p-4">
          <p className="text-sm font-medium text-[#ff9500]">
            Upload does not automatically trust a document.
          </p>
          <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
            Each upload starts as pending. Review the document and approve it
            before Guardian AI can retrieve its passages as trusted evidence.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-label="Uploaded sources">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">
            Uploaded documents
          </h2>
          <span className="text-xs text-[#a1a1aa] font-mono">
            {pendingCount} pending approval
          </span>
        </div>

        {loading ? (
          <div className="panel p-8 text-center text-sm text-[#a1a1aa]">
            Loading sources...
          </div>
        ) : sources.length === 0 ? (
          <div className="panel p-10 text-center">
            <p className="text-white font-medium">No sources uploaded yet</p>
            <p className="text-sm text-[#a1a1aa] mt-2">
              Upload your first PDF or TXT reference document above.
            </p>
          </div>
        ) : (
          sources.map((source) => (
            <article
              key={source.source_id}
              className="panel p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-white break-all">
                    {source.filename}
                  </h3>

                  <span
                    className={
                      "text-[10px] px-2 py-1 rounded-full border font-mono uppercase " +
                      (source.status === "active"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-[#ff9500]/30 bg-[#ff9500]/10 text-[#ff9500]")
                    }
                  >
                    {source.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-[#a1a1aa] font-mono">
                  <span>{source.file_type.toUpperCase()}</span>
                  <span>v{source.version}</span>
                  <span>{source.passage_count} passages</span>
                  {source.created_at && (
                    <span>{new Date(source.created_at).toLocaleString()}</span>
                  )}
                </div>

                <p className="text-[10px] text-[#71717a] font-mono mt-2 break-all">
                  ID: {source.source_id}
                </p>
              </div>

              {source.status === "pending" && (
                <button
                  type="button"
                  onClick={() => void approveSource(source)}
                  disabled={approving === source.source_id}
                  className="btn btn-primary whitespace-nowrap"
                >
                  {approving === source.source_id ? "Approving..." : "Approve source"}
                </button>
              )}

              {source.status === "active" && (
                <span className="text-xs text-emerald-300 font-medium">
                  Trusted for retrieval
                </span>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
