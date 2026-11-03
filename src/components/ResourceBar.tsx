import { useGame } from "../store/game";
import { RESOURCE_IDS, RESOURCE_META } from "../engine/resources";
import { formatNumber } from "../hooks/useFormatNumber";

const iconPaths = [
  "M5 19 19 5M7 5h12v12M4 20l5-5",
  "m12 3 8 5-2 10-6 3-6-3L4 8l8-5Z",
  "M6 20c0-7 12-7 12-16M8 5c1 4 5 5 9 3",
  "M12 3c-3 4-6 7-6 11a6 6 0 0 0 12 0c0-4-3-7-6-11Z",
  "M12 3c-3 4-6 7-6 11a6 6 0 0 0 12 0c0-4-3-7-6-11Z",
  "m12 3 8 5-2 10-6 3-6-3L4 8l8-5Z",
  "M5 19c0-8 3-13 7-13s7 5 7 13M7 14h10"
];

export function ResourceBar(): React.JSX.Element {
  const resources = useGame((state) => state.resources);
  return (
    <header className="resource-bar">
      {RESOURCE_IDS.map((id, index) => (
        <div className="resource-item" key={id}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d={iconPaths[index]} />
          </svg>
          <span className="resource-name">{RESOURCE_META[id].short}</span>
          <strong>{formatNumber(resources[id])}</strong>
        </div>
      ))}
    </header>
  );
}
