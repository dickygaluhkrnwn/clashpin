import { create } from 'zustand';
import { auth, googleProvider, db } from '@/lib/firebase';
import { 
  signInWithPopup, 
  signOut, 
  User, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthState {
  isInitialized: boolean;
  user: User | null;
  role: 'guest' | 'member' | 'leader';
  clanTag: string | null;
  clanId: string | null; 
  playerTag: string | null;
  initAuth: () => void;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  updateUserRole: (role: 'member' | 'leader', clanTag: string, clanId: string, playerTag: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isInitialized: false,
  user: null,
  role: 'guest',
  clanTag: null,
  clanId: null,
  playerTag: null,

  initAuth: () => {
    if (get().isInitialized) return;

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          const clanRole = data.clanRole || data.role || '';
          let appRole: 'guest' | 'member' | 'leader' = 'guest';
          
          if (data.playerTag || data.isVerified) {
             appRole = (clanRole === 'leader' || clanRole === 'coLeader') ? 'leader' : 'member';
          }

          set({ 
            user, 
            role: appRole, 
            clanTag: data.clanTag || null,
            clanId: data.clanId || null,
            playerTag: data.playerTag || null,
            isInitialized: true 
          });
        } else {
          set({ user, role: 'guest', clanTag: null, clanId: null, playerTag: null, isInitialized: true });
        }
      } else {
        set({ user: null, role: 'guest', clanTag: null, clanId: null, playerTag: null, isInitialized: true });
      }
    });
  },

  // LOGIN VIA GOOGLE
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const clanRole = data.clanRole || data.role || '';
        let appRole: 'guest' | 'member' | 'leader' = 'guest';
        
        if (data.playerTag || data.isVerified) {
           appRole = (clanRole === 'leader' || clanRole === 'coLeader') ? 'leader' : 'member';
        }
        set({ user, role: appRole, clanTag: data.clanTag || null, clanId: data.clanId || null, playerTag: data.playerTag || null });
      } else {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'guest',
          clanRole: 'member',
          isVerified: false,
          clanTag: null, clanId: null, playerTag: null,
          createdAt: new Date().toISOString()
        });
        set({ user, role: 'guest', clanTag: null, clanId: null, playerTag: null });
      }
    } catch (error: any) {
      throw error;
    }
  },

  // LOGIN VIA EMAIL
  loginWithEmail: async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const clanRole = data.clanRole || data.role || '';
        let appRole: 'guest' | 'member' | 'leader' = 'guest';
        if (data.playerTag || data.isVerified) {
           appRole = (clanRole === 'leader' || clanRole === 'coLeader') ? 'leader' : 'member';
        }
        set({ user, role: appRole, clanTag: data.clanTag || null, clanId: data.clanId || null, playerTag: data.playerTag || null });
      }
    } catch (error: any) {
      throw error;
    }
  },

  // REGISTER VIA EMAIL
  registerWithEmail: async (email, password, name) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Update display name di Firebase Auth
      await updateProfile(user, { displayName: name });

      // Simpan ke Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: name,
        photoURL: null,
        role: 'guest',
        clanRole: 'member',
        isVerified: false,
        clanTag: null, clanId: null, playerTag: null,
        createdAt: new Date().toISOString()
      });
      
      // Update state dengan nama yang baru di-set
      set({ user: { ...user, displayName: name } as User, role: 'guest', clanTag: null, clanId: null, playerTag: null });
    } catch (error: any) {
      throw error;
    }
  },

  logoutUser: async () => {
    try {
      await signOut(auth);
      set({ user: null, role: 'guest', clanTag: null, clanId: null, playerTag: null });
    } catch (error) {
      console.error("Gagal Logout:", error);
    }
  },

  updateUserRole: (role, clanTag, clanId, playerTag) => set({ role, clanTag, clanId, playerTag })
}));