# RiftCalc — especificación para Figma

Estado: especificación, no archivo Figma creado. Implementación: componentes React Native/Expo. Crear página `01 · Design System` y página `02 · Screens` en Figma.

## Estilos

| Token | Valor |
|---|---|
| Background | #0B0F14 |
| Surface | #111827 |
| Elevated | #18212F |
| Border | #263244, 1 px |
| Text primary / secondary | #F8FAFC / #94A3B8 |
| Accent | #38BDF8 |
| Physical / magic / true | #FB8C86 / #A99BFF / #DAE7ED |
| Success | #7CE4BB sobre #153D36 |
| Warning | #E3C883 |
| Space | 4, 8, 10, 12, 16, 20, 24, 32, 40 |
| Radius | Input/button 8; icon 10; logo 12; card/modal 16 |

Tipografía Figma: Inter; app: fuente de sistema nativa. Display 38/46 semibold, tracking −1.2; título 24/30 bold; card 18/24 bold; body 14/20 regular; secondary 12/19; eyebrow 11/16 semibold tracking 1.5; daño principal 60/68 extra bold, tracking −3. Mobile display 29/36.

## Componentes y variantes

- `Button`: Auto Layout horizontal, padding 10 vertical/14 horizontal, min-height 42 (44 para controles principales), Hug contents. Variantes default, hover/focus con borde accent, pressed opacidad 65%, selected fondo #123044, disabled opacidad 35%.
- `Card`: Auto Layout vertical, padding 20, gap 16; fill surface, borde, radius 16. Variantes normal, result, accordion abierto/cerrado.
- `Input`: label encima con gap 5; alto 44; fondo background; texto 14; borde focus accent. Variantes vacío, completo, inválido y disabled. Valores fuera de rango se limitan al rango permitido.
- `ChampionIcon`: 48×48, ampliado 80×80 en tarjeta y 56×56 en selector. Variantes image y fallback de dos iniciales; nombre accesible y visible al lado/debajo.
- `ChampionTile`: 112×112 mínimo, vertical, gap 8; imagen/nombre/cobertura. Selected borde accent y fondo #123044.
- `ItemSlot`: tres columnas por fila, dos filas, botón alto 84; imagen 48, nombre hasta dos líneas debajo, quitar con texto. Variantes empty, occupied, selected, pending-effect.
- `RuneSlot`: icono 36, nombre y cobertura; Auto Layout horizontal, texto Fill container.
- `AbilityCard`: icono 36, nombre/fórmula, selector de rango con botones ± y lectura central.
- `StatRow`: horizontal Space between, label secundario y valor 14 semibold.
- `DamageSource`: nombre y tipo a la izquierda, final/bruto a la derecha; expansión inferior con fórmula y resistencia. Nunca comunicar tipo solo por color.
- `Modal`: overlay negro 73%, tarjeta max-width 850, max-height 90% viewport; header fijo con título/cerrar, búsqueda/filtros y lista con scroll vertical.
- `BuffToggle`: label Fill container, switch a la derecha; seleccionado azul.
- `PatchBadge`: borde, radius 8, texto de parche 11 y punto verde.

## Frames

Las coordenadas son locales al frame. El contenido largo usa scroll vertical; 1024 y 844 son alturas del viewport, no una obligación de comprimir todo el formulario.

| Frame | Tamaño | Layout / posición |
|---|---|---|
| Calculator — Desktop | 1440×1024 | Padding lateral 32 y superior 36; header (32,36,1376,72); hero (32,132,1376,100); columnas desde y=256: izquierda x=32 w=371, centro x=423 w=538, derecha x=981 w=427; gaps 20 |
| Champion Selector | 1440×1024 | Overlay completo; modal centrado (295,76,850,872); header 52; search 44; nota 19; grid de seis tiles con wrap, gap 10 |
| Item Selector | 1440×1024 | Modal centrado 850×872; header/search; filtros en wrap; lista de filas min-height 88 con icono 48, stats y precio |
| Rune Selector | 1440×1024 | Modal 850×872; botones de 5 árboles en wrap; lista vertical por árbol con clave primero, descripciones y estado seleccionado |
| Buff Selector | 1440×1024 | Estado de Calculator con acordeón Buffs abierto en columna central; inputs de dragones y toggles condicionales. Variante panel aislado 538×700 para revisión |
| Target Configuration | 1440×1024 | Estado con panel izquierdo Objetivo abierto, tabs Personalizado/Preset, grid de inputs en dos columnas; variante con selector de campeón superpuesto |
| Damage Result | 1440×1024 | Columna derecha 427 px: resultado 460 px aprox., desglose auto-height, cobertura y guardados; variantes vacío, daño parcial, letal, efecto pendiente y comparación |
| Mobile Calculator | 390×844 | Padding 16, ancho útil 358; header wrap; hero; cards a ancho completo, gap 20; secuencia campeón, nivel, build, habilidades, runas, buffs, objetivo, acción, resultado, desglose, guardados |

## Auto Layout y constraints

Desktop usa grid de 12 columnas, márgenes 32 y gutters 20 como guía. Contenedor de columnas horizontal con Fill container; centro absorbe espacio. Cada columna tiene Auto Layout vertical, altura Hug. Máximo ancho de contenido 1512 px. Header y footer Fill width. Imágenes fijas; textos Fill width y Hug height. No fijar altura en nombres de habilidades ni descripciones.

Breakpoint de implementación 1180 px: columnas pasan a una sola. Por debajo de 600: padding 16 y display 29. Modal móvil ancho `viewport − 32`, header y filtros envuelven texto; grid de campeones reduce número de columnas automáticamente. Evitar scroll horizontal de página. Acordeones de habilidades, runas, buffs, objetivo y cobertura para acortar la pantalla.

## Interacciones del prototipo

1. Cambiar campeón → Champion Selector. Buscar filtra; seleccionar retorna a Calculator y actualiza card; focus por teclado y Enter deben funcionar.
2. Slot vacío/ocupado → Item Selector. Seleccionar equipa; Quitar limpia el slot. Objeto ya equipado no se duplica.
3. Configurar runas → Rune Selector; cambiar árbol y pulsar runa marca selección; cerrar conserva estado.
4. Buffs muestra únicamente condiciones relevantes a campeón/runas/objetos. Inputs de dragón limitan total a 4.
5. Target Preset → selector; nivel actualiza vida y resistencias, luego permite edición.
6. Acción individual cambia inmediatamente el resultado. Combo suma acciones; pulsar chip lo elimina; limpiar vacía.
7. Pulsar fila del desglose expande fórmula. Guardar conserva todos los parámetros y parche. Fijar A crea comparación con B.

## Accesibilidad

Labels persistentes, textos junto a iconos, focus visible en web, roles de botón e inputs nativos, texto de estado para seleccionados/pendientes, contraste elevado. Modal cierra con botón y back/Escape. Mantener blancos táctiles de 44 px en los componentes Figma. Revisar lector de pantalla y navegación nativa en dispositivo antes de entregar.

## Assets

Usar el CDN Data Dragon del parche mostrado. No rasterizar la interfaz ni reutilizar fondos del cliente. Mantener iconos como imágenes y todos los demás elementos como componentes editables. El logotipo `R/` es tipográfico; no usa logotipos oficiales de Riot.
