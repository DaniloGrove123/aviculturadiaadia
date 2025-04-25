import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layouts/app-layout";
import { Package, PieChart, TrendingUp, TrendingDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StockMovementForm from "@/components/stock/stock-movement-form";
import StockMovementsTable from "@/components/stock/stock-movements-table";

export default function StockPage() {
  // Fetch stock balance
  const { data: stockBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["/api/stock/balance"],
  });

  return (
    <AppLayout title="Estoque">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Controle de Estoque</h2>
              <p className="text-gray-400">Gerencie o estoque de ovos da sua granja.</p>
            </div>
            <StockMovementForm />
          </div>

          {/* Stock Balance Summary */}
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <Package className="w-5 h-5 mr-2 text-secondary" />
                <CardTitle>Resumo do Estoque</CardTitle>
              </div>
              <CardDescription>
                Visão geral do seu estoque atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm font-medium text-gray-400">Estoque Atual</div>
                      <div className="text-2xl font-bold">{stockBalance?.eggCount || 0} ovos</div>
                      <div className="text-sm text-gray-400 mt-1">({((stockBalance?.eggCount || 0) / 12).toFixed(1)} dúzias)</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 flex items-center space-x-4">
                      <div className="bg-primary bg-opacity-10 p-3 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-400">Entradas Recentes</div>
                        <div className="text-xl font-bold">Automático</div>
                        <div className="text-sm text-gray-400">Vindas das coletas</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 flex items-center space-x-4">
                      <div className="bg-secondary bg-opacity-10 p-3 rounded-lg">
                        <TrendingDown className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-400">Saídas Recentes</div>
                        <div className="text-xl font-bold">Vendas/Perdas</div>
                        <div className="text-sm text-gray-400">Registradas manualmente</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock Movements */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas as Movimentações</TabsTrigger>
              <TabsTrigger value="in">Entradas</TabsTrigger>
              <TabsTrigger value="out">Saídas</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center">
                    <PieChart className="w-5 h-5 mr-2 text-secondary" />
                    <CardTitle>Histórico de Movimentações</CardTitle>
                  </div>
                  <CardDescription>
                    Registro de todas as entradas e saídas de estoque
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StockMovementsTable showAll />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="in">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                    <CardTitle>Entradas de Estoque</CardTitle>
                  </div>
                  <CardDescription>
                    Registro de todas as entradas de estoque
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-400 py-4">Funcionalidade de filtro em desenvolvimento.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="out">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center">
                    <TrendingDown className="w-5 h-5 mr-2 text-secondary" />
                    <CardTitle>Saídas de Estoque</CardTitle>
                  </div>
                  <CardDescription>
                    Registro de todas as saídas de estoque
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
