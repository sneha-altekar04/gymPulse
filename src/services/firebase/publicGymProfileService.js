import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  collection,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const publicProfileFields = [
  'gymId', 'name', 'slug', 'tagline', 'description', 'phone', 'email',
  'address', 'city', 'state', 'pincode', 'googleMapsUrl', 'latitude',
  'longitude', 'website', 'instagram', 'facebook', 'heroImageUrl', 'ownerName',
  'ownerDesignation', 'ownerIntroduction', 'facilities', 'openingHours',
  'publicProfileEnabled'
];

export function normaliseGymSlug(value = '') {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function isValidGymSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function cleanProfile(profile) {
  return Object.fromEntries(publicProfileFields.map((field) => [field, profile[field] ?? (field === 'facilities' ? [] : field === 'openingHours' ? {} : '')]));
}

export async function getPublicGymProfile(slug) {
  const snapshot = await getDoc(doc(db, 'publicGymProfiles', slug));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function savePublicGymProfile(gymId, profile, previousSlug = '') {
  const slug = normaliseGymSlug(profile.slug);
  if (!isValidGymSlug(slug)) throw new Error('Use lowercase letters, numbers, and single hyphens for the profile URL.');

  const profileRef = doc(db, 'publicGymProfiles', slug);
  const oldProfileRef = previousSlug && previousSlug !== slug ? doc(db, 'publicGymProfiles', previousSlug) : null;
  const publicProfile = { ...cleanProfile({ ...profile, gymId, slug }), updatedAt: serverTimestamp() };

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(profileRef);
    if (existing.exists() && existing.data().gymId !== gymId) {
      throw new Error('This profile URL is already in use. Please choose another one.');
    }
    transaction.set(profileRef, existing.exists() ? publicProfile : { ...publicProfile, createdAt: serverTimestamp() }, { merge: true });
    if (oldProfileRef) transaction.delete(oldProfileRef);
  });

  return slug;
}

export async function deletePublicGymProfile(slug) {
  await deleteDoc(doc(db, 'publicGymProfiles', slug));
}

export async function getPublicGymProfileForGym(gymId) {
  const snapshot = await getDocs(query(collection(db, 'publicGymProfiles'), where('gymId', '==', gymId), limit(1)));
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}