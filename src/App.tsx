import { Route, Routes } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicForm from "./pages/PublicForm";
import Login from "./pages/Login";
import Inbox from "./pages/Inbox";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/c/:agencySlug" element={<PublicForm />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
