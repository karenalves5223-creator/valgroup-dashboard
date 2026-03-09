import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileJson,
  FileText,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function DataManagement() {
  const isAdmin = true; // Sem autenticação: acesso total

  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data: tableData, isLoading: tableLoading, refetch } = trpc.maintenance.list.useQuery({
    page,
    pageSize,
  });

  const { data: importHistory, refetch: refetchHistory } = trpc.import.history.useQuery();

  const [importDialog, setImportDialog] = useState(false);
  const [importType, setImportType] = useState<"json" | "csv">("json");
  const [replaceAll, setReplaceAll] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadJsonMutation = trpc.import.uploadJson.useMutation();
  const uploadCsvMutation = trpc.import.uploadCsv.useMutation();
  const exportMutation = trpc.maintenance.exportCsv.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileContent(ev.target?.result as string);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    if (!fileContent || !fileName) return;
    setImporting(true);
    try {
      let result;
      if (importType === "json") {
        result = await uploadJsonMutation.mutateAsync({
          filename: fileName,
          content: fileContent,
          replaceAll,
        });
      } else {
        result = await uploadCsvMutation.mutateAsync({
          filename: fileName,
          content: fileContent,
          replaceAll,
        });
      }
      toast.success(`Importação concluída! ${result.inserted} registros inseridos.`);
      setImportDialog(false);
      setFileContent(null);
      setFileName("");
      refetch();
      refetchHistory();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao importar arquivo.");
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportMutation.mutateAsync({});
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `manutencao-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${result.total} registros exportados.`);
    } catch {
      toast.error("Erro ao exportar dados.");
    }
  };

  const totalPages = Math.ceil((tableData?.total ?? 0) / pageSize);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestão de Dados</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Importação, visualização e exportação de registros de manutenção
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exportMutation.isPending} className="gap-2">
              {exportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Exportar CSV
            </Button>
            {isAdmin && (
              <Button size="sm" onClick={() => setImportDialog(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Importar Dados
              </Button>
            )}
          </div>
        </div>

        {/* Tabela de dados */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Registros de Manutenção</CardTitle>
              <Badge variant="secondary">
                {(tableData?.total ?? 0).toLocaleString("pt-BR")} registros
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Máquina</TableHead>
                    <TableHead>Tipo de Ordem</TableHead>
                    <TableHead>Tipo de Operação</TableHead>
                    <TableHead className="text-right">Horas Reais</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : tableData?.records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        Nenhum registro encontrado. Importe dados para começar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tableData?.records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm">{r.data}</TableCell>
                        <TableCell className="text-sm">{r.maquina}</TableCell>
                        <TableCell className="text-sm">{r.tipoOrdem}</TableCell>
                        <TableCell className="text-sm">{r.tipoOperacao}</TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          {Number(r.horasReais).toFixed(2)}h
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Página {page} de {totalPages} ({(tableData?.total ?? 0).toLocaleString("pt-BR")} registros)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico de importações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de Importações</CardTitle>
            <CardDescription>Últimas 20 importações realizadas</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!importHistory || importHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma importação realizada ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  importHistory.map((imp) => (
                    <TableRow key={Number(imp.id)}>
                      <TableCell className="text-sm font-medium">{imp.filename}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1 text-xs">
                          {imp.fileType === "json" ? (
                            <FileJson className="h-3 w-3" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                          {imp.fileType.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {imp.status === "success" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3" />
                            Sucesso
                          </Badge>
                        ) : imp.status === "error" ? (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <XCircle className="h-3 w-3" />
                            Erro
                          </Badge>
                        ) : imp.status === "processing" ? (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1 text-xs">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Processando
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">{imp.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {imp.insertedRecords.toLocaleString("pt-BR")} / {imp.totalRecords.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(imp.createdAt).toLocaleString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de importação */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Dados de Manutenção</DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo JSON ou CSV com os registros de manutenção.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tipo de arquivo */}
            <div className="flex gap-3">
              <Button
                variant={importType === "json" ? "default" : "outline"}
                size="sm"
                onClick={() => setImportType("json")}
                className="gap-2 flex-1"
              >
                <FileJson className="h-4 w-4" />
                JSON
              </Button>
              <Button
                variant={importType === "csv" ? "default" : "outline"}
                size="sm"
                onClick={() => setImportType("csv")}
                className="gap-2 flex-1"
              >
                <FileText className="h-4 w-4" />
                CSV
              </Button>
            </div>

            {/* Upload de arquivo */}
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={importType === "json" ? ".json" : ".csv"}
                onChange={handleFileSelect}
                className="hidden"
              />
              {fileName ? (
                <div className="space-y-1">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs text-muted-foreground">Clique para trocar o arquivo</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium">Clique para selecionar o arquivo</p>
                  <p className="text-xs text-muted-foreground">
                    Formato: .{importType} — máx. 50MB
                  </p>
                </div>
              )}
            </div>

            {/* Opção de substituir */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Substituir todos os dados</Label>
                <p className="text-xs text-muted-foreground">
                  Remove todos os registros existentes antes de importar
                </p>
              </div>
              <Switch checked={replaceAll} onCheckedChange={setReplaceAll} />
            </div>

            {replaceAll && (
              <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <strong>Atenção:</strong> Esta ação irá remover todos os registros existentes e não pode ser desfeita.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!fileContent || importing}
              className="gap-2"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
