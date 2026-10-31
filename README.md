# ⚡ Level Up

> App de fitness y bienestar gamificada con IA táctica integrada (CORTEX)

## 🚀 Quick Start

### 1. Prerrequisitos

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (para emulador) o dispositivo físico con Expo Go

### 2. Configurar claves API

Edita el archivo `.env` en la raíz del proyecto:

```env
# Google Gemini API Key → https://aistudio.google.com/apikey
EXPO_PUBLIC_GEMINI_API_KEY=tu_clave_aqui

# Firebase → https://console.firebase.google.com
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

### 3. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un nuevo proyecto llamado "level-up"
3. Activa **Authentication** → Email/Password
4. Crea una base de datos **Firestore** (modo producción)
5. Copia las claves del proyecto a tu `.env`

### 4. Instalar y correr

```bash
npm install
npx expo start --android
```

---

## 🏗️ Estructura del proyecto

```
level-up/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Login, onboarding
│   ├── (tabs)/             # Tabs principales
│   └── _layout.tsx
├── components/
│   ├── ai/                 # DailyTipCard
│   ├── gamification/       # QuestCard
│   └── ui/                 # XPBar, RankBadge, StatBar, Card
├── constants/
│   ├── theme.ts            # Colores, tipografía, espaciado
│   ├── ranks.ts            # Sistema de rangos E→SSS
│   └── exercises.ts        # Biblioteca de ejercicios
├── services/
│   ├── firebase.ts         # Firebase config
│   └── gemini.ts           # CORTEX — IA Táctica (Gemini)
├── stores/
│   ├── userStore.ts        # Estado del usuario (Zustand)
│   └── workoutStore.ts     # Estado de workouts
└── .env                    # Variables de entorno (no commitear)
```

---

## 🎮 Sistema de Rangos

| Rango | Nivel | XP |
|-------|-------|-----|
| 🪨 E-Rank — Novato | 1-10 | 0 - 5,000 |
| 🥉 D-Rank — Aprendiz | 11-20 | 5,001 - 15,000 |
| 🥈 C-Rank — Guerrero | 21-35 | 15,001 - 35,000 |
| 🥇 B-Rank — Élite | 36-50 | 35,001 - 65,000 |
| 💎 A-Rank — Maestro | 51-70 | 65,001 - 110,000 |
| 🔥 S-Rank — Legendario | 71-90 | 110,001 - 175,000 |
| ⚡ SS-Rank — Mítico | 91-99 | 175,001 - 260,000 |
| 👑 SSS-Rank — Trascendente | 100 | 260,001+ |

---

## 🧠 CORTEX — Inteligencia Táctica IA

CORTEX es la IA táctica integrada (estilo Cortana), potenciada por **Google Gemini**. Tiene acceso completo al perfil del usuario para personalizar:

- Protocolos diarios de rendimiento (Tips accionables)
- Rutinas de combate y entrenamiento generadas por IA
- Misiones diarias personalizadas
- Enlace cuántico 24/7 con contexto del usuario
- Análisis biométrico de progreso

---

## 📱 Pantallas

- **Inicio** — Dashboard con XP, rango, protocolo diario y misiones
- **Entrenar** — Generador de rutinas con IA
- **CORTEX** — Enlace táctico y chat con IA
- **Progreso** — Atributos del personaje, estadísticas y hoja de ruta de rangos
- **Cazador** — Biometría, equipamiento y configuración del sistema

---

## 🛠️ Tech Stack

- **React Native** (Expo SDK 58)
- **Expo Router** — File-based navigation
- **Firebase** — Auth + Firestore + Storage
- **Google Gemini API** — IA CORTEX
- **Zustand** — Estado global
- **TypeScript** — Todo tipado
