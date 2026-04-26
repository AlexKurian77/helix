import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { PastExperiment, Researcher, Equipment } from './labData';

const API_BASE_URL = '/api/lab';

interface LabDataContextType {
  equipment: Equipment[];
  researchers: Researcher[];
  pastExperiments: PastExperiment[];
  isLoading: boolean;
}

const LabDataContext = createContext<LabDataContextType>({
  equipment: [],
  researchers: [],
  pastExperiments: [],
  isLoading: true,
});

export function LabDataProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [pastExperiments, setPastExperiments] = useState<PastExperiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [eqRes, resRes, expRes] = await Promise.all([
          fetch(`${API_BASE_URL}/inventory`),
          fetch(`${API_BASE_URL}/researchers`),
          fetch(`${API_BASE_URL}/experiments`),
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

    fetchData();
  }, []);

  return (
    <LabDataContext.Provider value={{ equipment, researchers, pastExperiments, isLoading }}>
      {children}
    </LabDataContext.Provider>
  );
}

export function useLabData() {
  return useContext(LabDataContext);
}
