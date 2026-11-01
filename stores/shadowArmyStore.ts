import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WEEKLY_BOSSES, type WeeklyBoss } from '../constants/bosses';
import { Haptics } from '../services/haptics';
import { SoundEffects } from '../services/soundEffects';

export interface ShadowArmySoldier {
  bossId: string;
  name: string;
  shadowTitle: string;
  rankBadge: string;
  emoji: string;
  imageUrl?: string;
  color: string;
  extractedAt: string;
  buffType: 'xp_boost' | 'strength_buff' | 'agility_buff' | 'vitality_buff' | 'recovery_boost';
  buffDescription: string;
  buffValue: number; // Porcentaje, ej: 10 para +10%
  grade: 'Normal' | 'Élite' | 'Comandante' | 'General' | 'Gran Mariscal';
}

interface ShadowArmyStore {
  soldiers: ShadowArmySoldier[];
  equippedShadowId: string | null;
  isLoaded: boolean;
  initialize: (uid: string) => Promise<void>;
  extractShadow: (bossId: string, uid: string) => Promise<ShadowArmySoldier | null>;
  equipShadow: (soldierId: string, uid: string) => Promise<void>;
  unequipShadow: (uid: string) => Promise<void>;
  getActiveBuffMultiplier: (type: 'xp' | 'strength' | 'agility' | 'vitality') => number;
}

const STORAGE_KEYS = {
  SOLDIERS: (uid: string) => `@fitrise_shadow_army_${uid}`,
  EQUIPPED: (uid: string) => `@fitrise_equipped_shadow_${uid}`,
};

const SHADOW_RANKS: Record<string, { grade: ShadowArmySoldier['grade']; buffType: ShadowArmySoldier['buffType']; buffValue: number; desc: string; shadowTitle: string }> = {
  boss_kasaka: {
    grade: 'Normal',
    buffType: 'agility_buff',
    buffValue: 5,
    desc: '+5% Agilidad y reflejos en directivas de evasión',
    shadowTitle: 'Colmillo de Sombra Rastrero',
  },
  boss_cerberus: {
    grade: 'Normal',
    buffType: 'strength_buff',
    buffValue: 5,
    desc: '+5% Potencia y tensión muscular excéntrica',
    shadowTitle: 'Guardián del Averno Sombrío',
  },
  boss_centipede: {
    grade: 'Normal',
    buffType: 'vitality_buff',
    buffValue: 5,
    desc: '+5% Vitalidad y tolerancia al ácido láctico',
    shadowTitle: 'Ciempiés de las Profundidades Oscuras',
  },
  boss_igris: {
    grade: 'Comandante',
    buffType: 'strength_buff',
    buffValue: 12,
    desc: '+12% Fuerza en ejercicios de tren superior y torso',
    shadowTitle: 'Caballero Rojo de la Muerte Sombría',
  },
  boss_baruka: {
    grade: 'Élite',
    buffType: 'agility_buff',
    buffValue: 10,
    desc: '+10% Cadencia y explosividad en tren inferior',
    shadowTitle: 'Señor de la Ventisca Sombría',
  },
  boss_metus: {
    grade: 'Élite',
    buffType: 'xp_boost',
    buffValue: 8,
    desc: '+8% XP en todas las rutinas concluidas',
    shadowTitle: 'Nigromante de Sombras Etéreas',
  },
  boss_iron: {
    grade: 'Comandante',
    buffType: 'vitality_buff',
    buffValue: 12,
    desc: '+12% Resistencia muscular en circuitos prolongados',
    shadowTitle: 'Coloso de Armadura Sombría',
  },
  boss_kargalgan: {
    grade: 'Comandante',
    buffType: 'xp_boost',
    buffValue: 12,
    desc: '+12% XP y sabiduría táctica CORTEX',
    shadowTitle: 'Alto Chamán de las Sombras',
  },
  boss_tusk: {
    grade: 'Comandante',
    buffType: 'strength_buff',
    buffValue: 14,
    desc: '+14% Fuerza de empuje con orbe de devastación',
    shadowTitle: 'Mago Titánico de Sombras',
  },
  boss_vulcan: {
    grade: 'Comandante',
    buffType: 'vitality_buff',
    buffValue: 14,
    desc: '+14% Recuperación celular entre descansos',
    shadowTitle: 'Monstruo Llameante de Sombra',
  },
  boss_baran: {
    grade: 'General',
    buffType: 'strength_buff',
    buffValue: 18,
    desc: '+18% Fuerza e impacto neuromuscular eléctrico',
    shadowTitle: 'Rey de los Demonios Sombríos',
  },
  boss_queen_ant: {
    grade: 'Comandante',
    buffType: 'recovery_boost',
    buffValue: 15,
    desc: '+15% Enfriamiento rápido en protocolos de descompresión',
    shadowTitle: 'Reina de la Colmena Oscura',
  },
  boss_beru: {
    grade: 'General',
    buffType: 'agility_buff',
    buffValue: 20,
    desc: '+20% Agilidad suprema y regeneración instantánea',
    shadowTitle: 'Rey Hormiga Quimérica de Sombra',
  },
  boss_goto_ryuji: {
    grade: 'Comandante',
    buffType: 'agility_buff',
    buffValue: 15,
    desc: '+15% Velocidad de ejecución en cada repetición',
    shadowTitle: 'Filo Imperial de Sombra',
  },
  boss_kamish: {
    grade: 'General',
    buffType: 'strength_buff',
    buffValue: 22,
    desc: '+22% Densidad miofibrilar y furia de dragón',
    shadowTitle: 'Dragón del Apocalipsis Sombrío',
  },
  boss_sillad: {
    grade: 'General',
    buffType: 'vitality_buff',
    buffValue: 20,
    desc: '+20% Vitalidad gélida contra la fatiga',
    shadowTitle: 'Monarca de la Escarcha Sombría',
  },
  boss_rakan: {
    grade: 'General',
    buffType: 'strength_buff',
    buffValue: 22,
    desc: '+22% Fuerza salvaje en entrenamientos de potencia',
    shadowTitle: 'Monarca de las Bestias de Sombra',
  },
  boss_yogumunt: {
    grade: 'General',
    buffType: 'xp_boost',
    buffValue: 20,
    desc: '+20% Ganancia global de XP en todos los campos',
    shadowTitle: 'Monarca de la Transfiguración Sombría',
  },
  boss_tarnak: {
    grade: 'General',
    buffType: 'strength_buff',
    buffValue: 24,
    desc: '+24% Potencia pura en calistenia avanzada',
    shadowTitle: 'Monarca del Cuerpo de Hierro',
  },
  boss_bellion: {
    grade: 'Gran Mariscal',
    buffType: 'strength_buff',
    buffValue: 28,
    desc: '+28% Poder absoluto en combate de mazmorra',
    shadowTitle: 'Gran Mariscal de las Sombras Ancestrales',
  },
  boss_antares: {
    grade: 'Gran Mariscal',
    buffType: 'strength_buff',
    buffValue: 30,
    desc: '+30% Daño de aniquilación y sobrecarga muscular',
    shadowTitle: 'Emperador Dragón de la Destrucción Sombría',
  },
  boss_shadow_monarch: {
    grade: 'Gran Mariscal',
    buffType: 'xp_boost',
    buffValue: 35,
    desc: '+35% XP en toda la aplicación • Cazador Trascendente',
    shadowTitle: 'Trascendencia Absoluta de la Muerte',
  },
};

export const useShadowArmyStore = create<ShadowArmyStore>((set, get) => ({
  soldiers: [],
  equippedShadowId: null,
  isLoaded: false,

  initialize: async (uid: string) => {
    try {
      const [rawSoldiers, rawEquipped] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SOLDIERS(uid)),
        AsyncStorage.getItem(STORAGE_KEYS.EQUIPPED(uid)),
      ]);

      const soldiers: ShadowArmySoldier[] = rawSoldiers ? JSON.parse(rawSoldiers) : [];
      const equippedShadowId = rawEquipped || null;

      set({
        soldiers,
        equippedShadowId,
        isLoaded: true,
      });
    } catch (e) {
      console.warn('Error inicializando Ejército de Sombras:', e);
      set({ isLoaded: true });
    }
  },

  extractShadow: async (bossId: string, uid: string) => {
    const boss = WEEKLY_BOSSES.find((b) => b.id === bossId);
    if (!boss) return null;

    const { soldiers } = get();
    if (soldiers.some((s) => s.bossId === bossId)) {
      return null; // Ya extraído
    }

    const rankInfo = SHADOW_RANKS[bossId] || {
      grade: 'Normal' as const,
      buffType: 'strength_buff' as const,
      buffValue: 8,
      desc: '+8% Fuerza táctica',
      shadowTitle: `Sombra de ${boss.name}`,
    };

    const newSoldier: ShadowArmySoldier = {
      bossId: boss.id,
      name: boss.name,
      shadowTitle: rankInfo.shadowTitle,
      rankBadge: boss.rankBadge || 'RANGO C',
      emoji: boss.emoji,
      imageUrl: boss.imageUrl,
      color: boss.color,
      extractedAt: new Date().toISOString(),
      buffType: rankInfo.buffType,
      buffDescription: rankInfo.desc,
      buffValue: rankInfo.buffValue,
      grade: rankInfo.grade,
    };

    const updatedSoldiers = [newSoldier, ...soldiers];
    const newEquipped = get().equippedShadowId || newSoldier.bossId;

    set({
      soldiers: updatedSoldiers,
      equippedShadowId: newEquipped,
    });

    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.SOLDIERS(uid), JSON.stringify(updatedSoldiers)),
        AsyncStorage.setItem(STORAGE_KEYS.EQUIPPED(uid), newEquipped),
      ]);
    } catch (e) {
      console.warn('Error persistiendo extracción de sombra:', e);
    }

    Haptics.triumph();
    SoundEffects.playLevelUp();

    return newSoldier;
  },

  equipShadow: async (soldierId: string, uid: string) => {
    set({ equippedShadowId: soldierId });
    Haptics.medium();
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EQUIPPED(uid), soldierId);
    } catch {}
  },

  unequipShadow: async (uid: string) => {
    set({ equippedShadowId: null });
    Haptics.light();
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.EQUIPPED(uid));
    } catch {}
  },

  getActiveBuffMultiplier: (type: 'xp' | 'strength' | 'agility' | 'vitality') => {
    const { soldiers, equippedShadowId } = get();
    if (!equippedShadowId) return 1.0;

    const equipped = soldiers.find((s) => s.bossId === equippedShadowId);
    if (!equipped) return 1.0;

    if (type === 'xp' && equipped.buffType === 'xp_boost') {
      return 1.0 + equipped.buffValue / 100;
    }
    if (type === 'strength' && equipped.buffType === 'strength_buff') {
      return 1.0 + equipped.buffValue / 100;
    }
    if (type === 'agility' && equipped.buffType === 'agility_buff') {
      return 1.0 + equipped.buffValue / 100;
    }
    if (type === 'vitality' && equipped.buffType === 'vitality_buff') {
      return 1.0 + equipped.buffValue / 100;
    }

    return 1.0;
  },
}));
