// Gemini API Service — Level Up AI Tutor (CORTEX)
import { useCortexEnergyStore } from '../stores/cortexEnergyStore';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';

export interface SmartwatchContext {
  brand: string;
  deviceName: string;
  steps: number;
  stepGoal: number;
  heartRate: number;
  restingHeartRate: number;
  activeCalories: number;
  sleepHours: number;
  readinessScore: number;
  stressLevel: string;
}

export interface UserContext {
  name: string;
  level: number;
  rank: string;
  totalXP: number;
  stats: {
    strength: number;
    agility: number;
    vitality: number;
    discipline: number;
    mind: number;
  };
  streak: number;
  goals: string[];
  fitnessLevel: string;
  equipment: string[];
  age?: number;
  weight?: number;
  height?: number;
  kneeFriendly?: boolean;
  bmi?: number;
  gender?: 'male' | 'female' | 'other';
  smartwatch?: SmartwatchContext;
  waterIntakeMl?: number;
  waterTargetMl?: number;
  activeTitle?: string;
  penaltyActive?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const TUTOR_SYSTEM_PROMPT = `Eres CORTEX, la Inteligencia Artificial Táctica y Tutora de Alto Rendimiento de Level Up. Combinas las capacidades de un Entrenador de Élite de Fuerza y Acondicionamiento, un Nutriólogo Clínico Deportivo y un Médico Especialista en Biomecánica y Preservación Articular.

Tu inspiración y personalidad:
- Inspirada en sistemas de IA táctica como Cortana (Halo) o J.A.R.V.I.S., especializada en optimización física, biomecánica clínica, nutrición funcional y fortaleza mental.
- Hablas con precisión analítica, sofisticación, empatía firme y confianza inquebrantable.
- Tratas al usuario como a un "Cazador" en evolución constante. Eres su compañera estratégica en su ascenso de rangos (E a SSS).
- Tu tono es elegante, motivador y directo (sin rodeos innecesarios, respuestas con autoridad técnica y aplicabilidad práctica).
- Usas conceptos de rendimiento físico, bioenergía, recuperación neural y progreso de atributos.

Directrices Médicas y Ortopédicas (Protección Articular):
- Si el Cazador tiene peso considerable (>= 90 kg), IMC >= 27.5 o kneeFriendly activo, NUNCA prescribas ejercicios de alto impacto en rodillas (jump squats, saltos al cajón, burpees balísticos, o zancadas dinámicas con rodilla sobrepasando bruscamente el pie).
- Prescribe siempre regresiones de bajo impacto patelofemoral: Sentadillas con soporte, Box Squats (sentadillas al banco manteniendo la tibia vertical), puentes de glúteos en suelo y flexiones inclinadas.
- Enseña cadencia excéntrica controlada (3 segundos de bajada, 1 segundo de pausa isométrica y 2 segundos de subida) con respiración rítmica (inhalar al descender, exhalar al empujar).

Directrices Nutricionales Clínicas:
- En personas con sobrepeso, calcula los requerimientos de proteína sobre el peso magro ajustado (evitando sobrecargas renales o prescripciones absurdas basadas en peso total obeso).
- Prescribe grasas saludables esenciales (mínimo 0.9g por kg de peso magro) para mantener la integridad de las membranas celulares y la lubricación sinovial de cartílagos.
- Recomienda hidratación metabólica a razón de 35 ml por kg de peso corporal al día.

Tus funciones estratégicas:
1. Diseñar e individualizar rutinas tácticas adaptadas al equipo, tiempo, peso y nivel biomecánico.
2. Formular directivas nutricionales precisas para recomposición corporal, hipertrofia o déficit magro.
3. Evaluar métricas de progreso (Fuerza, Agilidad, Vitalidad, Disciplina, Mente) y sugerir correcciones.
4. Mantener la moral alta y la racha ininterrumpida.
5. Proveer el "Protocolo Táctico del Día" (Tip diario accionable).

Reglas fundamentales:
- Personaliza siempre considerando el contexto biométrico, estado articular y nivel del Cazador.
- Si detectas dolor agudo o riesgo lesivo, ordena detener el ejercicio y consultar a un médico especialista.
- Respuestas en español, estructuradas con markdown táctico, contundentes y motivadoras.`;

export async function sendMessageToTutor(
  userMessage: string,
  userContext: UserContext,
  chatHistory: ChatMessage[] = [],
  options?: { skipManaCheck?: boolean }
): Promise<string> {
  const energyStore = useCortexEnergyStore.getState();
  if (!energyStore.isLoaded) {
    await energyStore.initialize();
  }

  let manaConsumed = false;
  if (!options?.skipManaCheck) {
    const manaResult = await energyStore.consumeMana();
    if (!manaResult.success) {
      throw new Error('MANA_DEPLETED');
    }
    manaConsumed = true;
  }

  const activeApiKey = energyStore.getActiveApiKey();

  const contextBlock = `
PERFIL DEL USUARIO:
- Nombre: ${userContext.name}
- Nivel: ${userContext.level} | Rango: ${userContext.rank}
- XP Total: ${userContext.totalXP}
- Racha actual: ${userContext.streak} días
- Nivel fitness: ${userContext.fitnessLevel}
- Objetivos: ${userContext.goals.join(', ')}
- Equipamiento disponible: ${userContext.equipment.join(', ')}
- Stats: Fuerza ${userContext.stats.strength} | Agilidad ${userContext.stats.agility} | Vitalidad ${userContext.stats.vitality} | Disciplina ${userContext.stats.discipline} | Mente ${userContext.stats.mind}
${userContext.age ? `- Edad: ${userContext.age} años` : ''}
${userContext.gender ? `- Género: ${userContext.gender === 'male' ? 'Hombre' : userContext.gender === 'female' ? 'Mujer' : 'Otro'}` : ''}
${userContext.weight ? `- Peso: ${userContext.weight} kg` : ''}
${userContext.height ? `- Altura: ${userContext.height} cm` : ''}
${userContext.bmi ? `- Índice de Masa Corporal (IMC): ${userContext.bmi.toFixed(1)} kg/m²` : ''}
${userContext.kneeFriendly ? `- PROTOCOLO ARTICULAR ACTIVO: Protección total de rodillas (cero impacto, sin saltos)` : ''}
${userContext.activeTitle ? `- Título Semanal Otorgado: ${userContext.activeTitle}` : ''}
${userContext.penaltyActive ? `- ALERTA: Zona de Castigo activa (requiere superar misiones para redimir racha)` : ''}
${userContext.waterIntakeMl !== undefined ? `- Hidratación registrada: ${userContext.waterIntakeMl} ml / ${userContext.waterTargetMl || 2500} ml` : ''}
${userContext.smartwatch ? `
TELEMETRÍA SMARTWATCH EN VIVO:
- Dispositivo: ${userContext.smartwatch.brand.toUpperCase()} (${userContext.smartwatch.deviceName})
- Pasos de hoy: ${userContext.smartwatch.steps.toLocaleString()} / ${userContext.smartwatch.stepGoal.toLocaleString()} meta
- Frecuencia cardíaca actual: ${userContext.smartwatch.heartRate} BPM (Basal: ${userContext.smartwatch.restingHeartRate} BPM)
- Calorías activas quemadas: ${userContext.smartwatch.activeCalories} kcal
- Sueño y Descanso: ${userContext.smartwatch.sleepHours} hrs (Índice de Vitalidad / Preparación: ${userContext.smartwatch.readinessScore}%)
- Estrés Fisiológico: ${userContext.smartwatch.stressLevel}
` : '- Smartwatch: No vinculado aún'}
`;

  const contents = [
    ...chatHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: userMessage }],
    },
  ];

  const body = {
    system_instruction: {
      parts: [{ text: TUTOR_SYSTEM_PROMPT + '\n\n' + contextBlock }],
    },
    contents,
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${activeApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if ((response.status === 400 || response.status === 403) && energyStore.isUnlimited) {
        throw new Error('INVALID_PERSONAL_KEY');
      }
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta. Inténtalo de nuevo.';
  } catch (error) {
    if (manaConsumed) {
      await energyStore.refundMana();
    }
    console.error('Gemini error:', error);
    throw error;
  }
}

export async function generateDailyTip(userContext: UserContext): Promise<string> {
  const prompt = `Genera un TIP DIARIO de fitness y bienestar para este usuario. 
El tip debe ser:
- Específico y accionable (que pueda hacer HOY)
- Breve (máximo 3-4 oraciones)
- Relacionado con su nivel y objetivos
- Puede ser sobre ejercicio, nutrición, recuperación, mentalidad o hábitos
- Menciona su nombre al inicio para personalizar

Responde SOLO con el tip, sin introducción ni formato extra.`;

  try {
    return await sendMessageToTutor(prompt, userContext, [], { skipManaCheck: true });
  } catch (error) {
    console.warn('Fallback para daily tip activado:', error);
    return `¡Saludos ${userContext.name}! Recuerda que cada repetición y cada vaso de agua suma a tu progreso de Cazador. La consistencia vence al talento cuando el talento no entrena con disciplina. ¡A por ese rango superior hoy! ⚡`;
  }
}

export async function generateWorkoutPlan(
  userContext: UserContext,
  duration: number = 30,
  focus?: string
): Promise<string> {
  const isBodyweightOnly =
    userContext.equipment.includes('none') ||
    (!userContext.equipment.includes('dumbbells') &&
      !userContext.equipment.includes('gym') &&
      !userContext.equipment.includes('barbell'));

  const equipmentInstruction = isBodyweightOnly
    ? `\nRESTRICCIÓN CRÍTICA DE EQUIPAMIENTO:
- El usuario ha seleccionado ÚNICAMENTE 'PESO CORPORAL' (Sin equipo / Casa).
- Queda TERMINANTEMENTE PROHIBIDO incluir ejercicios con mancuernas (dumbbells), barras de dominadas, bancos o máquinas de gimnasio.
- CADA uno de los ejercicios DEBE ser 100% de peso corporal en el suelo (ejemplos permitidos: flexiones militares, sentadillas profundas, zancadas, planchas abdominales, escaladores tácticos, flexiones diamante, burpees, flexiones en pica).`
    : `\nEquipamiento disponible: ${userContext.equipment.join(', ')}`;

  const prompt = `Genera una RUTINA DE EJERCICIO personalizada con estas especificaciones:
- Duración: ${duration} minutos
- Enfoque: ${focus || 'equilibrado (fuerza + cardio)'}
- Nivel fitness: ${userContext.fitnessLevel}
${equipmentInstruction}

Formato de respuesta (en JSON):
{
  "title": "nombre de la rutina",
  "warmup": [{"exercise": "nombre", "duration": "tiempo o reps", "rest": "descanso"}],
  "main": [{"exercise": "nombre", "sets": número, "reps": "número o tiempo", "rest": "segundos", "xp": número}],
  "cooldown": [{"exercise": "nombre", "duration": "tiempo"}],
  "totalXP": número,
  "tips": ["tip1", "tip2"]
}`;

  const response = await sendMessageToTutor(prompt, userContext, []);
  return response;
}

export async function generateDailyQuests(userContext: UserContext): Promise<string> {
  const isBodyweightOnly =
    userContext.equipment.includes('none') ||
    (!userContext.equipment.includes('dumbbells') &&
      !userContext.equipment.includes('gym') &&
      !userContext.equipment.includes('barbell'));

  const thirdQuestSpec = isBodyweightOnly
    ? '3. Misión de Flexiones en Pica / Pike Push-Ups (o Escaladores Tácticos) con peso corporal estricto.'
    : '3. Misión de Curl Táctico de Bíceps (con mancuernas).';

  const equipmentRule = isBodyweightOnly
    ? 'REGLA ESTRICTA: El usuario NO tiene equipo (solo peso corporal). Cero mancuernas, cero barras, cero máquinas.'
    : `Equipamiento del usuario: ${userContext.equipment.join(', ')}.`;

  const prompt = `Genera exactamente 5 MISIONES DIARIAS de entrenamiento táctico para este Cazador con formato RPG/Solo Leveling.
${equipmentRule}

Deben ser ejercicios físicos concretos y ejecutables:
1. Misión de Flexiones Militares / Push-Ups.
2. Misión de Sentadillas Profundas / Deep Squats.
${thirdQuestSpec}
4. Misión de Flexiones Diamante / Diamond Push-ups.
5. Misión de Zancadas Tácticas / Walking Lunges.

Formato JSON estricto:
[
  {
    "id": "quest_1",
    "title": "Misión 1: Flexiones Militares Tácticas",
    "description": "descripción clara y motivadora de la orden de CORTEX",
    "category": "exercise",
    "xpReward": 120,
    "statBoost": {"stat": "strength", "value": 1},
    "icon": "⚔️",
    "exerciseName": "Flexiones Militares / Push-Ups",
    "targetMuscles": ["Pectorales", "Tríceps", "Deltoides", "Core"],
    "sets": 3,
    "reps": "10 - 12 reps lentas",
    "instructions": [
      "Manos al ancho de hombros con el cuerpo en línea recta.",
      "Baja despacio en 4 segundos hasta 2 cm del suelo.",
      "Sostén 2 segundos de pausa en el fondo.",
      "Empuja constante en 2 segundos hasta la posición inicial."
    ],
    "cortexAdvice": "El control excéntrico es la clave del poder físico."
  }
]

Responde ÚNICAMENTE con el array JSON de 5 elementos válido, sin texto adicional.`;

  const response = await sendMessageToTutor(prompt, userContext, [], { skipManaCheck: true });
  return response;
}
