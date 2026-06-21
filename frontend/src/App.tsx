import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import AppShell from "./layouts/AppShell";
import BottleneckDashboard from "./pages/BottleneckDashboard";
import CompanyHeatmap from "./pages/CompanyHeatmap";
import Dashboard from "./pages/Dashboard";
import DependencyGraph from "./pages/DependencyGraph";
import LandingPage from "./pages/LandingPage";
import NarrativeExplorer from "./pages/NarrativeExplorer";
import OpportunityMatrix from "./pages/OpportunityMatrix";
import PipelineConsole from "./pages/PipelineConsole";
import { PIPELINE_ENABLED } from "./lib/features";
import ReportViewer from "./pages/ReportViewer";
import ScoringHeatmap from "./pages/ScoringHeatmap";

/** Redirect legacy bookmarks (/narratives, /heatmap, …) into /app/* */
function LegacyAppRedirect() {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={`/app${pathname}${search}${hash}`} replace />;
}

const legacyPrefixes = [
  "/narratives",
  "/graph",
  "/bottlenecks",
  "/opportunities",
  "/companies",
  "/heatmap",
  "/pipeline",
];

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/app" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="narratives" element={<NarrativeExplorer />} />
        <Route path="narratives/:slug" element={<ReportViewer />} />
        <Route path="graph" element={<DependencyGraph />} />
        <Route path="bottlenecks" element={<BottleneckDashboard />} />
        <Route path="opportunities" element={<OpportunityMatrix />} />
        <Route path="companies" element={<CompanyHeatmap />} />
        <Route path="heatmap" element={<ScoringHeatmap />} />
        <Route
          path="pipeline"
          element={PIPELINE_ENABLED ? <PipelineConsole /> : <Navigate to="/app" replace />}
        />
      </Route>

      {legacyPrefixes.map((prefix) => (
        <Route key={prefix} path={`${prefix}/*`} element={<LegacyAppRedirect />} />
      ))}
    </Routes>
  );
}
