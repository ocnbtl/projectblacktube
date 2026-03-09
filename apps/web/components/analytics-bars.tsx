interface AnalyticsBarsProps {
  tracksSeen: number;
  skipsTriggered: number;
  promptsTriggered: number;
  matchedTracks: number;
}

export function AnalyticsBars({
  tracksSeen,
  skipsTriggered,
  promptsTriggered,
  matchedTracks
}: AnalyticsBarsProps) {
  const metrics = [
    { label: "Tracks seen", value: tracksSeen, tone: "sage" },
    { label: "Matches found", value: matchedTracks, tone: "gold" },
    { label: "Skips triggered", value: skipsTriggered, tone: "ink" },
    { label: "Prompts triggered", value: promptsTriggered, tone: "rose" }
  ];

  const maxValue = Math.max(...metrics.map((metric) => metric.value));

  return (
    <div className="analytics-bars">
      {metrics.map((metric) => (
        <div key={metric.label} className="bar-card">
          <div className="bar-card-top">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
          <div className="bar-track">
            <div
              className={`bar-fill ${metric.tone}`}
              style={{ width: `${(metric.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

