# RiftCalc

Calculadora académica de daño de League of Legends, desarrollada con **React Native + Expo + TypeScript**. Configura un campeón, nivel, objetos, runas, buffs y objetivo para estimar ataques, habilidades y combos. La interfaz móvil usa React Native; la versión web usa React Native Web.

## Objetivo

Hacer visible cómo cada estadística y resistencia modifica el daño. La aplicación calcula escenarios de impacto contra un campeón, con cobertura y limitaciones explícitas. No pretende reproducir toda una partida.

## Instalación y ejecución

Requiere Node.js 20.19 o posterior y npm. El proyecto usa Expo SDK 57.

```sh
cd RiftCalc
npm install
npm run dev
```

Expo SDK 57 con React Native 0.86.3, React 19.2.3 y Expo Go compatible con SDK 57. Para abrirlo en un iPhone conectado a la misma Wi-Fi, desde la carpeta del proyecto ejecuta `npm start` y escanea el QR con la cámara. Este comando inicia Expo Go por LAN (`expo start --go --lan`). La terminal debe permanecer abierta. Para vista web usa `npm run dev`.

```sh
npm start
npm run android
npm run ios
```

`android` requiere dispositivo/emulador; el simulador iOS requiere macOS y Xcode. La interfaz nativa debe revisarse en un dispositivo real antes de presentarla como validada en Android/iOS.

En este equipo, Node necesitó los certificados del sistema. Si aparece `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, en PowerShell con Node 24:

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npm install
```

No desactives TLS.

## Build y pruebas

```sh
npm run build
npm run lint
npm test
```

`build` exporta la versión web a `dist/`. `lint` ejecuta TypeScript en modo estricto (`tsc --noEmit`); no es ESLint. Las pruebas usan `node:test` mediante `tsx`. El motor no depende de React.

## Funcionalidades

- Selector visual con búsqueda para los 173 campeones del snapshot y fallback de imágenes.
- Nivel 1–18 con slider e input sincronizados; puntos de habilidades limitados por nivel y presupuesto total.
- Seis espacios de objetos, búsqueda, filtros (incluye “Inicio”), precio, estadísticas y eliminación.
- Árboles de runas: una clave, primarias del mismo árbol, hasta dos secundarias de otro árbol. Se permiten páginas incompletas para experimentar.
- Fragmentos, tiempo de partida independiente, condiciones dinámicas y buffs manuales de aliados.
- Dragones Infernal, Montaña y Hextech. Máximo cuatro acumulaciones totales; no se valida el orden real de aparición de elementos.
- Objetivo personalizado o estadísticas base de cualquier campeón a un nivel dado, escudo universal y reducción de daño.
- Ataque individual o secuencia de hasta 30 acciones; se consume vida/escudo en orden.
- Desglose expandible por fuente, tipo, fórmula, resistencia efectiva y daño final.
- Guardado local de hasta 30 builds con parche y formato. AsyncStorage usa localStorage en web y almacenamiento nativo en móvil.
- Comparación A/B: congela A y recalcula ambas con el objetivo y las acciones actuales; cada build conserva sus niveles, runas, tiempo y buffs.

## Arquitectura

```text
App.tsx                    Orquestación de estado y pantalla adaptable
src/components/ui.tsx      Primitivas nativas, modal, iconos, inputs
src/components/selectors.tsx Campeones, objetos y runas
src/components/panels.tsx   Configuración, estadísticas y resultados
src/data/catalog.ts        Adaptador de datos y escenario inicial
src/data/storage.ts        Persistencia, validación de guardados
src/data/riot.json          Snapshot oficial Data Dragon
src/data/models.json        Valores y cálculos extraídos de CommunityDragon
src/data/stat-overrides.json Correcciones verificadas al snapshot
src/data/effect-reference.json Evidencia de objetos y dragones
src/engine/types.ts         Contratos del dominio
src/engine/stats.ts         Crecimiento, objetos, runas y buffs
src/engine/resistance.ts    Mitigación y penetración
src/engine/effects.ts       Registro extensible de efectos
src/engine/scenario.ts      Ejecución secuencial y desglose
src/engine/validation.ts    Límites, parche y configuración
tests/engine.test.ts        Pruebas numéricas e interacciones
design/FIGMA-SPEC.md        Especificación reproducible de diseño
design/SOURCES.md           Procedencia y fórmulas
```

## Data Dragon y actualización

Snapshot: **16.19.1**, locale **es_MX**. Se consultó `api/versions.json`; no se eligió una versión arbitraria. El build utiliza un snapshot para no mezclar datos por una actualización mientras se configura un escenario. Imágenes desde el CDN oficial; si fallan, se muestran iniciales y el nombre junto al icono. Sin conexión, los cálculos y catálogos incluidos siguen disponibles.

```sh
npm run data:update
# Volver a descargar el parche revisado:
npm run data:update -- 16.19.1
# Regenerar evidencia complementaria:
node --use-system-ca scripts/extract-models.mjs
```

El actualizador consulta las versiones disponibles y **se detiene sin sobrescribir el snapshot si el último parche no coincide con los modelos revisados**. Para migrar: revisar cambios de campeones/objetos/runas, preparar los modelos del nuevo parche, actualizar `EFFECT_PATCH`, regenerar evidencia, ajustar pruebas y entonces descargar Data Dragon. Cambiar solo la etiqueta de versión no constituye una revisión. Guardados incompatibles no se cargan automáticamente.

Los 173 campeones tienen estadísticas base y crecimiento por nivel. Se verificaron AD por nivel y ratio de velocidad de ataque contra `CharacterRecords/Root` de CommunityDragon 16.19: Data Dragon entrega AD por nivel en cero. Senna conserva crecimiento AD base cero y Jhin ratio AS cero; sus pasivas no se simulan. El JSON oficial se conserva intacto. Para regenerar todos los registros: `npm run data:stats`.

## Motor de daño

`calculateScenario(configuration)` devuelve estadísticas, daño bruto y final, tipos, vida restante, fuentes, efectos incluidos y advertencias. Los números se redondean únicamente al mostrarlos.

1. Estadísticas al nivel: `base + crecimiento × (0.7025 + 0.0175 × (nivel − 1)) × (nivel − 1)`.
2. Suma de estadísticas de objetos, fragmentos y runas; buffs y multiplicadores revisados.
3. Resistencia: reducción plana → reducción porcentual → penetración porcentual → penetración plana (letalidad incluida). Penetración no convierte una resistencia positiva en negativa; las reducciones sí pueden hacerlo.
4. Resistencias no negativas: multiplicador `100 / (100 + R)`. Negativas: `2 − 100 / (100 − R)`.
5. Daño verdadero ignora resistencias y la reducción porcentual genérica. El escudo universal puede absorberlo.
6. Cada impacto consume el escudo y la vida. Las ejecuciones calculan la vida faltante actual. La secuencia se detiene al morir el objetivo. El total del impacto letal conserva sobre-daño; la vida eliminada queda limitada a la vida disponible.

El reloj es aproximado: 0.5 s por habilidad, intervalo `1/AS` entre ataques y duración de 3 s para E de Garen. No es un simulador de DPS; no valida tiempos de viaje, animaciones, maná o enfriamientos de habilidades. Los cooldowns de objetos sí se registran.

## Campeones implementados

| Campeón | Stats | Habilidades | Pasiva | Interacciones avanzadas |
|---|---|---|---|---|
| Ahri | Base + crecimiento y build | Q de ida/vuelta, W hasta 3 fuegos, E y recargas de R | Cura de derribo calculada; no altera daño al objetivo | Rango, impacto y curación propia no se simulan |
| Jinx | Base + crecimiento y build | Q, W, E, R, cambios de arma y velocidad de ataque de Pow-Pow | Pasiva inicial configurable; AS por derribo disponible | El derribo no crea un segundo objetivo; R usa daño mínimo o máximo |
| Garen | Base + crecimiento y build | Q incluye ataque, W defensiva, E por ticks/AS, R ejecuta | Regeneración y acumulaciones W de resistencias | W defensiva no recibe daño; E asume objetivo cercano según control |
| Lux | Base + build | Q/E/R y escudo W por trayecto | Marca detonada por AA/R y aplicada tras hechizos | Sin daño entrante ni aliados que reciban escudo |
| Jayce | Resistencias según forma + build | Ambos kits, portal E→Q, 3 impactos de Hipercarga, transformación | Daño del primer AA tras cambiar de forma | Movimiento, colisión y maná no cambian el daño modelado |
| Elise | Base + build, AS pasiva/activa de araña | Ambos kits, Q por vida, arañitas y E de Rápel | Arañitas por habilidad humana; P y curación en forma arácnida | No modela desplazamiento, invulnerabilidad ni daño recibido |
| Otros 167 | Estadísticas base verificadas | Catálogo de habilidades; combo genérico solo AA | Referencia disponible | Modelo de daño propio pendiente |

Los seis campeones anteriores tienen modelado de daño de kit a un objetivo, con los estados enumerados. La simulación no representa partidas completas: presupone que las habilidades alcanzan al objetivo, y no procesa daño recibido, navegación, colisiones, maná, críticos, áreas con varios objetivos ni un segundo campeón tras un derribo. Jinx permite activar su pasiva al inicio; la secuencia termina al derrotar al objetivo. Los ataques se calculan sin crítico, aunque la estadística de crítico se muestra. E de Garen no aplica críticos.

## Objetos implementados

Se incluyen objetos comprables con `maps[11]`, ID menor a 10000, sin requisitos de campeón/aliado y disponibles en tienda. Se excluyen variantes de Arena con IDs extendidos. No se simula la totalidad de restricciones de tienda (grupos únicos, consumibles, mejoras y compras incompatibles). No se permiten duplicados en este MVP.

| Objeto | Soporte |
|---|---|
| Nashor (3115) | Stats, 15 + 15% AP mágico por impacto |
| Luden (6655) | Stats, 6 ecos sobre objetivo aislado: 2 × (75 + 5% AP), cooldown 12 s |
| Brillo (3057) | Stats, siguiente ataque tras habilidad añade 100% AD base; cooldown 1.5 s |
| Rabadon (3089) | Stats y multiplicador de AP 30% |
| Vacío (3135) | AP y penetración mágica 40% |
| Botas del Hechicero (3020) | Penetración mágica plana 12 |
| Resto | Estadísticas reconocidas; pasivas/activas pendientes señaladas |

Se recuperan aceleración, letalidad y penetraciones explícitas del bloque `stats` en español cuando el objeto oficial no las expone en su objeto JSON `stats`. No se evalúan etiquetas de tooltip con fórmulas sin resolver. Movimiento, regeneración, robo de vida y maná no intervienen en daño instantáneo.

El filtro **Inicio** muestra Espada, Sortija y Escudo de Doran, Sacrificar, Mapamundi, pociones y componentes habituales de salida. La ficha muestra sus estadísticas oficiales; la hoja de estadísticas suma vida, maná, regeneraciones, velocidad de movimiento, robo de vida y omnivampirismo además de las estadísticas ofensivas/defensivas. Los efectos condicionados (por ejemplo, el maná de Sortija de Doran, la curación de Sacrificar o el daño adicional a súbditos) se describen, pero no se agregan al daño contra campeones.

## Runas implementadas

| Runa | Modelo |
|---|---|
| Electrocutar | 70–240 según nivel + 10% bonus AD + 5% AP; tres acciones con daño en 3 s, una activación por escenario |
| Tormenta Creciente | `4n(n+1)` AP equivalente, `n=floor(minuto/10)`, conversión AD ×0.6 |
| Concentración Absoluta | 3–30 AP equivalente si se activa condición de más de 70% de vida |
| Golpe de Gracia | +8% físico/mágico con objetivo bajo 40% de vida antes del impacto |
| Otras | Seleccionables visualmente; no añaden efectos y se avisa |

Los fragmentos incluyen fuerza adaptable, 10% AS, 8 de aceleración y vida por nivel. No se pretende cubrir todos los fragmentos disponibles. Las condiciones de combate son explícitas; la vida del atacante no se simula.

## Buffs y dragones

Aliado: AD/AP manuales recibidos. Campeón: condición de objetivo cercano para Garen, distancia de R para Jinx, acumulaciones defensivas de Garen. Mapa: Infernal +3% AD/AP, Montaña +5% resistencias, Hextech +5 aceleración/+5% AS por acumulación. No se calculan Océano/Nube en daño instantáneo ni Quimtech, almas, Anciano o Barón.

## Diseño

Figma queda fuera del alcance por decisión del usuario. `design/FIGMA-SPEC.md` se conserva únicamente como referencia opcional de diseño.

## GitHub y Moodle

El proyecto se preparó dentro de `Repo7mo/RiftCalc`; no se cambió el remoto del repositorio padre ni se incluyeron cambios ajenos de `Servidor`. No se ha publicado un repositorio independiente `riftcalc` ni existe todavía un enlace público de esta entrega.

Trabajo local en la rama `codex/riftcalc-react-native`, con commits separados de implementación y documentación. GitHub CLI y el conector de GitHub no estaban disponibles en esta sesión; la publicación queda pendiente.

Para publicar **solo RiftCalc** como repositorio independiente, instala GitHub CLI e inicia sesión. Desde la raíz `Repo7mo`:

```powershell
gh auth login
gh repo create riftcalc --public --description "Calculadora académica de daño con React Native y Expo"
git subtree split --prefix=RiftCalc -b codex/riftcalc-export
git push https://github.com/ErickGHR/riftcalc.git codex/riftcalc-export:main
```

Comprueba primero que la cuenta autenticada sea `ErickGHR`; ajusta el propietario si tu cuenta es otra. Estos comandos son instrucciones pendientes, no acciones realizadas. El commit local de RiftCalc debe existir antes de `subtree split`.

Para Moodle: entrega la **URL real del repositorio `riftcalc` después de publicarlo**. `localhost:8081` es una vista previa local, no un enlace accesible al profesor. El build `dist/` puede desplegarse en un hosting estático, pero aquí no se publicó ni se inventó una URL.

## Aviso de Riot Games

Proyecto académico, gratuito y no oficial. Texto requerido consultado en [General Policies de Riot](https://support-developer.riotgames.com/hc/en-us/articles/22698591841939-General-Policies):

> RiftCalc isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

Antes de publicar, revisar nuevamente esas políticas, los [términos de API](https://developer.riotgames.com/terms) y los requisitos de registro/auditoría del producto en el portal de Riot. No se usan claves de API, cuentas de jugadores ni servicios privados.

## Autor

**Erick Gabriel Hernández Rebolledo** · Proyecto académico.

## Cobertura de habilidades

La interfaz muestra las cuatro habilidades y la pasiva de los 173 campeones, con 984 registros de habilidades y variantes. La evaluación numérica se conserva para auditoría interna, pero no aparece como explorador en la interfaz. Un porcentaje o un escudo no se suma como daño al combo.

`npm run data:abilities` descarga los datos del mismo parche y genera el catálogo. Reutiliza archivos JSON válidos de `scripts/ability-cache/`; esa caché no se versiona. `npm run data:audit` genera [la cobertura por campeón](design/COBERTURA-HABILIDADES.md). El catálogo preserva un hash SHA-256 del registro fuente de cada campeón.

La auditoría puede evaluar 1800 de 2020 expresiones en su escenario de referencia. Esto es independiente de la cobertura de combate: seis campeones tienen modelo de daño a un objetivo y los otros 167 siguen pendientes. Las operaciones desconocidas y acumulaciones sin contexto muestran un motivo explícito; los tooltips por sí solos no se presentan como simulación.

El [registro de trabajo](PROGRESO.md) permite retomar esta ampliación tras una desconexión.
