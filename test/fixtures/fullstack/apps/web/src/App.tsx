import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { DetalheProduto } from './pages/DetalheProduto';
import { Cadastro } from './pages/Cadastro';
import { Checkout } from './pages/Checkout';
import { RequireAuth } from './routes/guards';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/produtos/:slug" element={<DetalheProduto />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <Checkout />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
