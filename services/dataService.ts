import { User, Prize, Action, PointTransaction } from '../types';
import { ADMIN_USERNAME, ADMIN_PASSWORD, PASSWORD_CHARSET, PASSWORD_LENGTH } from '../constants';
import { db } from '../firebase';
import { 
    collection, getDocs, doc, setDoc, addDoc, query, where, writeBatch,
    deleteDoc, getDoc, updateDoc, orderBy, limit
} from "firebase/firestore";

const CURRENT_USER_KEY = 'fidelity_current_user';

// --- Collection References ---
const usersCollection = collection(db, 'users');
const prizesCollection = collection(db, 'prizes');
const actionsCollection = collection(db, 'actions');
const regulationsCollection = collection(db, 'regulations');
const transactionsCollection = collection(db, 'transactions');

const cleanUserForStorage = (user: User): User => {
    return {
        id: user.id,
        username: user.username,
        // NON salvare la password in localStorage per sicurezza, tranne se appena generata.
        // password: user.password, 
        firstName: user.firstName,
        lastName: user.lastName,
        points: user.points,
        isInitialLogin: user.isInitialLogin,
        role: user.role,
        creationDate: user.creationDate,
    };
};

export const initData = async (): Promise<void> => {
    const q = query(usersCollection, where("role", "==", "admin"));
    const adminSnapshot = await getDocs(q);

    if (adminSnapshot.empty) {
        console.log("No admin found, initializing database...");
        const batch = writeBatch(db);

        const adminUser: User = {
            id: 'admin-user',
            username: ADMIN_USERNAME,
            password: ADMIN_PASSWORD,
            firstName: 'Admin',
            lastName: 'User',
            points: 0,
            isInitialLogin: false,
            role: 'admin',
            creationDate: new Date().toISOString()
        };
        const adminDocRef = doc(db, 'users', 'admin-user');
        batch.set(adminDocRef, adminUser);

        const initialPrizes: Omit<Prize, 'id'>[] = [
            { name: 'Caffè Omaggio', description: 'Un caffè espresso offerto.', pointsRequired: 50 },
            { name: 'Sconto 10% Taglio', description: '10% di sconto sul prossimo taglio.', pointsRequired: 200 },
        ];
        initialPrizes.forEach(prize => {
            const prizeDocRef = doc(prizesCollection);
            batch.set(prizeDocRef, prize);
        });

        const initialActions: Omit<Action, 'id' | 'isEnabled'>[] = [
            { name: 'Taglio Uomo', points: 20, description: 'Servizio di taglio per uomo.' },
            { name: 'Taglio Donna', points: 30, description: 'Servizio di taglio e piega per donna.' },
        ];
        initialActions.forEach(action => {
            const actionDocRef = doc(actionsCollection);
            batch.set(actionDocRef, { ...action, isEnabled: true });
        });

        const regulationsDocRef = doc(db, 'regulations', 'main');
        batch.set(regulationsDocRef, { text: 'Benvenuto nel nostro programma fedeltà! Accumula punti con ogni acquisto e riscatta fantastici premi.' });

        await batch.commit();
        console.log("Database initialized successfully.");
    }
};

export const login = async (username: string, password_input: string): Promise<User | null> => {
    // Firestore queries are case-sensitive. To allow case-insensitive username login,
    // we perform a client-side filter. This is acceptable for a small-to-medium user base
    // and is consistent with other data fetching patterns in this service.
    const allUsers = await getUsers();
    
    const user = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password_input);

    if (!user) {
        return null;
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cleanUserForStorage(user)));
    return user;
};

export const logout = (): void => {
    localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
};

export const getUsers = async (): Promise<User[]> => {
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as User);
};

const generatePassword = (): string => {
    let password = '';
    for (let i = 0; i < PASSWORD_LENGTH; i++) {
        password += PASSWORD_CHARSET.charAt(Math.floor(Math.random() * PASSWORD_CHARSET.length));
    }
    return password;
};

export const createCustomer = async (): Promise<User> => {
    const allUsers = await getUsers();
    const customerUsers = allUsers.filter(u => u.role === 'customer');
    
    const existingIds = customerUsers
        .map(u => parseInt(u.username.replace('CL', ''), 10))
        .filter(id => !isNaN(id))
        .sort((a, b) => a - b);

    let nextId = 1;
    for (const id of existingIds) {
        if (id === nextId) {
            nextId++;
        } else {
            break;
        }
    }
    
    const username = `CL${String(nextId).padStart(3, '0')}`;
    
    const newUserRef = doc(usersCollection);
    const newUser: User = {
        id: newUserRef.id,
        username: username,
        password: generatePassword(),
        firstName: null,
        lastName: null,
        points: 0,
        isInitialLogin: true,
        role: 'customer',
        creationDate: new Date().toISOString()
    };

    await setDoc(newUserRef, newUser);
    
    await addTransaction({
        userId: newUser.id,
        type: 'creation',
        description: 'Creazione Account',
        pointsChange: 0,
        balanceAfter: 0,
    });

    return newUser;
};

export const updateUser = async (updatedUser: User): Promise<User> => {
    const userDocRef = doc(db, 'users', updatedUser.id);
    await setDoc(userDocRef, updatedUser, { merge: true });
    
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === updatedUser.id) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cleanUserForStorage(updatedUser)));
    }
    return updatedUser;
};

export const deleteCustomer = async (userId: string): Promise<void> => {
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
};

const addTransaction = async (txData: Omit<PointTransaction, 'id' | 'date'>): Promise<void> => {
    const newTransactionRef = doc(transactionsCollection);
    const newTransaction: PointTransaction = {
        id: newTransactionRef.id,
        // FIX: Removed extra 'new' keyword.
        date: new Date().toISOString(),
        ...txData,
    };
    await setDoc(newTransactionRef, newTransaction);
};

export const updateUserPoints = async (userId: string, pointsChange: number, description: string): Promise<User | null> => {
    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return null;

    const user = userSnap.data() as User;
    const newPoints = Math.max(0, user.points + pointsChange);
    
    await addTransaction({
        userId: user.id,
        type: pointsChange >= 0 ? 'assignment' : 'redemption',
        description,
        pointsChange,
        balanceAfter: newPoints,
    });
    
    const updatedUser = { ...user, points: newPoints };
    await updateUser(updatedUser);
    return updatedUser;
};

export const reverseTransaction = async (transactionId: string): Promise<User | null> => {
    const originalTxRef = doc(db, 'transactions', transactionId);
    const originalTxSnap = await getDoc(originalTxRef);
    if (!originalTxSnap.exists()) return null;
    
    const originalTx = originalTxSnap.data() as PointTransaction;
    if (originalTx.isReversed) return null;

    const userDocRef = doc(db, 'users', originalTx.userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return null;
    
    const user = userSnap.data() as User;

    const reversalPointsChange = -originalTx.pointsChange;
    const newBalance = Math.max(0, user.points + reversalPointsChange);

    const reversalTxRef = doc(transactionsCollection);
    const reversalTx: PointTransaction = {
        id: reversalTxRef.id,
        date: new Date().toISOString(),
        userId: originalTx.userId,
        type: 'reversal',
        description: `Storno: ${originalTx.description}`,
        pointsChange: reversalPointsChange,
        balanceAfter: newBalance,
        isReversed: true,
        reversalOf: originalTx.id,
    };
    
    const batch = writeBatch(db);
    batch.set(reversalTxRef, reversalTx);
    batch.update(originalTxRef, { isReversed: true });
    
    await batch.commit();

    const updatedUser = { ...user, points: newBalance };
    await updateUser(updatedUser);
    return updatedUser;
};

export const getTransactionsForUser = async (userId: string): Promise<PointTransaction[]> => {
    // Rimuovo orderBy per evitare la necessità di un indice composito.
    // L'ordinamento verrà eseguito lato client.
    const q = query(transactionsCollection, where("userId", "==", userId));
    
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as PointTransaction);
    
    // Ordino le transazioni per data, dalla più recente alla più vecchia, qui nel codice.
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return transactions;
};

export const getRecentTransactions = async (count: number = 10): Promise<(PointTransaction & { userName: string })[]> => {
    const q = query(transactionsCollection, orderBy("date", "desc"), limit(count)); 
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as PointTransaction);
    
    const users = await getUsers();
    const customerUsers = users.filter(u => u.role === 'customer');
    
    const transactionsWithUsers = transactions
        .map(tx => {
            const user = customerUsers.find(u => u.id === tx.userId);
            if (!user) return null; // Ignora transazioni di utenti non trovati o admin
            const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
            return { ...tx, userName };
        })
        .filter(Boolean) as (PointTransaction & { userName: string })[];

    return transactionsWithUsers
        .filter(tx => tx.type === 'assignment' || tx.type === 'redemption');
};

export const getAllTransactions = async (): Promise<PointTransaction[]> => {
    const snapshot = await getDocs(transactionsCollection);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as PointTransaction);
};


export const getPrizes = async (): Promise<Prize[]> => {
    const q = query(prizesCollection, orderBy("pointsRequired", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Prize);
};

export const createOrUpdatePrize = async (prize: Omit<Prize, 'id'> & { id?: string }): Promise<Prize> => {
    const { id, ...dataToSave } = prize;
    let prizeId: string;
    
    if (id) {
        // Update logic
        const docRef = doc(prizesCollection, id);
        await setDoc(docRef, dataToSave, { merge: true });
        prizeId = id;
    } else {
        // Create logic
        const docRef = await addDoc(prizesCollection, dataToSave);
        prizeId = docRef.id;
    }

    const snapshot = await getDoc(doc(prizesCollection, prizeId));
    if (!snapshot.exists()) throw new Error("Prize document not found after save!");
    return { ...snapshot.data(), id: snapshot.id } as Prize;
};

export const deletePrize = async (prizeId: string): Promise<void> => {
    const docRef = doc(db, 'prizes', prizeId);
    await deleteDoc(docRef);
};

export const getActions = async (): Promise<Action[]> => {
    const q = query(actionsCollection, orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Action);
};

export const createOrUpdateAction = async (action: Partial<Action>): Promise<Action> => {
    const { id, ...dataToSave } = action;
    let actionId: string;

    if (id) {
        // Update logic
        const docRef = doc(actionsCollection, id);
        await setDoc(docRef, dataToSave, { merge: true });
        actionId = id;
    } else {
        // Create logic
        const createData = { ...dataToSave, isEnabled: true };
        const docRef = await addDoc(actionsCollection, createData);
        actionId = docRef.id;
    }
    
    const snapshot = await getDoc(doc(actionsCollection, actionId));
    if (!snapshot.exists()) throw new Error("Action document not found after save!");
    return { ...snapshot.data(), id: snapshot.id } as Action;
};

export const deleteAction = async (actionId: string): Promise<void> => {
    const docRef = doc(db, 'actions', actionId);
    await deleteDoc(docRef);
};

export const getRegulations = async (): Promise<string> => {
    const docRef = doc(db, 'regulations', 'main');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().text;
    }
    return '';
};
export const saveRegulations = async (text: string): Promise<void> => {
    const docRef = doc(db, 'regulations', 'main');
    await setDoc(docRef, { text });
};