import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StockMovement } from "@shared/schema";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface StockMovementsTableProps {
  limit?: number;
  showAll?: boolean;
}

export default function StockMovementsTable({ limit = 10, showAll = false }: StockMovementsTableProps) {
  // Fetch stock movements
  const { data: movements, isLoading } = useQuery({
    queryKey: ["/api/stock/movements", { limit: showAll ? undefined : limit }],
  });

  // Format date
  const formatDate = (date: Date) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  // Get movement type badge class
  const getMovementBadgeClass = (movementType: string) => {
    return movementType === "in"
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

  if (!movements || movements.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Nenhuma movimentação encontrada.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Financeiro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement: StockMovement) => (
            <TableRow key={movement.id} className="hover:bg-card/50">
              <TableCell className="font-medium">{formatDate(movement.movementDate)}</TableCell>
              <TableCell>
                <Badge className={getMovementBadgeClass(movement.movementType)}>
                  <span className="flex items-center">
                    {movement.movementType === "in" ? (
                      <><TrendingUp className="h-3 w-3 mr-1" /> Entrada</>
                    ) : (
                      <><TrendingDown className="h-3 w-3 mr-1" /> Saída</>
                    )}
                  </span>
                </Badge>
              </TableCell>
              <TableCell>{movement.eggCount} ovos</TableCell>
              <TableCell className="max-w-[200px] truncate">{movement.notes || "-"}</TableCell>
              <TableCell className="text-right">
                {movement.financialMovementId ? (
                  <Badge variant="outline" className="bg-green-500 bg-opacity-10 text-green-500">
                    Venda registrada
                  </Badge>
                ) : (
                  "-"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
