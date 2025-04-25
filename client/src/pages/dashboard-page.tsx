import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AppLayout from "@/components/layouts/app-layout";
import StatCard from "@/components/stats/stat-card";
import FarmInfo from "@/components/farm/farm-info";
import CollectionsTable from "@/components/collections/collections-table";
import CollectionForm from "@/components/collections/collection-form";
import { ClipboardCheck, Package, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function DashboardPage() {
  const { user } = useAuth();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Get formatted current date
  const currentDate = format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR });

  // Format currency
  const formatCurrency = (value: string | number) => {
    return `R$ ${parseFloat(String(value)).toFixed(2)}`;
  };

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome message and date display */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Olá, {user?.name?.split(' ')[0]}!</h2>
            <p className="text-gray-400">Aqui está o resumo da sua granja hoje.</p>
          </div>
          <div className="mt-2 md:mt-0 bg-card px-4 py-2 rounded-lg flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span>{currentDate}</span>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-in">
          {isLoading ? (
            <>
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </>
          ) : (
            <>
              {/* Egg Collection Card */}
              <StatCard
                title="Coleta de Hoje"
                value={stats?.todayCollection?.total || 0}
                unit="ovos"
                change={{
                  value: "8%",
                  isPositive: true,
                  label: "vs. média"
                }}
                icon={<ClipboardCheck className="w-6 h-6" />}
                iconBgClass="bg-primary"
                iconTextClass="text-primary"
                details={{
                  label1: "Manhã",
                  value1: stats?.todayCollection?.morning || 0,
                  label2: "Tarde",
                  value2: stats?.todayCollection?.afternoon || 0,
                  label3: "% Postura",
                  value3: `${stats?.todayCollection?.posturePercentage || 0}%`
                }}
              />

              {/* Stock Card */}
              <StatCard
                title="Estoque Atual"
                value={stats?.stock?.currentStock || 0}
                unit="ovos"
                change={{
                  value: (stats?.stock?.currentStock / 12).toFixed(1) || "0",
                  isPositive: true,
                  label: "dúzias"
                }}
                icon={<Package className="w-6 h-6" />}
                iconBgClass="bg-secondary"
                iconTextClass="text-secondary"
                details={{
                  label1: "Entradas (Hoje)",
                  value1: stats?.stock?.todayIn || 0,
                  label2: "Saídas (Hoje)",
                  value2: stats?.stock?.todayOut || 0
                }}
              />

              {/* Financial Card */}
              <StatCard
                title="Saldo Financeiro"
                value={formatCurrency(stats?.financial?.balance || 0)}
                change={{
                  value: "12%",
                  isPositive: true,
                  label: "este mês"
                }}
                icon={<DollarSign className="w-6 h-6" />}
                iconBgClass="bg-green-500"
                iconTextClass="text-green-500"
                details={{
                  label1: "Receita (Mês)",
                  value1: formatCurrency(stats?.financial?.monthlyIncome || 0),
                  label2: "Despesas (Mês)",
                  value2: formatCurrency(stats?.financial?.monthlyExpenses || 0)
                }}
              />
            </>
          )}
        </div>

        {/* Farm Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Farm Info */}
          <div className="lg:col-span-1 animate-slide-in" style={{ animationDelay: "0.1s" }}>
            <FarmInfo />
          </div>

          {/* Recent Collections Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-card rounded-xl p-6 shadow-lg border border-gray-800 lg:col-span-2"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <ClipboardCheck className="w-5 h-5 mr-2 text-primary" />
                Coletas Recentes
              </h3>
              <CollectionForm />
            </div>
            
            <CollectionsTable limit={4} />
            
            <div className="mt-4 flex justify-center">
              <Link href="/collections" className="text-primary hover:text-primary/90 text-sm flex items-center">
                Ver todas as coletas
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
