import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layouts/app-layout";
import { DollarSign, CreditCard, TrendingUp, TrendingDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import FinancialMovementForm from "@/components/finances/financial-movement-form";
import FinancialMovementsTable from "@/components/finances/financial-movements-table";

export default function FinancesPage() {
  // Fetch financial balance
  const { data: financialBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["/api/financial/balance"],
  });

  // Fetch monthly summary - assuming current month and year
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data: monthlySummary, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/financial/summary", { month, year }],
  });

  // Format currency
  const formatCurrency = (value: string | number) => {
    return `R$ ${parseFloat(String(value)).toFixed(2)}`;
  };

  return (
    <AppLayout title="Finanças">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Controle Financeiro</h2>
              <p className="text-gray-400">Gerencie as finanças da sua granja.</p>
            </div>
            <FinancialMovementForm />
          </div>

          {/* Financial Summary */}
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                <CardTitle>Resumo Financeiro</CardTitle>
              </div>
              <CardDescription>
                Visão geral das suas finanças
              </CardDescription>
            </CardHeader>
            <CardContent>
              {balanceLoading || summaryLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm font-medium text-gray-400">Saldo Atual</div>
                      <div className="text-2xl font-bold">{formatCurrency(financialBalance?.balance || 0)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 flex items-center space-x-4">
                      <div className="bg-green-500 bg-opacity-10 p-3 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-400">Receitas (Mês)</div>
                        <div className="text-xl font-bold text-green-500">{formatCurrency(monthlySummary?.incomes || 0)}</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 flex items-center space-x-4">
                      <div className="bg-red-500 bg-opacity-10 p-3 rounded-lg">
                        <TrendingDown className="h-6 w-6 text-red-500" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-400">Despesas (Mês)</div>
                        <div className="text-xl font-bold text-red-500">{formatCurrency(monthlySummary?.expenses || 0)}</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 flex items-center space-x-4">
                      <div className="bg-primary bg-opacity-10 p-3 rounded-lg">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-400">Venda de Ovos (Mês)</div>
                        <div className="text-xl font-bold">{formatCurrency(monthlySummary?.eggSales?.total || 0)}</div>
                        <div className="text-sm text-gray-400">{monthlySummary?.eggSales?.eggCount || 0} ovos</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Movements */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas as Movimentações</TabsTrigger>
              <TabsTrigger value="income">Receitas</TabsTrigger>
              <TabsTrigger value="expense">Despesas</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                    <CardTitle>Histórico Financeiro</CardTitle>
                  </div>
                  <CardDescription>
                    Registro de todas as movimentações financeiras
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FinancialMovementsTable showAll />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="income">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                    <CardTitle>Receitas</CardTitle>
                  </div>
                  <CardDescription>
                    Registro de todas as entradas financeiras
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-400 py-4">Funcionalidade de filtro em desenvolvimento.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="expense">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center">
                    <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
                    <CardTitle>Despesas</CardTitle>
                  </div>
                  <CardDescription>
                    Registro de todas as saídas financeiras
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-400 py-4">Funcionalidade de filtro em desenvolvimento.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AppLayout>
  );
}
