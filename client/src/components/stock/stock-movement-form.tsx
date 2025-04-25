import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStockMovementSchema } from "@shared/schema";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, TrendingDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { z } from "zod";

// Define a precise schema for form validation
const formSchema = z.object({
  movementDate: z.date(),
  movementType: z.enum(["in", "out"]),
  eggCount: z.number().min(0, "Quantidade de ovos deve ser positiva"),
  notes: z.string().optional().default(""),
  createFinancialRecord: z.boolean().default(false),
  paymentMethod: z.string().optional().default(""),
  contact: z.string().optional().default(""),
});

type FormValues = z.infer<typeof formSchema>;

interface StockMovementFormProps {
  onSuccess?: () => void;
}

export default function StockMovementForm({ onSuccess }: StockMovementFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Initialize form with defaults
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      movementDate: new Date(),
      movementType: "out",
      eggCount: 0,
      notes: "",
      createFinancialRecord: true,
      paymentMethod: "Dinheiro",
      contact: "",
    },
  });

  // Watch movement type to conditionally show financial fields
  const movementType = form.watch("movementType");
  const createFinancialRecord = form.watch("createFinancialRecord");

  // Create stock movement mutation
  const createStockMovementMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/stock/movements", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/movements"] });
      toast({
        title: "Movimentação registrada",
        description: "A movimentação de estoque foi registrada com sucesso.",
      });
      form.reset({
        movementDate: new Date(),
        movementType: "out",
        eggCount: 0,
        notes: "",
        createFinancialRecord: true,
        paymentMethod: "Dinheiro",
        contact: "",
      });
      setOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar movimentação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(data: FormValues) {
    createStockMovementMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-secondary hover:bg-secondary/90 text-white">
          <TrendingDown className="w-4 h-4 mr-1" />
          Registrar Saída
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle>Movimentação de Estoque</DialogTitle>
            <DialogDescription>
              Registre uma entrada ou saída de ovos no estoque.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <FormField
                control={form.control}
                name="movementType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Movimentação</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="in" />
                          </FormControl>
                          <FormLabel className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                            </svg>
                            Entrada
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="out" />
                          </FormControl>
                          <FormLabel className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                            </svg>
                            Saída
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="movementDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Movimentação</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eggCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de Ovos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={field.value || 0}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        name={field.name}
                      />
                    </FormControl>
                    <FormDescription>
                      Informe a quantidade de ovos {movementType === "in" ? "recebidos" : "vendidos/descartados"}.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {movementType === "out" && (
                <FormField
                  control={form.control}
                  name="createFinancialRecord"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Registrar como venda (gerar entrada financeira)
                        </FormLabel>
                        <FormDescription>
                          Se for uma venda, isso gerará automaticamente uma entrada financeira.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}
              
              {movementType === "out" && createFinancialRecord && (
                <>
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a forma de pagamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="Cartão">Cartão</SelectItem>
                            <SelectItem value="Pix">Pix</SelectItem>
                            <SelectItem value="Transferência">Transferência</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente (opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome do cliente" 
                            value={field.value || ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            name={field.name}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Alguma observação sobre esta movimentação?"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createStockMovementMutation.isPending}
                >
                  {createStockMovementMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
