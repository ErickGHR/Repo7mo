# Procedencia, revisión y cobertura

Revisión realizada: 28–29 de septiembre de 2026. Parche de datos: 16.19.1; extracción CommunityDragon: 16.19. No se emplearon datos de Wild Rift.

## Datos oficiales

- [Documentación Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon).
- [Versiones publicadas](https://ddragon.leagueoflegends.com/api/versions.json).
- [Campeones es_MX 16.19.1](https://ddragon.leagueoflegends.com/cdn/16.19.1/data/es_MX/champion.json).
- [Objetos es_MX 16.19.1](https://ddragon.leagueoflegends.com/cdn/16.19.1/data/es_MX/item.json).
- [Runas es_MX 16.19.1](https://ddragon.leagueoflegends.com/cdn/16.19.1/data/es_MX/runesReforged.json).

`riot.json` conserva el snapshot oficial, locale, versión y fecha de descarga. Runas: sus descripciones largas incluyen los valores usados para Electrocutar, Tormenta, Concentración y Golpe de Gracia. Los iconos vienen de Data Dragon; las runas usan la ruta oficial sin versión definida por Riot.

## Datos complementarios del cliente distribuidos por CommunityDragon

- [Ahri](https://raw.communitydragon.org/16.19/game/data/characters/ahri/ahri.bin.json).
- [Jinx](https://raw.communitydragon.org/16.19/game/data/characters/jinx/jinx.bin.json).
- [Garen](https://raw.communitydragon.org/16.19/game/data/characters/garen/garen.bin.json).
- [Objetos](https://raw.communitydragon.org/16.19/game/items.cdtb.bin.json).
- [Efectos compartidos y dragones](https://raw.communitydragon.org/16.19/game/shared.cdtb.bin.json).

Se extrajeron `mSpell.DataValues` y `mSpellCalculations` de las habilidades principales, `mDataValues`/`mItemCalculations` de objetos y valores de `SRX_DragonBuff*`. Los arrays del cliente se indexan por rango aprendido: rango 1 usa índice 1, no índice 0. Los valores de missiles secundarios pueden ser históricos; no se usaron como fuente de daño.

`models.json` y `effect-reference.json` preservan estos registros relevantes. `stat-overrides.json` registra AD por nivel y ratio AS de `CharacterRecords/Root`: se verificaron los 173 campeones del snapshot. Data Dragon entrega crecimiento AD=0; CommunityDragon aporta crecimiento para 172, mientras Senna conserva cero base. Jhin tiene ratio AS cero. Regenerar con `npm run data:stats`; no incluye pasivas ni transformaciones. Datos complementarios no se presentan como respuesta oficial de Data Dragon.

## Lógica manual

`scenario.ts` interpreta los registros: tipo de daño, orden, condiciones, tres fuegos de Ahri, arma de Jinx, giros de Garen, reducción tras seis impactos y vida faltante. No es un intérprete completo de scripts de Riot. `effects.ts` contiene modelos explícitos del mismo parche y los puntos de extensión.

Nashor: `NashorsBaseValue=15`, `NashorsAPValue≈0.15`; Luden: base 75, ratio 0.05, cooldown 12, seis cargas y repetición 0.2; Brillo: coeficiente 1 sobre AD base y cooldown 1.5. Rabadon: 30% AP según tooltip oficial. Dragones: Infernal 0.03, Montaña 0.05, Hextech 5 y 0.05, verificados en los registros 16.19. Como contexto histórico, Riot documentó esos valores de dragones en [13.20](https://www.leagueoflegends.com/en-sg/news/game-updates/patch-13-20-notes/).

Las fórmulas generales de crecimiento/resistencia y el orden de penetración son una implementación manual matemática, cubierta por tests. No provienen de una API ejecutable de Riot. La simulación presume impactos exitosos, un objetivo sin movimiento, sin regeneración ni pasivas defensivas. Los tiempos son aproximaciones declaradas. Es necesaria validación adicional contra el cliente para afirmar equivalencia exacta con el juego.

## Exclusiones

No hay backend, Riot API keys, historial de partidas ni datos de jugadores. No se implementan todos los grupos únicos de tienda, todas las formas de campeones, críticos, daño en área repartido, resistencias especiales, monstruos, torres ni todas las interacciones de runas. Los componentes informan las exclusiones del escenario. La cobertura no se expresa como porcentaje inventado.

## Política y licencia de assets

El aviso visible de la aplicación y README procede de [General Policies](https://support-developer.riotgames.com/hc/en-us/articles/22698591841939-General-Policies), consultado durante el desarrollo. El uso de los assets no confiere propiedad ni aprobación de Riot. Revisar [API Terms](https://developer.riotgames.com/terms) y [Legal](https://www.riotgames.com/en/legal) antes de publicar.
