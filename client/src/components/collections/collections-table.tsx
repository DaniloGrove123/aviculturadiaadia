import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EggCollection } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Loader2 } from "lucide-react";

interface CollectionsTableProps {
  limit?: number;
  showAll?: boolean;
}

export default function CollectionsTable({ limit = 10, showAll = false }: CollectionsTableProps) {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch collections
  const { data: collections, isLoading } = useQuery({
    queryKey: ["/api/collections", { limit: showAll ? undefined : limit }],
  });

  // Delete collection mutation
  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/collections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/balance"] });
      toast({
        title: "Coleta removida",
        description: "A coleta foi removida com sucesso.",
      });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover coleta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Format date
  const formatDate = (date: Date) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  // Format period
  const formatPeriod = (period: string) => {
    return period === "morning" ? "Manhã" : "Tarde";
  };

  // Get period badge class
  const getPeriodBadgeClass = (period: string) => {
    return period === "morning"
      ? "bg-primary bg-opacity-10 text-primary"
      : "bg-secondary bg-opacity-10 text-secondary";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!collections || collections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Nenhuma coleta encontrada.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Data</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>% Postura</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.map((collection: EggCollection) => (
              <TableRow key={collection.id} className="hover:bg-card/50">
                <TableCell className="font-medium">{formatDate(collection.collectionDate)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPeriodBadgeClass(collection.period)}`}>
                    {formatPeriod(collection.period)}
                  </span>
                </TableCell>
                <TableCell>{collection.eggCount} ovos</TableCell>
                <TableCell className="text-green-500">{collection.posturePercentage}%</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog open={deleteId === collection.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                          onClick={() => setDeleteId(collection.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir esta coleta? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteCollectionMutation.mutate(collection.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            {deleteCollectionMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Excluindo...
                              </>
                            ) : (
                              "Excluir"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
