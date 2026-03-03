import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black text-amber-400">404</h1>
        <p className="text-xl text-white/60">Página não encontrada</p>
        <Link to="/dashboard" className="inline-block mt-4 text-sm text-amber-400 underline underline-offset-4 hover:text-amber-300">
          Voltar ao Painel
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
