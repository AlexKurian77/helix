import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { PastExperiment, Researcher, Equipment } from './labData';

import { API_BASE_URL } from './api';
const LAB_API_URL = `${API_BASE_URL}/lab`;

interface LabDataContextType {
  equipment: Equipment[];
  researchers: Researcher[];
  pastExperiments: PastExperiment[];
  isLoading: boolean;
  deleteExperiment: (id: string) => Promise<boolean>;
}

const LabDataContext = createContext<LabDataContextType>({
  equipment: [],
  researchers: [],
  pastExperiments: [],
  isLoading: true,
  deleteExperiment: async () => false,
});

export function LabDataProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [pastExperiments, setPastExperiments] = useState<PastExperiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [eqRes, resRes, expRes] = await Promise.all([
        fetch(`${LAB_API_URL}/inventory`),
        fetch(`${LAB_API_URL}/researchers`),
        fetch(`${LAB_API_URL}/experiments`),
      ]);

      if (eqRes.ok) {
        const data = await eqRes.json();
        if (Array.isArray(data)) setEquipment(data);
      }
      if (resRes.ok) {
        const data = await resRes.json();
        if (Array.isArray(data)) setResearchers(data);
      }
      if (expRes.ok) {
        const data = await expRes.json();
        if (Array.isArray(data)) setPastExperiments(data);
      }
    } catch (e) {
      console.error("Failed to fetch lab data", e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const deleteExperiment = async (id: string) => {
    try {
      const res = await fetch(`${LAB_API_URL}/experiments/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPastExperiments(prev => prev.filter(e => e.id !== id));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to delete experiment", e);
      return false;
    }
  };

  return (
    <LabDataContext.Provider value={{ equipment, researchers, pastExperiments, isLoading, deleteExperiment }}>
      {children}
    </LabDataContext.Provider>
  );
}

export function useLabData() {
  return useContext(LabDataContext);
}
