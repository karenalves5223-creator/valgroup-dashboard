import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  BarChart3,
  BrainCircuit,
  Lightbulb,
  Loader2,
  RefreshCw,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type AnalysisType = "overview" | "machines" | "trends" | "optimization";

const ANALYSIS_TABS: {
  id: AnalysisType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    id: "overview",
    label: "Visão Geral",
    icon: BarChart3,
    description: "Resumo executivo dos indicadores de manutenção",
  },
  {
    id: "machines",
    label: "Máquinas",
    icon: Wrench,
    description: "Análise detalhada por equipamento",
  },
  {
    id: "trends",
    label: "Tendências",
    icon: TrendingUp,
    description: "Padrões temporais e sazonalidade",
  },
  {
    id: "optimization",
    label: "Otimização",
    icon: Lightbulb,
    description: "Sugestões de melhoria e plano de ação",
  },
];

function AnalysisCard({
  type,
  icon: Icon,
  title,
  description,
}: {
  type: AnalysisType;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);

  const generateMutation = trpc.analysis.generate.useMutation();

  const handleGenerate = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const result = await generateMutation.mutateAsync({
        analysisType: type,
        forceRefresh,
      });
      setContent(result.content);
      setIsCached(result.cached);
      if (!forceRefresh && result.cached) {
        toast.info("Análise carregada do cache.");
      } else {
        toast.success("Análise gerada com sucesso!");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao gerar análise.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {content && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleGenerate(true)}
                disabled={loading}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            )}
            {!content && (
              <Button
                size="sm"
                onClick={() => handleGenerate(false)}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="h-4 w-4" />
                    Gerar Análise
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <BrainCircuit className="h-5 w-5 text-primary absolute inset-0 m-auto" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Analisando dados com IA...</p>
              <p className="text-xs text-muted-foreground mt-1">Isso pode levar alguns segundos</p>
            </div>
          </div>
        )}

        {!loading && !content && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="p-4 rounded-full bg-muted">
              <BrainCircuit className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Análise não gerada</p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique em "Gerar Análise" para obter insights com IA sobre os dados de manutenção
              </p>
            </div>
          </div>
        )}

        {!loading && content && (
          <div className="space-y-3">
            {isCached && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                <AlertCircle className="h-3.5 w-3.5" />
                Análise carregada do cache (última hora). Clique em "Atualizar" para regenerar.
              </div>
            )}
            <div className="prose prose-sm max-w-none">
              <Streamdown>{content}</Streamdown>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Analysis() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">Análises Inteligentes</h1>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 gap-1.5 text-xs">
              <BrainCircuit className="h-3 w-3" />
              Powered by AI
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Insights automáticos sobre padrões de manutenção, máquinas problemáticas e oportunidades de otimização
          </p>
        </div>

        {/* Info card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <BrainCircuit className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Como funciona</p>
                <p className="text-muted-foreground mt-0.5">
                  A IA analisa os dados de manutenção em tempo real e gera relatórios detalhados com insights 
                  sobre padrões, anomalias e recomendações estratégicas. As análises são cacheadas por 1 hora 
                  para otimizar o desempenho.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de análise */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 h-auto gap-1 p-1">
            {ANALYSIS_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2 text-xs py-2">
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {ANALYSIS_TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <AnalysisCard
                type={tab.id}
                icon={tab.icon}
                title={tab.label}
                description={tab.description}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
