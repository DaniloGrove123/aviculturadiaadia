import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FinancialMovement } from "@shared/schema";

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

interface FinancialMovementsTableProps {
  limit?: number;
  showAll?: boolean;
}

export default function FinancialMovementsTable({ limit = 10, showAll = false }: FinancialMovementsTableProps) {
  // Fetch financial movements
  const { data: movements, isLoading } = useQuery({
    queryKey: ["/api/financial/movements", { limit: showAll ? undefined : limit }],
  });

  // Format date
  const formatDate = (date: Date) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  // Format currency
  const formatCurrency = (value: string | number) => {
    return `R$ ${parseFloat(String(value)).toFixed(2)}`;
  };

  // Get movement type badge class
  const getMovementBadgeClass = (movementType: string) => {
    return movementType === "income"
      ? "bg-green-500 bg-opacity-10 text-green-500"
      : "bg-red-500 bg-opacity-10 text-red-500";
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
            <TableHead>Categoria</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement: FinancialMovement) => (
            <TableRow key={movement.id} className="hover:bg-card/50">
              <TableCell className="font-medium">{formatDate(movement.movementDate)}</TableCell>
              <TableCell>
                <Badge className={getMovementBadgeClass(movement.movementType)}>
                  <span className="flex items-center">
                    {movement.movementType === "income" ? (
                      <><TrendingUp className="h-3 w-3 mr-1" /> Entrada</>
                    ) : (
                      <><TrendingDown className="h-3 w-3 mr-1" /> Saída</>
                    )}
                  </span>
                </Badge>
              </TableCell>
              <TableCell>{movement.category}</TableCell>
              <TableCell>{movement.contact || "-"}</TableCell>
              <TableCell>{movement.paymentMethod}</TableCell>
              <TableCell className={`text-right font-medium ${movement.movementType === "income" ? "text-green-500" : "text-red-500"}`}>
                {formatCurrency(movement.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
