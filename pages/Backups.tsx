import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  CheckCircle2,
  Cloud,
  Download,
  HardDrive,
  Info,
  Loader2,
  Plus,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function Backups() {
  const isAdmin = true; // Sem autenticação: acesso total

  const { data: backups, isLoading, refetch } = trpc.backup.list.useQuery();
  const createBackupMutation = trpc.backup.create.useMutation();
  const utils = trpc.useUtils();

  const handleCreateBackup = async () => {
    try {
      const result = await createBackupMutation.mutateAsync();
      toast.success(`Backup criado com sucesso! ${result.total.toLocaleString("pt-BR")} registros salvos.`);
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao criar backup.");
    }
  };

  const handleDownload = async (s3Key: string, createdAt: Date) => {
    try {
      const result = await utils.backup.getDownloadUrl.fetch({ s3Key });
      const a = document.createElement("a");
      a.href = result.url;
      a.download = `backup-${new Date(createdAt).toISOString().slice(0, 10)}.json`;
      a.target = "_blank";
      a.click();
      toast.success("Download iniciado!");
    } catch {
      toast.error("Erro ao obter link de download.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Backups</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Gerenciamento de backups automáticos e manuais no Amazon S3
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={handleCreateBackup}
              disabled={createBackupMutation.isPending}
              className="gap-2 self-start sm:self-auto"
            >
              {createBackupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando backup...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Criar Backup Agora
                </>
              )}
            </Button>
          )}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <Cloud className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Backups</p>
                <p className="text-2xl font-bold">{backups?.length ?? 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Armazenamento</p>
                <p className="text-2xl font-bold">
                  {formatBytes(backups?.reduce((acc, b) => acc + Number(b.sizeBytes), 0) ?? 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-100">
                <HardDrive className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Último Backup</p>
                <p className="text-sm font-semibold mt-0.5">
                  {backups && backups.length > 0
                    ? new Date(backups[0].createdAt).toLocaleDateString("pt-BR")
                    : "Nenhum"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info sobre política de backup */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Política de Backup</p>
                <p className="text-blue-700 mt-0.5">
                  Os backups são armazenados de forma segura no Amazon S3. Cada backup contém todos os registros 
                  de manutenção em formato JSON. Administradores podem criar backups manuais a qualquer momento. 
                  Os arquivos ficam disponíveis para download por 1 hora após a solicitação.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de backups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de Backups</CardTitle>
            <CardDescription>Todos os backups disponíveis para download</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : !backups || backups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <HardDrive className="h-8 w-8" />
                        <div>
                          <p className="text-sm font-medium">Nenhum backup encontrado</p>
                          <p className="text-xs mt-0.5">
                            {isAdmin ? 'Clique em "Criar Backup Agora" para fazer o primeiro backup.' : "Nenhum backup disponível."}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  backups.map((backup) => (
                    <TableRow key={Number(backup.id)}>
                      <TableCell className="text-sm">
                        <div>
                          <p className="font-medium">{new Date(backup.createdAt).toLocaleDateString("pt-BR")}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(backup.createdAt).toLocaleTimeString("pt-BR")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={backup.backupType === "automatic" ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {backup.backupType === "automatic" ? "Automático" : "Manual"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {backup.totalRecords.toLocaleString("pt-BR")} registros
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatBytes(Number(backup.sizeBytes))}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1 text-xs">
                          <CheckCircle2 className="h-3 w-3" />
                          Disponível
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(backup.s3Key, backup.createdAt)}
                          className="gap-1.5 text-xs"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
