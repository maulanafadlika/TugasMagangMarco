import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth } from "@/layouts";
import GoogleCallback from "./pages/auth/GoogleCallback";

function App() {
  return (
    <Routes>
      <Route path="/dashboard/*" element={<Dashboard />} />
      <Route path="/auth/google-callback" element={<GoogleCallback/>} />
      <Route path="/auth/*" element={<Auth />} />
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}

export default App;
