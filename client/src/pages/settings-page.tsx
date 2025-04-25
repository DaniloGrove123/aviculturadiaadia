import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layouts/app-layout";
import { Settings, UserCircle, Building2, DollarSign, LogOut } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Schema for user account update
const userUpdateSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
});

// Schema for farm settings update
const farmUpdateSchema = z.object({
  farmName: z.string().min(2, "Nome da granja deve ter pelo menos 2 caracteres"),
  henCount: z.number().min(0, "Número de galinhas deve ser positivo"),
  eggPrice: z.number().min(0, "Preço dos ovos deve ser positivo"),
});

// Schema for password update
const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação de senha é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type UserUpdateValues = z.infer<typeof userUpdateSchema>;
type FarmUpdateValues = z.infer<typeof farmUpdateSchema>;
type PasswordUpdateValues = z.infer<typeof passwordUpdateSchema>;

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");

  // Fetch farm information
  const { data: farmInfo } = useQuery({
    queryKey: ["/api/farm"],
  });

  // User account form
  const userForm = useForm<UserUpdateValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
    },
  });

  // Farm settings form
  const farmForm = useForm<FarmUpdateValues>({
    resolver: zodResolver(farmUpdateSchema),
    defaultValues: {
      farmName: farmInfo?.name || user?.farmName || "",
      henCount: farmInfo?.henCount || 0,
      eggPrice: farmInfo?.eggPrice ? parseFloat(farmInfo.eggPrice) : 0,
    },
  });

  // Password update form
  const passwordForm = useForm<PasswordUpdateValues>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update user info mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserUpdateValues) => {
      const res = await apiRequest("PUT", "/api/user", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("PUT", "/api/user/password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi atualizada com sucesso.",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  function onUserSubmit(data: UserUpdateValues) {
    updateUserMutation.mutate(data);
  }

  function onPasswordSubmit(data: PasswordUpdateValues) {
    const { currentPassword, newPassword } = data;
    updatePasswordMutation.mutate({ currentPassword, newPassword });
  }

  function handleLogout() {
    logoutMutation.mutate();
  }

  return (
    <AppLayout title="Configurações">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Configurações</h2>
              <p className="text-gray-400">Gerencie suas configurações pessoais e da granja.</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="account">Conta</TabsTrigger>
              <TabsTrigger value="farm">Granja</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
              <TabsTrigger value="subscription">Assinatura</TabsTrigger>
            </TabsList>

            {/* Account Settings */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <UserCircle className="w-5 h-5 mr-2 text-primary" />
                    <CardTitle>Informações da Conta</CardTitle>
                  </div>
                  <CardDescription>
                    Atualize suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...userForm}>
                    <form id="userForm" onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-6">
                      <FormField
                        control={userForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={userForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome de Usuário</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome de usuário" {...field} />
                            </FormControl>
                            <FormDescription>
                              Este é o nome de usuário que você usa para fazer login.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    type="submit"
                    form="userForm"
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Farm Settings */}
            <TabsContent value="farm">
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-primary" />
                    <CardTitle>Informações da Granja</CardTitle>
                  </div>
                  <CardDescription>
                    Configure as informações da sua granja
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-amber-500 bg-opacity-10 p-4 mb-6 border border-amber-500/20">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-amber-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-amber-500">Atualização de Número de Galinhas</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Para atualizar o número de galinhas e manter um histórico preciso, por favor utilize a página do Dashboard ou a página de Configurações da Granja.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Form {...farmForm}>
                    <form id="farmForm" className="space-y-6">
                      <FormField
                        control={farmForm.control}
                        name="farmName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Granja</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da sua granja" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={farmForm.control}
                          name="henCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Galinhas</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={0} 
                                  placeholder="0" 
                                  disabled 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormDescription>
                                Atualize esta informação no Dashboard para registrar o histórico.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={farmForm.control}
                          name="eggPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preço por Dúzia (R$)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={0} 
                                  step={0.01}
                                  placeholder="0.00" 
                                  disabled
                                  {...field} 
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormDescription>
                                Atualize esta informação no Dashboard para manter o controle.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </form>
                  </Form>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Histórico de Alterações do Plantel</h3>
                    <div className="rounded-lg bg-card p-4 border border-gray-800">
                      <p className="text-center text-gray-400 py-4">
                        O histórico detalhado estará disponível em futuras atualizações.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-primary" />
                    <CardTitle>Segurança</CardTitle>
                  </div>
                  <CardDescription>
                    Gerencie suas configurações de segurança
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form id="passwordForm" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha Atual</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Digite sua senha atual" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nova Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Digite sua nova senha" {...field} />
                            </FormControl>
                            <FormDescription>
                              Sua senha deve ter pelo menos 6 caracteres.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirme a Nova Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirme sua nova senha" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                  
                  <Separator className="my-6" />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Sessões</h3>
                    <div className="rounded-lg bg-card p-4 border border-gray-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Sessão Atual</p>
                          <p className="text-sm text-gray-400">Iniciada agora</p>
                        </div>
                        <Badge className="bg-green-500 text-white">Ativa</Badge>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-4">Encerrar Todas as Sessões</h3>
                      <Button 
                        variant="destructive" 
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className="w-full"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {logoutMutation.isPending ? "Saindo..." : "Sair de Todas as Sessões"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    type="submit"
                    form="passwordForm"
                    disabled={updatePasswordMutation.isPending}
                  >
                    {updatePasswordMutation.isPending ? "Atualizando..." : "Atualizar Senha"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Subscription Settings */}
            <TabsContent value="subscription">
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-primary" />
                    <CardTitle>Assinatura</CardTitle>
                  </div>
                  <CardDescription>
                    Gerencie seu plano de assinatura
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-card p-6 border border-gray-800">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="mb-4 md:mb-0">
                        <h3 className="text-xl font-semibold">Plano {farmInfo?.subscriptionStatus === "premium" ? "Premium" : "Gratuito"}</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {farmInfo?.subscriptionStatus === "premium" 
                            ? "Você está utilizando todos os recursos disponíveis."
                            : "Tenha acesso a recursos avançados fazendo upgrade para o Premium."}
                        </p>
                      </div>
                      <Badge className={`${farmInfo?.subscriptionStatus === "premium" ? "bg-primary" : "bg-gray-600"} text-white text-sm py-1 px-3`}>
                        {farmInfo?.subscriptionStatus === "premium" ? "Premium" : "Gratuito"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-8 space-y-6">
                    <h3 className="text-lg font-medium">Planos Disponíveis</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="rounded-lg bg-card p-6 border border-gray-800 relative">
                        {farmInfo?.subscriptionStatus !== "premium" && (
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-secondary text-white">Atual</Badge>
                          </div>
                        )}
                        <h4 className="text-lg font-medium mb-2">Gratuito</h4>
                        <p className="text-3xl font-bold mb-4">R$ 0,00<span className="text-gray-400 text-sm font-normal">/mês</span></p>
                        <ul className="space-y-2 mb-6">
                          <li className="flex items-center text-sm text-gray-400">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Registro de coletas (manhã/tarde)
                          </li>
                          <li className="flex items-center text-sm text-gray-400">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Controle básico de estoque
                          </li>
                          <li className="flex items-center text-sm text-gray-400">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Controle básico de finanças
                          </li>
                          <li className="flex items-center text-sm text-gray-400">
                            <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            Relatórios avançados
                          </li>
                        </ul>
                        {farmInfo?.subscriptionStatus !== "premium" ? (
                          <Button variant="outline" className="w-full" disabled>Plano Atual</Button>
                        ) : (
                          <Button variant="outline" className="w-full">Fazer Downgrade</Button>
                        )}
                      </div>
                      
                      <div className="rounded-lg bg-primary bg-opacity-5 p-6 border border-primary relative">
                        {farmInfo?.subscriptionStatus === "premium" && (
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-primary text-white">Atual</Badge>
                          </div>
                        )}
                        <h4 className="text-lg font-medium mb-2">Premium</h4>
                        <p className="text-3xl font-bold mb-4">R$ 29,90<span className="text-gray-400 text-sm font-normal">/mês</span></p>
                        <ul className="space-y-2 mb-6">
                          <li className="flex items-center text-sm">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Tudo do plano Gratuito
                          </li>
                          <li className="flex items-center text-sm">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Relatórios avançados
                          </li>
                          <li className="flex items-center text-sm">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Exportação de dados
                          </li>
                          <li className="flex items-center text-sm">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Suporte prioritário
                          </li>
                        </ul>
                        {farmInfo?.subscriptionStatus === "premium" ? (
                          <Button className="w-full" disabled>Plano Atual</Button>
                        ) : (
                          <Button className="w-full">Fazer Upgrade</Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="rounded-lg bg-gray-800 bg-opacity-30 p-4 mt-6">
                      <p className="text-sm text-gray-400">
                        <svg className="w-4 h-4 mr-2 inline-block text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        A funcionalidade de assinatura estará disponível em breve. Todos os usuários estão atualmente na versão gratuita.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AppLayout>
  );
}
