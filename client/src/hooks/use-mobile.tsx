import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

// Hook para detectar se a tela é de tamanho mobile
export function useMobile() {
  // Inicializar com false para evitar problemas de SSR
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Função para verificar o tamanho da tela
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Executa imediatamente
    checkMobile();
    
    // Adiciona listener para mudanças de tamanho
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
