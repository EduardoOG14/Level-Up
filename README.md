# ⚡ Level Up — Solo Leveling Fitness & Hunter System

<p align="center">
  <img src="./assets/icon.png" width="120" height="120" alt="Level Up Logo" style="border-radius: 24px;" />
</p>

<p align="center">
  <strong>Transforma tu entrenamiento en la vida real en el Sistema de Cazador inspirado en <em>Solo Leveling</em>.</strong><br>
  Forja tus atributos, supera misiones diarias, asalta calabozos y sube de rango hasta convertirte en Monarca.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-SDK_58-000000?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Native-0.88-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Storage-100%25_Offline_Local-10B981?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Ejercicios-1%2C324_Dataset_CDN-00F0FF?style=for-the-badge" />
  <img src="https://img.shields.io/badge/CI%2FCD-GitHub_Actions_APK-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" />
</p>

---

## 🌟 Visión del Proyecto

**Level Up** es una aplicación móvil de fitness, calistenia y entrenamiento táctico gamificada bajo la estética visual y conceptual de los **Sistemas de Cazador del anime y webtoon *Solo Leveling***. 

Diseñada con una arquitectura **100% Offline-First**, todos tus datos, progreso, historial biométrico y atributos se almacenan de manera local y privada en tu dispositivo, sin requerir cuentas de Google ni bases de datos en la nube.

---

## ⚔️ Características Principales

### 1. 👑 Ventana de Estado del Cazador (Status Window)
* **Aura de Cazador Dinámica:** Halo animado alrededor de tu avatar que pulsa e intensifica su color según tu Rango oficial (E-Gris, D-Verde, C-Azul, B-Púrpura, A-Dorado, S/SS/SSS-Carmesí Monarca).
* **Barras de Vitales en Tiempo Real:**
  * **HP (Salud & Vitalidad):** Calculada según tu atributo físico y nivel.
  * **MP (Maná Neural CORTEX):** Muestra la energía disponible para interacciones con la IA táctica.
  * **EXP:** Barra de progreso con porcentaje hacia tu próximo nivel.
* **Poder de Combate Numérico:** Algoritmo dinámico que calcula tu poder global combinando tus 5 atributos y nivel.
* **Los 5 Atributos Principales:**
  * `[ STR ] FUERZA:` Ejercicios de empuje, tracción y potencia.
  * `[ AGI ] AGILIDAD:` Cardio, tren inferior, velocidad y reflejos.
  * `[ VIT ] VITALIDAD:` Nutrición, hidratación y recuperación biológica.
  * `[ INT ] DISCIPLINA:` Rachas consecutivas y fuerza de voluntad.
  * `[ PER ] PERCEPCIÓN:` Enfoque mental y descanso reparador.

### 2. 📜 Directivas de Misión Diaria
* Formato visual cyberpunk idéntico a las ventanas del Sistema de Solo Leveling.
* **5 Misiones Diarias:** Calibradas según tu equipamiento (100% peso corporal, mancuernas, barras o gimnasio).
* **Bono de Gran Maestro (+300 XP):** Recompensa adicional al completar el 100% de las misiones del día.
* **Zona de Castigo (Penalty Zone):** Si omites misiones consecutivas, se activa un protocolo de emergencia con multiplicador de experiencia para salvar tu racha.

### 3. 🏋️‍♂️ Arsenal de 1,324 Ejercicios en GIF
* Integración con catálogo internacional de **1,324 ejercicios**.
* Cada ejercicio cuenta con demostración en video/GIF animado cargado vía CDN con **caché inteligente local**.
* Músculos objetivo principales y secundarios detallados paso a paso.

### 4. 🎙️ Entrenador de Cadencia por Voz (CORTEX Voice)
* Conteo rítmico táctico para garantizar el control de la fase excéntrica y la tensión muscular óptima:
  * ⏱️ **4 Segundos de Bajada Excéntrica**
  * ⏸️ **2 Segundos de Pausa Isométrica**
  * ⚡ **2 Segundos de Empuje / Subida Concéntrica**
* Instrucciones por voz en español que te guían repetición por repetición sin tener que mirar la pantalla.

### 5. 🏰 Calabozos, Puertas Rojas y Asalto Semanal
* **Programas de Entrenamiento:** Rutinas divididas en días tácticos (Torso, Pierna, Fullbody, etc.).
* **Modo Asalto Semanal (Boss Raid):** Enfréntate al Monarca de las Sombras en una mazmorra de alta intensidad con barra de vida animada.
* **Generador de Mazmorras con IA:** Crea al instante un circuito táctico personalizado seleccionando tu grupo muscular objetivo.

### 6. ⌚ Bio-Nexo Smartwatch
* Sincronización biométrica con relojes inteligentes:
  * **Samsung Galaxy Watch** (Samsung Health)
  * **Apple Watch** (Apple Health)
  * **Cubitt** (Cubitt Protocol)
  * **Xiaomi / Amazfit** (Mi Fitness / Zepp Life)
* Monitoreo de pasos, pulso cardíaco en tiempo real (BPM), calorías activas y calidad de sueño.

### 7. ⚖️ Telemetría Nutricional & Macros
* Calculadora de Tasa Metabólica Basal (TMB) y Gasto Energético Diario (TDEE) mediante la ecuación Mifflin-St Jeor.
* Distribución estratégica de macronutrientes (Proteínas, Carbohidratos y Grasas) según tu objetivo:
  * 🔻 *Pérdida de Grasa (Déficit Táctico)*
  * ⚖️ *Recomposición Corporal*
  * 🔺 *Ganancia de Masa Muscular (Superávit)*
* Monitoreo de peso semanal con alertas de calibración para ajuste de cargas.

### 8. 🔄 Sistema de Actualizaciones Automáticas (OTA GitHub Releases)
* **Validación al Iniciar:** Cada vez que abres la app, comprueba de forma silenciosa la API de GitHub Releases.
* **Ventana Holográfica de Actualización:** Si hay una versión más reciente disponible, muestra las notas del parche y el botón `[ ⚡ DESCARGAR E INSTALAR APK ]`.
* **Botón Manual en Menú de Cazador:** Permite buscar actualizaciones en cualquier momento desde la sección de ajustes.

---

## 🎮 Escala de Rangos Oficial

| Rango | Rango Nombre | Nivel | Requisito XP |
| :---: | :--- | :---: | :---: |
| 🪨 | **Rango E** — Novato | 1 - 10 | 0 - 5,000 XP |
| 🥉 | **Rango D** — Aprendiz | 11 - 20 | 5,001 - 15,000 XP |
| 🥈 | **Rango C** — Guerrero | 21 - 35 | 15,001 - 35,000 XP |
| 🥇 | **Rango B** — Élite | 36 - 50 | 35,001 - 65,000 XP |
| 💎 | **Rango A** — Maestro | 51 - 70 | 65,001 - 110,000 XP |
| 🔥 | **Rango S** — Leyenda | 71 - 90 | 110,001 - 175,000 XP |
| ⚡ | **Rango SS** — Mítico | 91 - 99 | 175,001 - 260,000 XP |
| 👑 | **Rango SSS** — Monarca de las Sombras | 100+ | 260,001+ XP |

---

## 🧠 Núcleo CORTEX (IA Táctica con Google Gemini)

**CORTEX** es la IA táctica integrada en el Sistema:
* **Consultas Tácticas Diarias:** Incluye **5 puntos de Maná Diario gratuitos** que se recargan automáticamente cada medianoche.
* **Modo Ilimitado (BYOK):** Puedes vincular tu propia clave gratuita de Google Gemini (Google AI Studio) para tener consultas y planes ilimitados 24/7 sin restricciones.

---

## 📲 Descargar e Instalar la App (APK para Android)

Puedes descargar la última versión compilada lista para instalar en tu teléfono Android desde la sección de lanzamientos:

👉 **[Descargar Último APK en GitHub Releases](https://github.com/EduardoOG14/Level-Up/releases)**

> *Al descargar el archivo `.apk`, ábrelo en tu dispositivo móvil y confirma la instalación. Tus datos y progresos se conservarán siempre.*

---

## ⚙️ Compilación Automática en la Nube (CI/CD)

Este repositorio cuenta con un flujo de trabajo automatizado con **GitHub Actions** (`.github/workflows/build-apk.yml`):
* Compila el APK nativo de Android en **~3 a 4 minutos** de forma gratuita en la nube.
* Se activa automáticamente al crear una etiqueta de versión (ej: `git tag v1.0.6 && git push origin v1.0.6`) o de forma manual con el botón **"Run workflow"** en la pestaña **Actions** de GitHub.
* Adjunta automáticamente el APK resultante en un nuevo **GitHub Release**.

---

## 🛠️ Stack Tecnológico

* **Framework:** [React Native](https://reactnative.dev/) (Expo SDK 58)
* **Navegación:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based Routing)
* **Gestión de Estado:** [Zustand](https://github.com/pmndrs/zustand)
* **Base de Datos:** `@react-native-async-storage/async-storage` (100% Local / Offline)
* **Inteligencia Artificial:** Google Gemini API (`@google/genai` / REST)
* **Audio y Voz:** `expo-speech` + reproductor acústico táctico
* **Multimedia & Caché:** `expo-image` + `expo-video`
* **Estilos:** Custom Anime / Solo Leveling Dark Neon Cyber HUD
* **Automatización:** GitHub Actions CI/CD para compilación de APKs Android

---

## 🚀 Flujo de Compilación y Distribución Continua

Olvídate de emuladores limitados o de aplicaciones intermediarias como Expo Go. **Level Up está configurada como una aplicación Android nativa real y autónoma**:

### 1. Generar una nueva versión con GitHub Actions
Cada vez que realices cambios y quieras compilar una nueva versión de la app:
```bash
# 1. Guarda tus cambios
git add .
git commit -m "feat: mejoras del sistema"

# 2. Asigna la nueva versión (ej: v1.0.6) y súbela
git tag v1.0.6
git push origin v1.0.6
```
*(También puedes presionar el botón **"Run workflow"** directamente en la pestaña **Actions** de GitHub).*

### 2. Compilación y Publicación Automática
* Los servidores en la nube de GitHub Actions compilarán el APK nativo en **~3 minutos**.
* El APK (`level-up-vX.X.X.apk`) se publicará de inmediato en la sección de **Releases** de tu repositorio.

### 3. Actualización Directa en tu Teléfono
* **Al abrir la app:** Level Up validará automáticamente en GitHub si existe una versión superior y te mostrará la ventana holográfica para descargar e instalar el APK con un solo toque.
* **Desde el menú Cazador:** Puedes comprobar si hay nuevas versiones en cualquier momento tocando `[ BUSCAR ]` en `Actualizaciones del Sistema`.
* **Cero pérdida de datos:** El instalador de Android actualiza la app sobre la versión anterior conservando todos tus atributos, nivel, racha y progresos.

---

## 💻 Ejecución Nativa en Dispositivo (Opcional)

Si conectas tu teléfono por cable USB o usas un emulador de Android Studio:

```bash
# Compila y ejecuta el binario nativo directamente en tu dispositivo
npx expo run:android
```

---

<p align="center">
  <strong>⚔️ "Solo aquellos que perseveran en la disciplina diaria despiertan como Monarcas." ⚡</strong>
</p>
