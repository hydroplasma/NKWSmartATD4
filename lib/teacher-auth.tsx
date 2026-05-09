import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TeacherSession } from "@/shared/types";

const STORAGE_KEY = "teacher_session";

interface TeacherAuthContextType {
  teacher: TeacherSession | null;
  isLoading: boolean;
  setTeacher: (teacher: TeacherSession | null) => Promise<void>;
  logout: () => Promise<void>;
}

const TeacherAuthContext = createContext<TeacherAuthContextType | null>(null);

export function TeacherAuthProvider({ children }: { children: React.ReactNode }) {
  const [teacher, setTeacherState] = useState<TeacherSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          setTeacherState(JSON.parse(raw));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const setTeacher = async (t: TeacherSession | null) => {
    setTeacherState(t);
    if (t) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(t));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  };

  const logout = async () => {
    await setTeacher(null);
  };

  return (
    <TeacherAuthContext.Provider value={{ teacher, isLoading, setTeacher, logout }}>
      {children}
    </TeacherAuthContext.Provider>
  );
}

export function useTeacherAuth() {
  const ctx = useContext(TeacherAuthContext);
  if (!ctx) throw new Error("useTeacherAuth must be used within TeacherAuthProvider");
  return ctx;
}
