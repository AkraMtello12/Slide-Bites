import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  setDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { User, Restaurant, Poll, OrderItem } from '../types';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSrTfbpgwt--atye3ERvDF9tgOLHogrAo",
  authDomain: "myslide-food.firebaseapp.com",
  projectId: "myslide-food",
  storageBucket: "myslide-food.firebasestorage.app",
  messagingSenderId: "872555742002",
  appId: "1:872555742002:web:a4f41cb05de9ce86d14d2b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// --- Collections References ---
const USERS_COL = 'users';
const RESTAURANTS_COL = 'restaurants';
const POLLS_COL = 'polls';
const ORDERS_COL = 'orders'; 

// --- Data Seeding (Disabled) ---
export const seedDatabase = async () => {
  console.log("Seeding is disabled.");
};

// --- Users Service ---
export const subscribeToUsers = (callback: (users: User[]) => void) => {
  return onSnapshot(collection(db, USERS_COL), (snapshot) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    callback(users);
  });
};

export const addUserToDb = async (user: User) => {
  await setDoc(doc(db, USERS_COL, user.id), user);
};

export const deleteUserFromDb = async (id: string) => {
  await deleteDoc(doc(db, USERS_COL, id));
};

// --- Restaurants Service ---
export const subscribeToRestaurants = (callback: (rests: Restaurant[]) => void) => {
  return onSnapshot(collection(db, RESTAURANTS_COL), (snapshot) => {
    const rests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
    callback(rests);
  });
};

export const addRestaurantToDb = async (restaurant: Restaurant) => {
  await setDoc(doc(db, RESTAURANTS_COL, restaurant.id), restaurant);
};

export const updateRestaurantInDb = async (restaurant: Restaurant) => {
  await setDoc(doc(db, RESTAURANTS_COL, restaurant.id), restaurant);
};

export const deleteRestaurantFromDb = async (id: string) => {
  await deleteDoc(doc(db, RESTAURANTS_COL, id));
};

// --- Polls Service ---
export const subscribeToPolls = (callback: (polls: Poll[]) => void) => {
  const q = query(collection(db, POLLS_COL));
  return onSnapshot(q, (snapshot) => {
    const polls = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            // Handle Firestore Timestamp to JS Date conversion
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        } as Poll;
    });
    polls.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(polls);
  });
};

export const addPollToDb = async (poll: Poll) => {
  await setDoc(doc(db, POLLS_COL, poll.id), poll);
};

export const deletePollFromDb = async (id: string) => {
  await deleteDoc(doc(db, POLLS_COL, id));
};

export const voteOnPollInDb = async (pollId: string, updatedOptions: any[]) => {
  const pollRef = doc(db, POLLS_COL, pollId);
  await updateDoc(pollRef, { options: updatedOptions });
};

// --- Orders Service ---
// Updated to return deliveryFee AND isLocked status
export const subscribeToRestaurantOrders = (restaurantId: string, callback: (items: OrderItem[], deliveryFee: number, isLocked: boolean) => void) => {
    const docRef = doc(db, ORDERS_COL, restaurantId);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            callback(data.items || [], data.deliveryFee || 0, data.isLocked || false);
        } else {
            callback([], 0, false);
        }
    });
};

// Updated to save isLocked
export const updateRestaurantOrdersInDb = async (restaurantId: string, items: OrderItem[], deliveryFee: number, isLocked: boolean) => {
    const docRef = doc(db, ORDERS_COL, restaurantId);
    await setDoc(docRef, { items, deliveryFee, isLocked }, { merge: true });
};