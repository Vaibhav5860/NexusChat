import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, X, Github, Mail, Send, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const ISSUE_TYPES = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "other", label: "Other" },
];

export default function ReportIssue() {
  const [isOpen, setIsOpen] = useState(false);
  const [issueType, setIssueType] = useState("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [issueUrl, setIssueUrl] = useState("");

  const reset = () => {
    setIssueType("bug");
    setTitle("");
    setDescription("");
    setSubmitted(false);
    setLoading(false);
    setError("");
    setIssueUrl("");
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(reset, 300);
  };

  const handleSubmitGitHub = async () => {
    if (!title.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/report/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, issueType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create issue");
      setIssueUrl(data.issueUrl || "");
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEmail = async () => {
    if (!title.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/report/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, issueType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/10"
        title="Report an issue"
      >
        <Bug className="h-4 w-4" />
        <span className="hidden sm:inline">Report Issue</span>
      </button>

      {/* Modal overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-2xl"
            >
              {!submitted ? (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Bug className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold text-foreground">Report an Issue</h2>
                    </div>
                    <button
                      onClick={handleClose}
                      className="text-muted-foreground hover:text-foreground transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Issue type */}
                  <div className="mb-4">
                    <label className="text-sm text-muted-foreground mb-1.5 block">
                      Issue type
                    </label>
                    <div className="flex gap-2">
                      {ISSUE_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setIssueType(type.value)}
                          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition border ${
                            issueType === type.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <label className="text-sm text-muted-foreground mb-1.5 block">
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief summary of the issue..."
                      className="w-full rounded-lg bg-muted border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-5">
                    <label className="text-sm text-muted-foreground mb-1.5 block">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      rows={4}
                      className="w-full rounded-lg bg-muted border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
                    />
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {/* Submit buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmitGitHub}
                      disabled={!title.trim() || loading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Github className="h-4 w-4" />
                      )}
                      Submit on GitHub
                    </button>
                    <button
                      onClick={handleSubmitEmail}
                      disabled={!title.trim() || loading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-muted border border-border text-foreground font-medium text-sm transition hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Send Email
                    </button>
                  </div>
                </>
              ) : (
                /* Success state */
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Send className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Thank you!</h3>
                    <p className="text-sm text-muted-foreground">
                      Your report helps us improve NexusChat.
                    </p>
                    {issueUrl && (
                      <a
                        href={issueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline"
                      >
                        <Github className="h-3.5 w-3.5" />
                        View issue on GitHub
                      </a>
                    )}
                  </div>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 rounded-lg bg-muted border border-border text-sm text-foreground hover:border-primary/50 transition"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
