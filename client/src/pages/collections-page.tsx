import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layouts/app-layout";
import CollectionsTable from "@/components/collections/collections-table";
import CollectionForm from "@/components/collections/collection-form";
import { ClipboardCheck, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionsPage() {
  // Fetch today's collections
  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ["/api/collections/today"],
  });

  return (
    <AppLayout title="Coletas">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Controle de Coletas</h2>
              <p className="text-gray-400">Gerencie as coletas de ovos da sua granja.</p>
            </div>
            <CollectionForm />
          </div>

          {/* Today's Collection Summary */}
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <CalendarDays className="w-5 h-5 mr-2 text-primary" />
                <CardTitle>Resumo de Hoje</CardTitle>
              </div>
              <CardDescription>
                Resumo das coletas registradas hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayLoading ? (
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
                      <div className="text-sm font-medium text-gray-400">Total</div>
                      <div className="text-2xl font-bold">{todayData?.summary?.total || 0} ovos</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm font-medium text-gray-400">Manhã</div>
                      <div className="text-2xl font-bold">{todayData?.summary?.morning || 0} ovos</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm font-medium text-gray-400">Tarde</div>
                      <div className="text-2xl font-bold">{todayData?.summary?.afternoon || 0} ovos</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm font-medium text-gray-400">% Postura</div>
                      <div className="text-2xl font-bold text-green-500">{todayData?.summary?.posturePercentage || 0}%</div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Collections Table */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas as Coletas</TabsTrigger>
              <TabsTrigger value="morning">Manhã</TabsTrigger>
              <TabsTrigger value="afternoon">Tarde</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center">
                    <ClipboardCheck className="w-5 h-5 mr-2 text-primary" />
                    <CardTitle>Histórico de Coletas</CardTitle>
                  </div>
                  <CardDescription>
                    Lista de todas as coletas registradas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CollectionsTable showAll />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="morning">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center">
                    <ClipboardCheck className="w-5 h-5 mr-2 text-primary" />
                    <CardTitle>Coletas da Manhã</CardTitle>
                  </div>
                  <CardDescription>
                    Coletas registradas no período da manhã
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-400 py-4">Funcionalidade de filtro em desenvolvimento.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="afternoon">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center">
                    <ClipboardCheck className="w-5 h-5 mr-2 text-primary" />
                    <CardTitle>Coletas da Tarde</CardTitle>
                  </div>
                  <CardDescription>
                    Coletas registradas no período da tarde
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
