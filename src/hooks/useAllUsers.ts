import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { EnrichedUser, UserDocument } from '../types/user';

/**
 * Custom hook to fetch all users from the 'users' collection in real-time.
 * @returns An object containing the list of users, a loading state, and an error state.
 */
export const useAllUsers = () => {
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData = snapshot.docs.map((doc): EnrichedUser => {
          const userData = doc.data() as UserDocument;
          return {
            id: doc.id,
            ...userData,
          };
        });

        setUsers(usersData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching users: ", err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { users, loading, error };
};