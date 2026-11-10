import { db, auth } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

const userPath = () => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Please sign in first.");
  return uid;
};

export async function listConversations(max = 50) {
  const uid = userPath();
  const ref = collection(db, "users", uid, "conversations");
  const snap = await getDocs(query(ref, orderBy("updatedAt", "desc"), limit(max)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createConversation(data = {}) {
  const uid = userPath();
  const ref = collection(db, "users", uid, "conversations");
  const created = await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: created.id, ...data };
}

export async function updateConversation(id, data) {
  const uid = userPath();
  await setDoc(doc(db, "users", uid, "conversations", id), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteConversation(id) {
  const uid = userPath();
  const conversationRef = doc(db, "users", uid, "conversations", id);
  const messagesRef = collection(conversationRef, "messages");
  const messages = await getDocs(messagesRef);
  await Promise.all(messages.docs.map(d => deleteDoc(d.ref)));
  await deleteDoc(conversationRef);
}

export async function listMessages(conversationId, max = 1000) {
  const uid = userPath();
  const ref = collection(db, "users", uid, "conversations", conversationId, "messages");
  const snap = await getDocs(query(ref, orderBy("createdAt", "asc"), limit(max)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveMessage(conversationId, data) {
  const uid = userPath();
  const ref = collection(db, "users", uid, "conversations", conversationId, "messages");
  const created = await addDoc(ref, { ...data, createdAt: serverTimestamp() });
  return { id: created.id, ...data };
}

export async function deleteMessagesFrom(conversationId, startIndex) {
  const uid = userPath();
  const ref = collection(db, "users", uid, "conversations", conversationId, "messages");
  const snap = await getDocs(query(ref, orderBy("createdAt", "asc")));
  const targets = snap.docs.slice(Math.max(0, startIndex));
  await Promise.all(targets.map(item => deleteDoc(item.ref)));
}

export async function clearMessages(conversationId) {
  const uid = userPath();
  const ref = collection(db, "users", uid, "conversations", conversationId, "messages");
  const snap = await getDocs(ref);
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}
