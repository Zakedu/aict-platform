/**
 * 인증 컨텍스트 (Mock)
 * localStorage 기반 Mock 인증 시스템
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const STORAGE_KEYS = {
  AUTH_USER: 'aict_auth_user',
  AUTH_TOKEN: 'aict_auth_token',
  USERS_DB: 'aict_users_db',
} as const;

const TEST_ACCOUNT = {
  id: 'test_user',
  email: 'test@aict.kr',
  password: 'test1234',
  name: '테스트 계정',
  phone: '010-0000-0000',
  createdAt: '2026-01-01',
  marketingConsent: false,
} as const;

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  createdAt: string;
  marketingConsent: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
  phone: string;
  marketingConsent: boolean;
}

interface StoredUser extends User {
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드 시 저장된 사용자 정보 복원
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      const savedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const seedTestAccount = (users: StoredUser[]) => {
    if (users.some(user => user.email === TEST_ACCOUNT.email)) {
      return users;
    }
    return [...users, { ...TEST_ACCOUNT }];
  };

  // 사용자 DB 가져오기
  const getUsersDb = (): StoredUser[] => {
    try {
      const db = localStorage.getItem(STORAGE_KEYS.USERS_DB);
      const users = db ? JSON.parse(db) : [];
      const seededUsers = seedTestAccount(users);
      if (seededUsers.length !== users.length) {
        localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(seededUsers));
      }
      return seededUsers;
    } catch {
      return seedTestAccount([]);
    }
  };

  // 사용자 DB 저장
  const saveUsersDb = (users: StoredUser[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(seedTestAccount(users)));
  };

  // 회원가입
  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
    // 시뮬레이션된 지연
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getUsersDb();

    // 이메일 중복 체크
    if (users.some(u => u.email === data.email)) {
      return { success: false, error: '이미 사용 중인 이메일입니다.' };
    }

    // 새 사용자 생성
    const newUser: StoredUser = {
      id: `user_${Date.now()}`,
      email: data.email,
      password: data.password, // 실제로는 해시 처리 필요
      name: data.name,
      phone: data.phone,
      createdAt: new Date().toISOString().split('T')[0],
      marketingConsent: data.marketingConsent,
    };

    users.push(newUser);
    saveUsersDb(users);

    return { success: true };
  };

  // 로그인
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // 시뮬레이션된 지연
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getUsersDb();
    const foundUser = users.find(u => u.email === email && u.password === password);

    if (!foundUser) {
      return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    }

    // 비밀번호 제외한 사용자 정보
    const { password: _, ...userWithoutPassword } = foundUser;

    // 토큰 생성 (Mock)
    const token = `mock_token_${Date.now()}`;

    // 저장
    setUser(userWithoutPassword);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(userWithoutPassword));
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

    return { success: true };
  };

  // 로그아웃
  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  };

  // 사용자 정보 업데이트
  const updateUser = (data: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updatedUser));

    // DB도 업데이트
    const users = getUsersDb();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...users[index], ...data };
      saveUsersDb(users);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
