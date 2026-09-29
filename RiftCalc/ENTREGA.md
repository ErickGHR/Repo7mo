# Entrega — RiftCalc

Autor: **Erick Gabriel Hernández Rebolledo**. Proyecto académico desarrollado íntegramente con componentes React Native, Expo 54 y TypeScript. Web mediante React Native Web.

## Checklist

- [x] Proyecto funcionando en navegador local.
- [x] Selector de 173 campeones con búsqueda.
- [x] Iconos oficiales con fallback automático.
- [x] Selector de nivel, slider e input sincronizados.
- [x] 215 objetos del catálogo filtrado; seis slots, búsqueda y filtros.
- [x] 62 runas visuales; cuatro efectos modelados y fragmentos representativos.
- [x] Buffs de aliado manuales y condiciones del campeón.
- [x] Dragones Infernal, Montaña y Hextech.
- [x] Target personalizado/preset, nivel, vida, resistencias y escudo.
- [x] Ataques básicos genéricos sin crítico.
- [x] Habilidades de Ahri, Jinx y Garen dentro del alcance MVP documentado.
- [x] Combo secuencial y estado de combate.
- [x] Daño físico, mágico y verdadero.
- [x] Resistencias positivas/negativas y penetración.
- [x] Damage Breakdown expandible.
- [x] Responsive revisado a 390×844 y escritorio.
- [x] Guardado y carga después de recargar la página.
- [x] Comparación A/B.
- [x] Especificación de ocho frames de Figma en `design/FIGMA-SPEC.md`.
- [ ] Archivo real de Figma: creación manual pendiente.
- [x] README, fuentes, limitaciones y aviso oficial de Riot.
- [x] 31 pruebas del motor aprobadas.
- [x] TypeScript estricto aprobado (`npm run lint`).
- [x] `npm run build`: exportación web correcta.
- [x] Exportaciones de bundles Android e iOS correctas.
- [ ] Ejecución y QA en dispositivos Android/iOS reales.
- [x] Archivos preparados para Git; dependencias, exportaciones y secretos ignorados.
- [ ] Repositorio GitHub independiente `riftcalc` publicado.
- [ ] Enlace público listo para Moodle.

## Resumen solicitado

| Punto | Estado |
|---|---|
| Nombre | RiftCalc — League Damage Lab |
| Arquitectura | React Native + Expo + TypeScript; motor puro, adaptador de datos, componentes y persistencia separados |
| Interfaz | Pantalla principal con tres columnas en escritorio y secciones verticales en móvil; selectores en modales |
| Figma | Especificación completa; sin archivo ni URL ficticios |
| Fuentes | Data Dragon oficial es_MX; CommunityDragon 16.19 para fórmulas y correcciones verificadas |
| Parche | 16.19.1, seleccionado mediante consulta de versiones; snapshot reproducible |
| Campeones visuales | 173 |
| Campeones con motor | Ahri, Jinx y Garen: modelos MVP de habilidades; ninguno reproduce todas las interacciones del juego |
| Objetos | 215 en catálogo; estadísticas reconocidas. Efectos/estadísticas especiales de Nashor, Luden, Brillo, Rabadon, Vacío y Botas del Hechicero |
| Runas | 62 visuales; Electrocutar, Tormenta Creciente, Concentración Absoluta y Golpe de Gracia calculadas |
| Buffs | AD/AP de aliado manuales, Garen objetivo cercano y acumulaciones W, Jinx distancia R, procs de objetos y condiciones de runas |
| Dragones | Infernal, Montaña, Hextech. Sin almas, Anciano, Barón o Quimtech |
| Fórmulas | Crecimiento no lineal; AP, AD y bonus AD; penetración y resistencias; vida faltante; on-hit/on-spell; reducción de armadura; escudos |
| Pruebas | 31 unitarias; TypeScript; export web/nativa; recorridos funcionales en navegador |
| Limitaciones | Sin críticos, simulación real de DPS, todas las pasivas, maná, enfriamientos de habilidades ni QA nativo en dispositivo |
| Git | Rama `codex/riftcalc-react-native`; commit de implementación `7cfc1d3` y commit separado de documentación; cambios ajenos en Servidor preservados |
| GitHub | No publicado. El remoto existente corresponde a Repo7mo, no a una nueva entrega riftcalc |
| URL GitHub de la entrega | Pendiente de publicación |
| URL Figma | Pendiente de crear los frames en Figma |
| Trabajo manual | Probar dispositivos, reproducir frames en Figma, publicar el repositorio y revisar registro/políticas de Riot antes de publicación |
| Moodle | Entregar la URL pública real del repositorio publicado y el enlace real de Figma si lo exige la rúbrica. No entregar localhost |

## Verificación manual realizada

En el navegador se comprobó buscar y seleccionar Jinx, cambiar nivel y armadura, buscar/equipar/quitar Nashor, seleccionar Concentración Absoluta en Brujería, activar AP de aliado, añadir tres infernales, calcular AA y Q, crear E → Q → R → AA, expandir una fuente, guardar `Demo · Ahri 3 infernales`, recargar y cargar esa build. La comparación A/B cambió al equipar y quitar Nashor. Se seleccionó Garen como objetivo con teclado y se cambió a nivel 18. En móvil se corrigió el recorte de la cabecera y se verificó que inputs, botones e imágenes no rebasaran el viewport.

La exportación nativa comprueba resolución y compilación del bundle, **no sustituye una prueba en emulador o teléfono**. El deslizador tiene alternativa de input numérico; la operación por teclado del slider web de la dependencia no se confirmó. La selección de campeones con Tab/Enter sí se verificó.

## Demostración sugerida

1. Abrir `npm run dev`; mostrar Ahri nivel 11 y la cobertura.
2. Calcular Q: explicar salida mágica y regreso verdadero.
3. Activar tres infernales y observar AP y daño.
4. Añadir Nashor; comparar AA frente a Q.
5. Construir un combo y expandir una fila para mostrar la fórmula.
6. Guardar, recargar y recuperar el escenario.
7. Cambiar a un campeón pendiente para mostrar que sus habilidades no inventan daño.

Los comandos para publicar únicamente la carpeta RiftCalc están en README.md.
