import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

const VALGROUP_LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663302060218/QL2UL8CxjNhyEyN9sTX7sh/LogoValgroupColorida_05a02042.png";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, loading, setLocation]);

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#0f2318] to-slate-900 relative overflow-hidden">
      {/* Blobs decorativos */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#2d6a2d]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#1a3a5c]/30 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4 flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-white rounded-2xl px-8 py-4 shadow-2xl">
            <img
              src={VALGROUP_LOGO}
              alt="Valgroup"
              className="h-12 w-auto object-contain"
            />
          </div>
          <p className="text-green-400 text-sm font-semibold tracking-widest uppercase">
            KPI — Visão Geral
          </p>
          <p className="text-slate-400 text-xs">BA1 · Unidade Bahia</p>
        </div>

        {/* Card de login */}
        <Card className="w-full border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
          <CardHeader className="text-center pb-3">
            {/* Badge página protegida */}
            <div className="flex justify-center mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                Página Protegida
              </span>
            </div>
            <CardTitle className="text-xl text-white">Bem-vindo</CardTitle>
            <CardDescription className="text-slate-300 text-sm">
              Faça login com sua conta corporativa Microsoft para acessar o dashboard de manutenção
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              onClick={handleLogin}
              className="w-full h-12 bg-white text-slate-900 hover:bg-slate-100 font-semibold text-sm gap-3 shadow-lg"
              size="lg"
            >
              {/* Ícone Microsoft */}
              <svg viewBox="0 0 21 21" className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              Entrar com Microsoft
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 text-slate-500 bg-transparent">Acesso Corporativo</span>
              </div>
            </div>

            <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center space-y-1">
              <p className="text-xs text-slate-300 leading-relaxed">
                Acesso exclusivo para colaboradores Valgroup.
              </p>
              <p className="text-xs text-slate-300">
                Utilize sua conta{" "}
                <strong className="text-green-400 font-semibold">@VALGROUPCO.COM</strong>{" "}
                para autenticar.
              </p>
              <p className="text-xs text-slate-400">
                Apenas colaboradores autorizados têm acesso.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-slate-500">Feito por Karen Alvez</p>
      </div>
    </div>
  );
}
