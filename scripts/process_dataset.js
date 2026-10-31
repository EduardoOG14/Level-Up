const fs = require('fs');
const path = require('path');

async function run() {
  console.log('Descargando exercises.json desde GitHub...');
  const res = await fetch('https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json');
  if (!res.ok) {
    throw new Error(`Error HTTP: ${res.status} ${res.statusText}`);
  }
  const rawData = await res.json();
  console.log(`Total de ejercicios descargados: ${rawData.length}`);

  const processed = rawData.map((item) => {
    // Extraer pasos en español o fallback a inglés
    const stepsEs = item.instruction_steps?.es || (item.instructions?.es ? [item.instructions.es] : []);
    const stepsEn = item.instruction_steps?.en || (item.instructions?.en ? [item.instructions.en] : []);
    const steps = stepsEs.length > 0 ? stepsEs : stepsEn;

    // Categorización de equipamiento para FitRise:
    // 'body weight' -> 'none', 'dumbbell' -> 'dumbbells', 'barbell' -> 'barbell', etc.
    const eqRaw = (item.equipment || '').toLowerCase();
    let fitriseEquipment = 'other';
    if (eqRaw.includes('body weight') || eqRaw.includes('assisted') || eqRaw === 'none') {
      fitriseEquipment = 'none';
    } else if (eqRaw.includes('dumbbell')) {
      fitriseEquipment = 'dumbbells';
    } else if (eqRaw.includes('barbell') || eqRaw.includes('olympic barbell') || eqRaw.includes('trap bar') || eqRaw.includes('ez barbell')) {
      fitriseEquipment = 'barbell';
    } else if (eqRaw.includes('band') || eqRaw.includes('resistance band')) {
      fitriseEquipment = 'resistance_band';
    } else if (eqRaw.includes('cable') || eqRaw.includes('machine') || eqRaw.includes('leverage machine') || eqRaw.includes('smith machine')) {
      fitriseEquipment = 'gym';
    } else if (eqRaw.includes('pull-up bar') || eqRaw.includes('pull up bar')) {
      fitriseEquipment = 'pullup_bar';
    } else {
      fitriseEquipment = 'gym';
    }

    // Nivel sugerido según tipo de ejercicio y complejidad
    let difficulty = 'Intermedio';
    let rank = 'Rango D';
    let baseSets = 3;
    let baseReps = '10 - 12 reps';
    let targetCount = 10;
    let xpReward = 40;

    if (fitriseEquipment === 'none') {
      if (item.name.includes('assisted') || item.target === 'abs' || item.body_part === 'waist' || item.name.includes('knee')) {
        difficulty = 'Principiante';
        rank = 'Rango E';
        baseSets = 3;
        baseReps = '12 - 15 reps';
        targetCount = 12;
        xpReward = 30;
      } else if (item.name.includes('one arm') || item.name.includes('planche') || item.name.includes('muscle up') || item.name.includes('handstand')) {
        difficulty = 'Avanzado';
        rank = 'Rango B - A';
        baseSets = 4;
        baseReps = '6 - 8 reps estrictas';
        targetCount = 8;
        xpReward = 60;
      }
    } else if (fitriseEquipment === 'barbell' || item.name.includes('clean') || item.name.includes('snatch') || item.name.includes('deadlift')) {
      difficulty = 'Avanzado';
      rank = 'Rango C - B';
      baseSets = 4;
      baseReps = '6 - 10 reps pesadas';
      targetCount = 8;
      xpReward = 50;
    }

    return {
      id: item.id,
      name: item.name,
      body_part: item.body_part,
      category: item.category,
      equipment: item.equipment,
      fitriseEquipment,
      target: item.target,
      secondary_muscles: item.secondary_muscles || [],
      steps,
      gif_url: item.gif_url,
      image: item.image,
      media_id: item.media_id,
      difficulty,
      rank,
      baseSets,
      baseReps,
      targetCount,
      xpReward,
      cdnGifUrl: `https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/${item.gif_url}`,
      rawGifUrl: `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${item.gif_url}`,
      thumbnailUrl: `https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/${item.image}`,
    };
  });

  const outPath = path.join(__dirname, '..', 'constants', 'exercises_dataset.json');
  fs.writeFileSync(outPath, JSON.stringify(processed, null, 2), 'utf-8');
  const stats = fs.statSync(outPath);
  console.log(`Guardado exitosamente en ${outPath}`);
  console.log(`Tamaño del archivo procesado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
