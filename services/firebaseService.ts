import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  where,
  Timestamp,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase.config';

// Types
export interface Post {
  id?: string;
  title: string;
  channel: 'Instagram' | 'GMB' | 'Blog' | 'Email';
  status: 'published' | 'scheduled' | 'draft';
  date: Date;
  content?: string;
  engagement?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Metric {
  id?: string;
  channel: string;
  value: number;
  change: number;
  date: Date;
  icon: string;
}

export interface Idea {
  id?: string;
  category: string;
  title: string;
  used: boolean;
  createdAt?: Date;
}

// Posts Service
export const postsService = {
  // Criar novo post
  async create(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'posts'), {
        ...post,
        date: Timestamp.fromDate(post.date),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Erro ao criar post:', error);
      return { success: false, error };
    }
  },

  // Buscar posts recentes
  async getRecent(limitCount: number = 10) {
    try {
      const q = query(
        collection(db, 'posts'),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          title: data.title,
          channel: data.channel,
          status: data.status,
          date: data.date.toDate(),
          content: data.content,
          engagement: data.engagement,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });
      return { success: true, data: posts };
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      return { success: false, error, data: [] };
    }
  },

  // Buscar posts agendados
  async getScheduled() {
    try {
      const q = query(
        collection(db, 'posts'),
        where('status', '==', 'scheduled'),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          title: data.title,
          channel: data.channel,
          status: data.status,
          date: data.date.toDate(),
          content: data.content,
        });
      });
      return { success: true, data: posts };
    } catch (error) {
      console.error('Erro ao buscar posts agendados:', error);
      return { success: false, error, data: [] };
    }
  },

  // Atualizar post
  async update(id: string, updates: Partial<Post>) {
    try {
      const postRef = doc(db, 'posts', id);
      await updateDoc(postRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar post:', error);
      return { success: false, error };
    }
  },

  // Deletar post
  async delete(id: string) {
    try {
      await deleteDoc(doc(db, 'posts', id));
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar post:', error);
      return { success: false, error };
    }
  },
};

// Metrics Service
export const metricsService = {
  // Salvar métricas
  async save(metric: Omit<Metric, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'metrics'), {
        ...metric,
        date: Timestamp.fromDate(metric.date),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Erro ao salvar métrica:', error);
      return { success: false, error };
    }
  },

  // Buscar métricas mais recentes
  async getLatest() {
    try {
      const q = query(
        collection(db, 'metrics'),
        orderBy('date', 'desc'),
        limit(4)
      );
      const querySnapshot = await getDocs(q);
      const metrics: Metric[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        metrics.push({
          id: doc.id,
          channel: data.channel,
          value: data.value,
          change: data.change,
          date: data.date.toDate(),
          icon: data.icon,
        });
      });
      return { success: true, data: metrics };
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      return { success: false, error, data: [] };
    }
  },
};

// Ideas Service
export const ideasService = {
  // Criar ideia
  async create(idea: Omit<Idea, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'ideas'), {
        ...idea,
        createdAt: Timestamp.now(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Erro ao criar ideia:', error);
      return { success: false, error };
    }
  },

  // Buscar ideias por categoria
  async getByCategory(category: string) {
    try {
      const q = query(
        collection(db, 'ideas'),
        where('category', '==', category),
        where('used', '==', false)
      );
      const querySnapshot = await getDocs(q);
      const ideas: Idea[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ideas.push({
          id: doc.id,
          category: data.category,
          title: data.title,
          used: data.used,
          createdAt: data.createdAt?.toDate(),
        });
      });
      return { success: true, data: ideas };
    } catch (error) {
      console.error('Erro ao buscar ideias:', error);
      return { success: false, error, data: [] };
    }
  },

  // Marcar ideia como usada
  async markAsUsed(id: string) {
    try {
      const ideaRef = doc(db, 'ideas', id);
      await updateDoc(ideaRef, { used: true });
      return { success: true };
    } catch (error) {
      console.error('Erro ao marcar ideia como usada:', error);
      return { success: false, error };
    }
  },

  // Buscar todas as ideias
  async getAll() {
    try {
      const querySnapshot = await getDocs(collection(db, 'ideas'));
      const ideas: Idea[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ideas.push({
          id: doc.id,
          category: data.category,
          title: data.title,
          used: data.used,
          createdAt: data.createdAt?.toDate(),
        });
      });
      return { success: true, data: ideas };
    } catch (error) {
      console.error('Erro ao buscar ideias:', error);
      return { success: false, error, data: [] };
    }
  },
};

// Analytics Service
export const analyticsService = {
  // Buscar resumo semanal
  async getWeeklySummary() {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const q = query(
        collection(db, 'posts'),
        where('status', '==', 'published'),
        where('date', '>=', Timestamp.fromDate(weekAgo))
      );
      
      const querySnapshot = await getDocs(q);
      
      const summary = {
        totalPosts: querySnapshot.size,
        totalEngagement: 0,
        newLeads: 0,
        conversions: 0,
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        summary.totalEngagement += data.engagement || 0;
      });

      return { success: true, data: summary };
    } catch (error) {
      console.error('Erro ao buscar resumo semanal:', error);
      return { 
        success: false, 
        error,
        data: { totalPosts: 0, totalEngagement: 0, newLeads: 0, conversions: 0 }
      };
    }
  },
};
