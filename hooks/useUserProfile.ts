import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, updateProfile, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db } from '../firebase';

interface UserProfile {
  displayName: string;
  team: string;
  isFirstLogin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const useUserProfile = (user: any) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserProfile({
            displayName: data.displayName || '',
            team: data.team || '',
            isFirstLogin: data.isFirstLogin ?? true,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        } else {
          // 사용자 문서가 없으면 생성 (최초 로그인)
          const newProfile: UserProfile = {
            displayName: user.displayName || '',
            team: '',
            isFirstLogin: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await setDoc(userDocRef, {
            ...newProfile,
            email: user.email,
            uid: user.uid
          });
          
          setUserProfile(newProfile);
        }
      } catch (error) {
        console.error('사용자 프로필 로드 오류:', error);
        setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [user]);

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await updateDoc(userDocRef, updateData);
      
      setUserProfile(prev => prev ? { ...prev, ...updateData } : null);
    } catch (error) {
      console.error('사용자 프로필 업데이트 오류:', error);
      throw new Error('사용자 정보 업데이트 중 오류가 발생했습니다.');
    }
  };

  const completeFirstLoginSetup = async (displayName: string, team: string, currentPassword: string, newPassword: string) => {
    if (!user || !user.email) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      // 현재 비밀번호로 재인증
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Firebase Auth 프로필 업데이트
      await updateProfile(user, { displayName });
      
      // 비밀번호 변경
      await updatePassword(user, newPassword);
      
      // Firestore 사용자 문서 업데이트
      await updateUserProfile({
        displayName,
        team,
        isFirstLogin: false
      });

    } catch (error: any) {
      console.error('최초 설정 완료 오류:', error);
      if (error.code === 'auth/weak-password') {
        throw new Error('비밀번호는 6자 이상이어야 합니다.');
      } else if (error.code === 'auth/requires-recent-login') {
        throw new Error('보안을 위해 다시 로그인해주세요.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('현재 비밀번호가 올바르지 않습니다.');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('현재 비밀번호가 올바르지 않습니다.');
      }
      throw new Error('설정 완료 중 오류가 발생했습니다.');
    }
  };

  return {
    userProfile,
    loading,
    error,
    updateUserProfile,
    completeFirstLoginSetup
  };
}; 