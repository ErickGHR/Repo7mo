# Estado del proyecto — 29 de septiembre de 2026

## Solicitud atendida

Completar el modelo de los seis campeones trabajados (Ahri, Jinx, Garen, Lux, Jayce y Elise), añadir estadísticas de objetos de inicio y revisar la documentación. Se conserva React Native/Expo SDK 57 y el parche de datos 16.19.1.

## Cobertura actual

- Daño de Q/W/E/R y ataques para un objetivo en los seis campeones; pasivas y cambios de forma que intervienen en el cálculo están conectados.
- Ahri: Q de ida/regreso, fuegos de W, R por carga y curaciones de P informadas cuando se simula una baja.
- Jinx: cambio de arma, acumulaciones de velocidad de ataque de Pow-Pow, penalización de Fishbones y estado inicial de su pasiva.
- Garen: Q incluye el ataque, E escala sus ticks con velocidad de ataque y aplica reducción de armadura, R ejecuta, W informa escudo/mitigación y cuenta hasta 150 acumulaciones de resistencia.
- Lux: P se consume con ataques y R; Q/E/R hacen daño, W informa el escudo por trayecto.
- Jayce: formas y seis rangos, portal que potencia Q, tres disparos de Hipercarga, ataques posteriores a R y resistencias del martillo.
- Elise: ambas formas, arañitas configurables/almacenadas, daño y curación de P en araña, Q por vida actual/faltante, W con velocidad pasiva/activa y amplificación de E arácnida.
- Otros 167 campeones: catálogo y estadísticas; el daño propio de sus habilidades sigue pendiente. La tabla reproducible está en [COBERTURA-HABILIDADES.md](design/COBERTURA-HABILIDADES.md).

## Objetos de inicio

El selector tiene un filtro “Inicio” con objetos de Doran, Sacrificar, Mapamundi, pociones y componentes comunes. La pantalla suma y muestra vida, maná, regeneración, velocidad de movimiento, robo de vida, omnivampirismo y oro periódico cuando el snapshot aporta ese dato. Mapamundi se completa con campos de CommunityDragon que Data Dragon deja vacíos. Los efectos de objetos que no alteran el daño al campeón se muestran en la ficha y no se inventan como daño.

## Límites explícitos

El combate calcula una secuencia ideal contra un solo objetivo: no resuelve impactos fallidos, daño recibido, críticos, navegación, maná, cooldowns de habilidades, aliados escudados ni otro campeón tras una baja. La curación propia se informa, pero no cambia una reserva de vida del campeón. La distancia de R de Jinx se estima como mínimo o máximo. Los seis modelos no equivalen a una simulación completa de partida ni a los 173 campeones.

## Validación de esta entrega

- `npm run lint`: pasa.
- `npm test`: 46 pruebas aprobadas, incluidas habilidades/pasivas de los seis campeones, formas, objetos de inicio y estadísticas.
- `npm run build`: export web de Expo completada.
- `npm run data:audit`: auditoría regenerada; 1800/2020 expresiones evaluables en su escenario de referencia. Esa cifra no representa cobertura de combate.

El export para iOS y la ejecución en Expo Go se validaron en el trabajo previo del proyecto. Esta entrega no requiere ni afirma una compilación nativa de iOS en Windows.
