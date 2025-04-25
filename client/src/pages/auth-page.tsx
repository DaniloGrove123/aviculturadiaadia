import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";
import { ClipboardCheck, Package, DollarSign, Settings } from "lucide-react";
import Logo from "@/components/ui/logo";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { insertUserSchema } from "@shared/schema";

// Login schema
const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Register schema based on insertUserSchema from shared schema but with password confirmation
const registerSchema = insertUserSchema
  .extend({
    passwordConfirm: z.string().min(6, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "As senhas não coincidem",
    path: ["passwordConfirm"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      passwordConfirm: "",
      name: "",
      farmName: "",
      henCount: 0,
      eggPrice: "0",
    },
  });

  // Handle login
  function onLoginSubmit(data: LoginFormValues) {
    loginMutation.mutate(data);
  }

  // Handle register
  function onRegisterSubmit(data: RegisterFormValues) {
    // Remove passwordConfirm as it's not in the schema
    const { passwordConfirm, ...userData } = data;
    registerMutation.mutate(userData);
  }

  // Redirect if user is authenticated
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Logo className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Avicultura Dia a Dia</h1>
            <p className="text-gray-400 mb-8">Gerencie sua granja avícola de forma simples e eficiente</p>
          </div>

          <Tabs 
            defaultValue="login" 
            value={tab} 
            onValueChange={(value) => setTab(value as "login" | "register")}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Usuário</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite seu nome de usuário" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Digite sua senha" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Usuário</FormLabel>
                        <FormControl>
                          <Input placeholder="Escolha um nome de usuário" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seu Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="farmName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Granja</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome da sua granja" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="henCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Galinhas</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0}
                              placeholder="0" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
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
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Crie uma senha" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="passwordConfirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirme a Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Digite a senha novamente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Right side - Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="w-full flex flex-col justify-center items-center p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-lg text-center"
          >
            <h2 className="text-4xl font-bold mb-6 gradient-text">Controle Completo da Sua Granja</h2>
            <p className="text-xl mb-8 text-gray-300">
              Automatize e otimize a gestão da sua produção avícola com o Avicultura Dia a Dia
            </p>
            
            <div className="grid grid-cols-2 gap-6 mt-12">
              <div className="bg-card bg-opacity-50 backdrop-blur-sm p-6 rounded-xl">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <ClipboardCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Registre Coletas</h3>
                <p className="text-gray-400">Controle preciso de coletas por período (manhã/tarde)</p>
              </div>
              
              <div className="bg-card bg-opacity-50 backdrop-blur-sm p-6 rounded-xl">
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Controle Estoque</h3>
                <p className="text-gray-400">Gestão automatizada de entrada e saída de ovos</p>
              </div>
              
              <div className="bg-card bg-opacity-50 backdrop-blur-sm p-6 rounded-xl">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Controle Financeiro</h3>
                <p className="text-gray-400">Acompanhe receitas, despesas e lucros em tempo real</p>
              </div>
              
              <div className="bg-card bg-opacity-50 backdrop-blur-sm p-6 rounded-xl">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                  <Settings className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Configurações</h3>
                <p className="text-gray-400">Ajuste o número de galinhas e preços de forma simples</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
