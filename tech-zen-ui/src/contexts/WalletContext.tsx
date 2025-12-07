import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { walletService } from '@/services/walletService';
import type { WalletResponse, WithdrawalRequest, DepositRequest } from '@/types'; 
import { useAuth } from '@/hooks/useAuth'; 
import { toast } from '@/hooks/use-toast';

interface WalletContextType {
  wallet: WalletResponse | null;
  refreshWallet: () => Promise<void>;
  deposit: (request: DepositRequest) => Promise<boolean>;
  withdraw: (request: WithdrawalRequest) => Promise<boolean>;
  loading: boolean;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const refreshPromiseRef = useRef<Promise<void> | null>(null); 
  const { isAuthenticated } = useAuth(); 

  const refreshWallet = useCallback(async () => {
    if (!isAuthenticated) { 
      setWallet(null);
      return;
    }
    
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    
    const refreshPromise = (async () => {
      try {
        setLoading(true);
        const response = await walletService.getWallet(true);
        if (response.success && response.data) {
          const updatedWallet = { ...response.data };
          setWallet(updatedWallet);
        } else {
          console.warn('[WalletContext] Failed to refresh wallet:', response.message);
        }
      } catch (error) {
        console.error('[WalletContext] Error fetching wallet:', error);
      } finally {
        setLoading(false);
        refreshPromiseRef.current = null;
      }
    })();
    
    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [isAuthenticated]); 

  
  useEffect(() => {
    if (isAuthenticated && !wallet) {
      
      refreshWallet();
    } else if (!isAuthenticated) {
      
      setWallet(null);
      refreshPromiseRef.current = null;
    }
    
  }, [isAuthenticated]); 

  
  const deposit = async (request: DepositRequest): Promise<boolean> => {
    try {
      setLoading(true);
      await walletService.deposit(request); 
      await refreshWallet();
      toast({ title: "Nạp tiền thành công", description: `Đã nạp ${request.amount.toLocaleString('vi-VN')}₫` });
      return true;
    } catch (error) {
      toast({ title: "Nạp tiền thất bại", description: error.message, variant: "destructive" });
      setLoading(false);
      return false;
    }
  };

  
  const withdraw = async (request: WithdrawalRequest): Promise<boolean> => {
    try {
      setLoading(true);
      await walletService.withdraw(request); 
      await refreshWallet();
      toast({ title: "Rút tiền thành công", description: `Đã rút ${request.amount.toLocaleString('vi-VN')}₫` });
      return true;
    } catch (error) {
      toast({ title: "Rút tiền thất bại", description: error.message, variant: "destructive" });
      setLoading(false);
      return false;
    }
  };

  const value: WalletContextType = {
    wallet,
    refreshWallet,
    deposit, 
    withdraw, 
    loading,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};