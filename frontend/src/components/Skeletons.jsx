import React from "react";

/**
 * Base Skeleton block element with accessible ARIA semantics.
 */
export function SkeletonBlock({ className = "", width, height, borderRadius, style = {} }) {
  return (
    <div
      className={`skeleton-block ${className}`}
      style={{
        width: width || "100%",
        height: height || "1rem",
        borderRadius: borderRadius || "var(--radius-sm, 8px)",
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton Loader for Dashboard page (matches Dashboard.jsx grid & hero structure)
 */
export function DashboardSkeleton() {
  return (
    <div className="db-root skeleton-wrapper" role="status" aria-busy="true" aria-label="Loading dashboard...">
      <header className="db-header">
        <SkeletonBlock width="120px" height="28px" borderRadius="6px" />
        <SkeletonBlock width="90px" height="38px" borderRadius="20px" />
      </header>

      <div className="db-hero" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <SkeletonBlock width="60%" height="42px" borderRadius="10px" style={{ marginBottom: "1rem" }} />
        <SkeletonBlock width="40%" height="20px" borderRadius="6px" />
      </div>

      <div className="db-section">
        <div className="db-section-title">
          <SkeletonBlock width="180px" height="28px" borderRadius="6px" />
        </div>
        <div className="db-grid-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="db-card skeleton-card">
              <SkeletonBlock width="44px" height="44px" borderRadius="12px" style={{ marginBottom: "1.25rem" }} />
              <SkeletonBlock width="75%" height="24px" borderRadius="6px" style={{ marginBottom: "0.75rem" }} />
              <SkeletonBlock width="95%" height="16px" borderRadius="4px" style={{ marginBottom: "0.5rem" }} />
              <SkeletonBlock width="80%" height="16px" borderRadius="4px" style={{ marginBottom: "1.5rem" }} />
              <SkeletonBlock width="100%" height="44px" borderRadius="10px" style={{ marginTop: "auto" }} />
            </div>
          ))}
        </div>
      </div>

      <div className="db-divider" />

      <div className="db-section">
        <div className="db-section-title">
          <SkeletonBlock width="160px" height="28px" borderRadius="6px" />
        </div>
        <div className="db-grid-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="hiw-card skeleton-card">
              <SkeletonBlock width="32px" height="32px" borderRadius="50%" style={{ marginBottom: "1rem" }} />
              <SkeletonBlock width="70%" height="22px" borderRadius="6px" style={{ marginBottom: "0.75rem" }} />
              <SkeletonBlock width="100%" height="15px" borderRadius="4px" style={{ marginBottom: "0.5rem" }} />
              <SkeletonBlock width="85%" height="15px" borderRadius="4px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton Loader for History page (matches History.jsx cards & layout)
 */
export function HistorySkeleton() {
  return (
    <div className="history-container skeleton-wrapper" role="status" aria-busy="true" aria-label="Loading past interviews...">
      <div style={{ flex: 1 }}>
        <div className="history-header-row">
          <SkeletonBlock width="220px" height="36px" borderRadius="8px" />
          <SkeletonBlock width="130px" height="40px" borderRadius="20px" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1.5rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="history-card skeleton-card">
              <div className="history-card-top">
                <div className="history-card-type" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <SkeletonBlock width="24px" height="24px" borderRadius="6px" />
                  <SkeletonBlock width="120px" height="18px" borderRadius="4px" />
                </div>
                <SkeletonBlock width="100px" height="26px" borderRadius="12px" />
              </div>

              <SkeletonBlock width="55%" height="26px" borderRadius="6px" style={{ margin: "1rem 0 0.8rem 0" }} />

              <div className="history-card-meta" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", margin: "0.5rem 0 1.25rem 0" }}>
                <SkeletonBlock width="90px" height="22px" borderRadius="6px" />
                <SkeletonBlock width="110px" height="22px" borderRadius="6px" />
                <SkeletonBlock width="95px" height="22px" borderRadius="6px" />
              </div>

              <div className="history-btns" style={{ display: "flex", gap: "0.75rem" }}>
                <SkeletonBlock width="130px" height="40px" borderRadius="10px" />
                <SkeletonBlock width="100px" height="40px" borderRadius="10px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton Loader for Interview Result Report (matches InterviewResult.jsx layout)
 */
export function InterviewResultSkeleton() {
  return (
    <div className="report-container skeleton-wrapper" role="status" aria-busy="true" aria-label="Generating interview report...">
      <div className="report-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <SkeletonBlock width="140px" height="40px" borderRadius="20px" />
        <SkeletonBlock width="200px" height="32px" borderRadius="8px" />
      </div>

      <div className="report-summary-card skeleton-card" style={{ marginBottom: "2rem" }}>
        <SkeletonBlock width="40%" height="28px" borderRadius="6px" style={{ marginBottom: "1rem" }} />
        <SkeletonBlock width="90%" height="16px" borderRadius="4px" style={{ marginBottom: "0.5rem" }} />
        <SkeletonBlock width="75%" height="16px" borderRadius="4px" style={{ marginBottom: "1.5rem" }} />

        <div className="score-rings-grid" style={{ display: "flex", justifyContent: "space-around", gap: "1rem", marginTop: "1.5rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <SkeletonBlock width="96px" height="96px" borderRadius="50%" />
              <SkeletonBlock width="80px" height="16px" borderRadius="4px" />
            </div>
          ))}
        </div>
      </div>

      <div className="report-section-title" style={{ marginBottom: "1rem" }}>
        <SkeletonBlock width="180px" height="24px" borderRadius="6px" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="report-qa-card skeleton-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", width: "80%" }}>
                <SkeletonBlock width="45px" height="24px" borderRadius="12px" />
                <SkeletonBlock width="70%" height="20px" borderRadius="4px" />
              </div>
              <SkeletonBlock width="24px" height="24px" borderRadius="50%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton Loader for Live/Video Interview Session (matches LiveInterview.jsx & VideoInterview.jsx)
 */
export function InterviewSessionSkeleton() {
  return (
    <div className="live-container skeleton-wrapper" role="status" aria-busy="true" aria-label="Preparing interview session...">
      <div className="live-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <SkeletonBlock width="200px" height="28px" borderRadius="6px" />
        <SkeletonBlock width="120px" height="24px" borderRadius="12px" />
      </div>

      <div className="live-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div className="live-card skeleton-card" style={{ height: "340px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <SkeletonBlock width="100%" height="100%" borderRadius="16px" />
        </div>
        <div className="live-card skeleton-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <SkeletonBlock width="40%" height="24px" borderRadius="6px" />
          <SkeletonBlock width="95%" height="18px" borderRadius="4px" />
          <SkeletonBlock width="85%" height="18px" borderRadius="4px" />
          <SkeletonBlock width="60%" height="18px" borderRadius="4px" />
          <div style={{ marginTop: "auto", display: "flex", gap: "1rem" }}>
            <SkeletonBlock width="100%" height="46px" borderRadius="10px" />
          </div>
        </div>
      </div>
    </div>
  );
}
