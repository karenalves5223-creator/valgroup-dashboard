import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  Calendar,
  ChevronDown,
  Clock,
  Filter,
  Layers,
  RotateCcw,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];

interface Filters {
  maquinas: string[];
  tiposOrdem: string[];
  tiposOperacao: string[];
  dataInicio: string;
  dataFim: string;
}

function FilterPopover({
  label,
  options,
  selected,
  onToggle,
  onSelectAll,
  onClearAll,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <Filter className="h-3.5 w-3.5" />
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{label}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onSelectAll}>
              Todos
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onClearAll}>
              Limpar
            </Button>
          </div>
        </div>
        <Separator className="mb-2" />
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {options.map((opt) => (
            <div key={opt} className="flex items-center gap-2 py-0.5">
              <Checkbox
                id={`filter-${opt}`}
                checked={selected.includes(opt)}
                onCheckedChange={() => onToggle(opt)}
              />
              <Label htmlFor={`filter-${opt}`} className="text-xs cursor-pointer leading-tight">
                {opt}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [filters, setFilters] = useState<Filters>({
    maquinas: [],
    tiposOrdem: [],
    tiposOperacao: [],
    dataInicio: "",
    dataFim: "",
  });

  const { data: filterOptions } = trpc.maintenance.filterOptions.useQuery();
  const { data: stats, isLoading, error: statsError } = trpc.maintenance.stats.useQuery({
    maquinas: filters.maquinas.length > 0 ? filters.maquinas : undefined,
    tiposOrdem: filters.tiposOrdem.length > 0 ? filters.tiposOrdem : undefined,
    tiposOperacao: filters.tiposOperacao.length > 0 ? filters.tiposOperacao : undefined,
    dataInicio: filters.dataInicio || undefined,
    dataFim: filters.dataFim || undefined,
  });

  const toggleFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const clearAllFilters = () => {
    setFilters({ maquinas: [], tiposOrdem: [], tiposOperacao: [], dataInicio: "", dataFim: "" });
  };

  const hasActiveFilters =
    filters.maquinas.length > 0 ||
    filters.tiposOrdem.length > 0 ||
    filters.tiposOperacao.length > 0 ||
    filters.dataInicio ||
    filters.dataFim;

  // Preparar dados dos gráficos
  // Detectar quais anos estão presentes nos dados filtrados
  const yearsPresent = Array.from(
    new Set((stats?.byMonth ?? []).map((m) => m.ano))
  ).sort() as number[];

  const monthlyData = MONTHS.map((mes, i) => {
    const mesNum = i + 1;
    const row: Record<string, string | number> = { mes };
    for (const ano of yearsPresent) {
      const entry = stats?.byMonth.find((m) => m.ano === ano && m.mes === mesNum);
      row[String(ano)] = entry ? parseFloat(Number(entry.totalHoras).toFixed(2)) : 0;
    }
    return row;
  });

  const monthlyChartTitle =
    yearsPresent.length === 1
      ? `Horas Mensais — ${yearsPresent[0]}`
      : `Comparação Mensal — ${yearsPresent.join(" vs ")}`;

  const categoryData = (stats?.byCategory ?? []).map((c) => ({
    name: c.tipoOrdem.length > 20 ? c.tipoOrdem.slice(0, 20) + "…" : c.tipoOrdem,
    fullName: c.tipoOrdem,
    horas: parseFloat(Number(c.totalHoras).toFixed(2)),
    ordens: c.totalOrdens,
  }));

  const machineData = (stats?.byMachine ?? []).slice(0, 5).map((m) => ({
    name: m.maquina.length > 22 ? m.maquina.slice(0, 22) + "…" : m.maquina,
    fullName: m.maquina,
    horas: parseFloat(Number(m.totalHoras).toFixed(2)),
    ordens: m.totalOrdens,
  }));

  const totalHoras = parseFloat(Number(stats?.totalHoras ?? 0).toFixed(2));
  const totalOrdens = stats?.totalOrdens ?? 0;
  const totalMaquinas = filterOptions?.maquinas.length ?? 0;
  const avgHorasPorOrdem = totalOrdens > 0 ? (totalHoras / totalOrdens).toFixed(2) : "0.00";

  // Verificar erro de domínio
  if (statsError?.data?.code === "FORBIDDEN") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="p-4 rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold text-red-700 mb-2">Acesso Não Autorizado</h2>
            <p className="text-muted-foreground text-sm">
              Este sistema é exclusivo para colaboradores Valgroup. Você precisa estar autenticado com uma conta{" "}
              <strong className="text-foreground">@VALGROUPCO.COM</strong> para acessar o dashboard.
            </p>
          </div>
          <button
            onClick={() => { window.location.href = "/api/oauth/logout"; }}
            className="text-sm text-red-600 underline underline-offset-4"
          >
            Sair e tentar com outra conta
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard de Manutenção</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Análise de indicadores e tomada de decisão — BA1 Valgroup
            </p>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearAllFilters} className="gap-2 self-start sm:self-auto">
              <RotateCcw className="h-3.5 w-3.5" />
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Filtros:
              </span>

              <FilterPopover
                label="Máquinas"
                options={filterOptions?.maquinas ?? []}
                selected={filters.maquinas}
                onToggle={(v) => toggleFilter("maquinas", v)}
                onSelectAll={() => setFilters((p) => ({ ...p, maquinas: filterOptions?.maquinas ?? [] }))}
                onClearAll={() => setFilters((p) => ({ ...p, maquinas: [] }))}
              />

              <FilterPopover
                label="Tipo de Ordem"
                options={filterOptions?.tiposOrdem ?? []}
                selected={filters.tiposOrdem}
                onToggle={(v) => toggleFilter("tiposOrdem", v)}
                onSelectAll={() => setFilters((p) => ({ ...p, tiposOrdem: filterOptions?.tiposOrdem ?? [] }))}
                onClearAll={() => setFilters((p) => ({ ...p, tiposOrdem: [] }))}
              />

              <FilterPopover
                label="Tipo de Operação"
                options={filterOptions?.tiposOperacao ?? []}
                selected={filters.tiposOperacao}
                onToggle={(v) => toggleFilter("tiposOperacao", v)}
                onSelectAll={() => setFilters((p) => ({ ...p, tiposOperacao: filterOptions?.tiposOperacao ?? [] }))}
                onClearAll={() => setFilters((p) => ({ ...p, tiposOperacao: [] }))}
              />

              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="date"
                  value={filters.dataInicio}
                  onChange={(e) => setFilters((p) => ({ ...p, dataInicio: e.target.value }))}
                  className="h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Data início"
                />
                <span className="text-muted-foreground text-sm">até</span>
                <input
                  type="date"
                  value={filters.dataFim}
                  onChange={(e) => setFilters((p) => ({ ...p, dataFim: e.target.value }))}
                  className="h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Data fim"
                />
              </div>

              {/* Tags dos filtros ativos */}
              {filters.maquinas.map((m) => (
                <Badge key={m} variant="secondary" className="gap-1 text-xs">
                  {m}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter("maquinas", m)} />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total de Horas"
            value={totalHoras.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            subtitle="horas de manutenção"
            icon={Clock}
            color="bg-blue-500"
          />
          <KPICard
            title="Total de Ordens"
            value={totalOrdens.toLocaleString("pt-BR")}
            subtitle="ordens de serviço"
            icon={Wrench}
            color="bg-emerald-500"
          />
          <KPICard
            title="Máquinas Monitoradas"
            value={totalMaquinas.toString()}
            subtitle="equipamentos ativos"
            icon={Activity}
            color="bg-violet-500"
          />
          <KPICard
            title="Média por Ordem"
            value={avgHorasPorOrdem}
            subtitle="horas/ordem"
            icon={Layers}
            color="bg-amber-500"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comparação Mensal */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{monthlyChartTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => [v.toFixed(2) + "h", ""]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {yearsPresent.map((ano, idx) => (
                    <Line
                      key={ano}
                      type="monotone"
                      dataKey={String(ano)}
                      stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Horas por Categoria */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Horas por Categoria de Ordem</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number, name: string, props: any) => [
                      v.toFixed(2) + "h",
                      props.payload?.fullName ?? name,
                    ]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="horas" radius={[4, 4, 0, 0]}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top 5 Máquinas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top 5 Máquinas por Horas de Manutenção</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={machineData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number, name: string, props: any) => [
                    v.toFixed(2) + "h",
                    props.payload?.fullName ?? name,
                  ]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="horas" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {machineData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-muted-foreground text-sm">Carregando dados...</div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
