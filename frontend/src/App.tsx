import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { Dashboard } from "./pages/Dashboard";
import { CaseDetail } from "./pages/CaseDetail";
import { ClusterDetail } from "./pages/ClusterDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/case/:id" element={<CaseDetail />} />
        <Route path="/cluster/:id" element={<ClusterDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
