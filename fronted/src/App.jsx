
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import BattlePokemon from "./pages/BattlePokemon";
import Dashboard from "./pages/Dashboard";
import MyPokemonTeam from "./pages/MyPokemonTeam";
import RankingPage from "./pages/RankingPage";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import PrivateRoute from "./components/PrivateRoute";
import ArcadeBattle from "./pages/ArcadeBattle";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />

        <main className="pt-24 max-w-7xl mx-auto p-8 text-center">
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/battle"
              element={
                <PrivateRoute>
                  <BattlePokemon />
                </PrivateRoute>
              }
            />

            <Route
              path="/pokemonTeam"
              element={
                <PrivateRoute>
                  <MyPokemonTeam />
                </PrivateRoute>
              }
            />

            <Route
              path="/ranking"
              element={
                <PrivateRoute>
                  <RankingPage />
                </PrivateRoute>
              }
            />

            <Route path="/arcade" element={<ArcadeBattle />} />

            <Route path="/" element={<Navigate to="/login" />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
