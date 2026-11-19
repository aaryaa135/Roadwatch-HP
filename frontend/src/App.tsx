import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { PublicLayout } from "./components/layout/PublicLayout";
import { RequireAdmin, RequireAuth } from "./components/layout/ProtectedRoute";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Overview } from "./pages/Overview";
import { HazardMap } from "./pages/HazardMap";
import { ReportHazard } from "./pages/ReportHazard";
import { AllReports } from "./pages/AllReports";
import { ReportDetails } from "./pages/ReportDetails";
import { Verification } from "./pages/Verification";
import { Analytics } from "./pages/Analytics";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<RequireAuth />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Overview />} />
          <Route path="map" element={<HazardMap />} />
          <Route path="report" element={<ReportHazard />} />
          <Route path="reports" element={<AllReports />} />
          <Route path="reports/:id" element={<ReportDetails />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route element={<RequireAdmin />}>
            <Route path="verification" element={<Verification />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
