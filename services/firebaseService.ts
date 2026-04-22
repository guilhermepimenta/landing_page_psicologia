import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  setDoc,
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
  format?: 'post' | 'reel';
  status: 'published' | 'scheduled' | 'draft';
  date: Date;
  content?: string;
  engagement?: number;
  imageUrls?: string[];
  videoUrl?: string;
  instagramPostId?: string;
  instagramPermalink?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const mapPost = (id: string, data: any): Post => ({
  id,
  title: data.title,
  channel: data.channel,
  format: data.format ?? 'post',
  status: data.status,
  date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
  content: data.content,
  engagement: data.engagement,
  imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
  videoUrl: data.videoUrl,
  instagramPostId: data.instagramPostId,
  instagramPermalink: data.instagramPermalink,
  createdAt: data.createdAt?.toDate?.(),
  updatedAt: data.updatedAt?.toDate?.(),
});

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
  description?: string;
  used: boolean;
  createdAt?: Date;
}

export interface Profile {
  name: string;
  specialty: string;
  crp: string;
  photoURL?: string;
  bio?: string;
  reportEmail?: string;
  updatedAt?: Date;
}

export interface DashboardAlert {
  id?: string;
  key: string;
  severity: 'warning' | 'critical' | 'info';
  status: 'active' | 'resolved';
  message: string;
  source?: string;
  createdAt?: Date;
  resolvedAt?: Date;
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
        posts.push(mapPost(doc.id, doc.data()));
      });
      return { success: true, data: posts };
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      return { success: false, error, data: [] };
    }
  },

  // Buscar todos os posts
  async getAll() {
    try {
      const q = query(
        collection(db, 'posts'),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];
      querySnapshot.forEach((doc) => {
        posts.push(mapPost(doc.id, doc.data()));
      });
      return { success: true, data: posts };
    } catch (error) {
      console.error('Erro ao buscar todos os posts:', error);
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
        posts.push(mapPost(doc.id, doc.data()));
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
      const payload: Record<string, unknown> = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      if (updates.date) {
        payload.date = Timestamp.fromDate(updates.date);
      }

      await updateDoc(postRef, {
        ...payload,
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

  // Desmarcar ideia (voltar para não usada)
  async unmarkAsUsed(id: string) {
    try {
      const ideaRef = doc(db, 'ideas', id);
      await updateDoc(ideaRef, { used: false });
      return { success: true };
    } catch (error) {
      console.error('Erro ao desmarcar ideia:', error);
      return { success: false, error };
    }
  },

  // Deletar ideia
  async delete(id: string) {
    try {
      await deleteDoc(doc(db, 'ideas', id));
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar ideia:', error);
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

// Alerts Service (Sprint 7)
export const alertsService = {
  async getLatest(limitCount: number = 30) {
    try {
      const q = query(
        collection(db, 'alerts'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      const alerts: DashboardAlert[] = [];

      snapshot.forEach((d) => {
        const data = d.data();
        alerts.push({
          id: d.id,
          key: String(data.key ?? ''),
          severity: (data.severity ?? 'warning') as DashboardAlert['severity'],
          status: (data.status ?? 'active') as DashboardAlert['status'],
          message: String(data.message ?? ''),
          source: data.source,
          createdAt: data.createdAt?.toDate?.(),
          resolvedAt: data.resolvedAt?.toDate?.(),
        });
      });

      return { success: true, data: alerts };
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      return { success: false, error, data: [] as DashboardAlert[] };
    }
  },

  async getActive(limitCount: number = 30) {
    const latest = await this.getLatest(limitCount);
    if (!latest.success) return latest;
    return {
      success: true,
      data: latest.data.filter((a) => a.status === 'active'),
    };
  },
};

// Messages Service
export interface Message {
  id?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'nova' | 'lida' | 'respondida';
  createdAt?: Date;
}

export const messagesService = {
  async create(msg: Omit<Message, 'id' | 'status' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'mensagens'), {
        ...msg,
        status: 'nova',
        createdAt: Timestamp.now(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      return { success: false, error };
    }
  },

  async getAll() {
    try {
      const q = query(collection(db, 'mensagens'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const msgs: Message[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        msgs.push({
          id: d.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message,
          status: data.status,
          createdAt: data.createdAt?.toDate(),
        });
      });
      return { success: true, data: msgs };
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return { success: false, error, data: [] as Message[] };
    }
  },

  async updateStatus(id: string, status: Message['status']) {
    try {
      await updateDoc(doc(db, 'mensagens', id), { status });
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return { success: false, error };
    }
  },

  async delete(id: string) {
    try {
      await deleteDoc(doc(db, 'mensagens', id));
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error);
      return { success: false, error };
    }
  },
};

// Weekly Goal Service
export interface WeeklyGoal {
  label: string;
  target: number;
  current: number;
}

const WEEKLY_GOAL_DEFAULTS: WeeklyGoal = { label: 'novos leads', target: 10, current: 0 };

export const weeklyGoalService = {
  async get(): Promise<{ success: boolean; data: WeeklyGoal }> {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'weeklyGoal'));
      if (docSnap.exists()) {
        const d = docSnap.data();
        return { success: true, data: { label: d.label ?? 'novos leads', target: d.target ?? 10, current: d.current ?? 0 } };
      }
      return { success: true, data: WEEKLY_GOAL_DEFAULTS };
    } catch (error) {
      return { success: false, data: WEEKLY_GOAL_DEFAULTS };
    }
  },

  async save(goal: WeeklyGoal): Promise<{ success: boolean }> {
    try {
      await setDoc(doc(db, 'settings', 'weeklyGoal'), { ...goal, updatedAt: Timestamp.now() });
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  },
};

// Profile Service
export const profileService = {
  async get() {
    try {
      const docRef = doc(db, 'settings', 'profile');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          success: true,
          data: {
            name: data.name || '',
            specialty: data.specialty || '',
            crp: data.crp || '',
            photoURL: data.photoURL || '',
            bio: data.bio || '',
            reportEmail: data.reportEmail || '',
            updatedAt: data.updatedAt?.toDate(),
          } as Profile,
        };
      }
      return { success: true, data: null };
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return { success: false, error, data: null };
    }
  },

  async save(profile: Omit<Profile, 'updatedAt'>) {
    try {
      const docRef = doc(db, 'settings', 'profile');
      await setDoc(docRef, {
        ...profile,
        reportEmail: profile.reportEmail || '',
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      return { success: false, error };
    }
  },
};
