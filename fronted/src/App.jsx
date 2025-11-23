import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import BattlePokemon from "./pages/BattlePokemon";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import './App.css'
import Header from "./components/header";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header /> {/* El Header se renderizará en todas las páginas */}
        <main className="pt-24 max-w-7xl mx-auto p-8 text-center">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/pokemons" element={<BattlePokemon />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
