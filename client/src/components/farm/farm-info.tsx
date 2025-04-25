import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

// Schema for hen count update
const updateHenCountSchema = z.object({
  henCount: z.number().min(0, "O número deve ser positivo"),
  reason: z.string().optional(),
});

// Schema for egg price update
const updateEggPriceSchema = z.object({
  eggPrice: z.number().min(0, "O preço deve ser positivo"),
});

type UpdateHenCountValues = z.infer<typeof updateHenCountSchema>;
type UpdateEggPriceValues = z.infer<typeof updateEggPriceSchema>;

export default function FarmInfo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [henCountDialogOpen, setHenCountDialogOpen] = useState(false);
  const [eggPriceDialogOpen, setEggPriceDialogOpen] = useState(false);

  // Fetch farm information
  const { data: farmInfo, isLoading: farmLoading } = useQuery({
    queryKey: ["/api/farm"],
  });

  // Update hen count mutation
  const updateHenCountMutation = useMutation({
    mutationFn: async (data: UpdateHenCountValues) => {
      const res = await apiRequest("PUT", "/api/farm/hen-count", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/farm"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hen-count-history"] });
      toast({
        title: "Quantidade de galinhas atualizada",
        description: "A quantidade de galinhas foi atualizada com sucesso.",
      });
      setHenCountDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update egg price mutation
  const updateEggPriceMutation = useMutation({
    mutationFn: async (data: UpdateEggPriceValues) => {
      const res = await apiRequest("PUT", "/api/farm/egg-price", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/farm"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Preço dos ovos atualizado",
        description: "O preço dos ovos foi atualizado com sucesso.",
      });
      setEggPriceDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Forms
  const henCountForm = useForm<UpdateHenCountValues>({
    resolver: zodResolver(updateHenCountSchema),
    defaultValues: {
      henCount: farmInfo?.henCount || 0,
      reason: "",
    },
  });

  const eggPriceForm = useForm<UpdateEggPriceValues>({
    resolver: zodResolver(updateEggPriceSchema),
    defaultValues: {
      eggPrice: farmInfo?.eggPrice ? parseFloat(farmInfo.eggPrice) : 0,
    },
  });

  // Reset form values when farm info changes
  if (farmInfo && farmInfo.henCount !== henCountForm.getValues().henCount) {
    henCountForm.reset({
      henCount: farmInfo.henCount,
      reason: "",
    });
  }

  if (farmInfo && parseFloat(farmInfo.eggPrice) !== eggPriceForm.getValues().eggPrice) {
    eggPriceForm.reset({
      eggPrice: parseFloat(farmInfo.eggPrice),
    });
  }

  // Submit handlers
  function onHenCountSubmit(data: UpdateHenCountValues) {
    updateHenCountMutation.mutate(data);
  }

  function onEggPriceSubmit(data: UpdateEggPriceValues) {
    updateEggPriceMutation.mutate(data);
  }

  if (farmLoading) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-lg border border-gray-800 flex items-center justify-center h-56">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-lg border border-gray-800">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Building2 className="w-5 h-5 mr-2 text-primary" />
        Informações da Granja
      </h3>
      <div className="space-y-4">
        <div>
          <span className="text-gray-400 text-sm">Nome da Granja</span>
          <p className="font-medium">{farmInfo?.name || user?.farmName}</p>
        </div>
        <div>
          <span className="text-gray-400 text-sm">Número de Galinhas</span>
          <div className="flex items-center">
            <p className="font-medium">{farmInfo?.henCount || user?.henCount}</p>
            
            <Dialog open={henCountDialogOpen} onOpenChange={setHenCountDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 text-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                  </svg>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Atualizar Número de Galinhas</DialogTitle>
                  <DialogDescription>
                    Informe o novo número de galinhas e o motivo da alteração.
                  </DialogDescription>
                </DialogHeader>
                <Form {...henCountForm}>
                  <form onSubmit={henCountForm.handleSubmit(onHenCountSubmit)} className="space-y-4">
                    <FormField
                      control={henCountForm.control}
                      name="henCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Galinhas</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Este número será usado para calcular a porcentagem de postura.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={henCountForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo da Alteração</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ex: Compra de novas galinhas, perda, etc."
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setHenCountDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit"
                        disabled={updateHenCountMutation.isPending}
                      >
                        {updateHenCountMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div>
          <span className="text-gray-400 text-sm">Preço por Dúzia</span>
          <div className="flex items-center">
            <p className="font-medium">
              {farmInfo?.eggPrice ? `R$ ${parseFloat(farmInfo.eggPrice).toFixed(2)}` : `R$ ${parseFloat(user?.eggPrice as any || 0).toFixed(2)}`}
            </p>
            
            <Dialog open={eggPriceDialogOpen} onOpenChange={setEggPriceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 text-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                  </svg>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Atualizar Preço dos Ovos</DialogTitle>
                  <DialogDescription>
                    Informe o novo preço por dúzia de ovos.
                  </DialogDescription>
                </DialogHeader>
                <Form {...eggPriceForm}>
                  <form onSubmit={eggPriceForm.handleSubmit(onEggPriceSubmit)} className="space-y-4">
                    <FormField
                      control={eggPriceForm.control}
                      name="eggPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço por Dúzia (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              step={0.01}
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Este preço será usado para calcular o valor das vendas.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setEggPriceDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit"
                        disabled={updateEggPriceMutation.isPending}
                      >
                        {updateEggPriceMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div>
          <span className="text-gray-400 text-sm">Tipo de Assinatura</span>
          <div className="mt-1 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary bg-opacity-20 text-primary">
            {farmInfo?.subscriptionStatus === "premium" ? "Premium" : "Gratuito"}
          </div>
        </div>
        <Button 
          className="mt-2 w-full bg-card hover:bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-sm flex items-center justify-center"
          variant="outline"
          onClick={() => window.location.href = "/settings"}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          Configurações da Granja
        </Button>
      </div>
    </div>
  );
}
