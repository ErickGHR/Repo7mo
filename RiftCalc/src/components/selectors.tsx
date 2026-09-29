import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import {
  champions,
  items,
  runes,
  runeTrees,
  supported,
  supportedRunes,
  asset,
  strip,
} from "../data/catalog";
import { Champion, Item, Rune } from "../engine/types";
import { modeledItems } from "../engine/effects";
import {
  Button,
  ChampionIcon,
  EmptyState,
  Label,
  Modal,
  SafeIcon,
  SearchInput,
  styles,
  colors,
} from "./ui";
export function ChampionSelector({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (c: Champion) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const list = champions.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Modal title="Selecciona un campeón" visible={visible} onClose={onClose}>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar entre 173 campeones…"
      />
      <Label>Modelos avanzados: Ahri · Jinx · Garen</Label>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={[styles.row, { alignItems: "stretch" }]}>
          {list.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`Seleccionar ${c.name}`}
              accessibilityState={{ selected: selected === c.id }}
              onPress={() => {
                onSelect(c);
                setSearch("");
                onClose();
              }}
              style={[
                styles.button,
                { width: 112, gap: 8 },
                selected === c.id && styles.active,
              ]}
            >
              <ChampionIcon id={c.id} name={c.name} size={56} />
              <Text style={styles.text}>{c.name}</Text>
              <Text
                style={{
                  fontSize: 10,
                  color: supported.includes(c.id)
                    ? colors.accent
                    : colors.muted,
                }}
              >
                {supported.includes(c.id) ? "MODELO MVP" : "Solo AA"}
              </Text>
            </Pressable>
          ))}
        </View>
        {!list.length && <EmptyState text="No hay campeones con ese nombre." />}
      </ScrollView>
    </Modal>
  );
}
export function ItemCard({
  item,
  onPress,
  selected = false,
}: {
  item: Item;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Equipar ${item.name}`}
      onPress={onPress}
      style={[
        styles.button,
        {
          flexDirection: "row",
          justifyContent: "flex-start",
          gap: 14,
          marginBottom: 8,
        },
        selected && styles.active,
      ]}
    >
      <SafeIcon name={item.name} uri={asset("item", item.image.full)} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.text}>{item.name}</Text>
        <Label>
          {strip(
            item.description.match(/<stats>([\s\S]*?)<\/stats>/)?.[1] ||
              item.plaintext,
          )}
        </Label>
        <Text
          style={{
            fontSize: 11,
            color: modeledItems.includes(item.id) ? "#7CE4BB" : colors.muted,
          }}
        >
          {modeledItems.includes(item.id)
            ? "Efecto de daño / estadísticas modelado"
            : "Estadísticas · efectos especiales pendientes"}
        </Text>
      </View>
      <Text style={{ color: "#E3C883", fontSize: 12 }}>
        {item.gold.total} G
      </Text>
    </Pressable>
  );
}
export function ItemSelector({
  visible,
  onClose,
  onSelect,
  equipped,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (i: Item) => void;
  equipped: (string | null)[];
}) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("Todos");
  const filters: Record<string, string> = {
    AP: "SpellDamage",
    AD: "Damage",
    Defensa: "Armor",
    Botas: "Boots",
  };
  const list = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "Todos" || i.tags.includes(filters[filter])),
  );
  return (
    <Modal
      title="Armería · Seleccionar objeto"
      visible={visible}
      onClose={onClose}
    >
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar objeto…"
      />
      <View style={styles.row}>
        {["Todos", ...Object.keys(filters)].map((f) => (
          <Button
            key={f}
            title={f}
            active={f === filter}
            onPress={() => setFilter(f)}
          />
        ))}
      </View>
      <Label>{list.length} objetos de la Grieta · Sin duplicados</Label>
      <ScrollView keyboardShouldPersistTaps="handled">
        {list.map((i) => (
          <ItemCard
            key={i.id}
            item={i}
            selected={equipped.includes(i.id)}
            onPress={() => {
              if (!equipped.includes(i.id)) {
                onSelect(i);
                onClose();
              }
            }}
          />
        ))}
        {!list.length && <EmptyState text="No hay objetos que coincidan." />}
      </ScrollView>
    </Modal>
  );
}
export function RuneSlot({
  rune,
  onPress,
}: {
  rune: Rune;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rune.name}
      style={[styles.row, styles.button, { justifyContent: "flex-start" }]}
    >
      <SafeIcon
        name={rune.name}
        uri={`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`}
        size={36}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>{rune.name}</Text>
        <Label>
          {supportedRunes.includes(rune.id)
            ? "Efecto incluido"
            : "Efecto pendiente"}
        </Label>
      </View>
    </Pressable>
  );
}
export function RuneSelector({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: number[];
  onSelect: (r: Rune) => void;
  onClose: () => void;
}) {
  const [tree, setTree] = useState(8100);
  return (
    <Modal title="Laboratorio de runas" visible={visible} onClose={onClose}>
      <Label>
        Una clave y hasta 3 primarias; 2 secundarias de otro árbol. Los efectos
        pendientes se señalan en el resultado.
      </Label>
      <View style={styles.row}>
        {runeTrees.map((t) => (
          <Button
            key={t.id}
            title={t.name}
            active={tree === t.id}
            onPress={() => setTree(t.id)}
          />
        ))}
      </View>
      <ScrollView>
        {runes
          .filter((r) => r.tree === tree)
          .map((r) => (
            <View
              key={r.id}
              style={{
                marginBottom: 12,
                padding: 12,
                borderRadius: 10,
                backgroundColor: selected.includes(r.id)
                  ? "#163445"
                  : colors.bg,
              }}
            >
              <RuneSlot rune={r} onPress={() => onSelect(r)} />
              <Label>{strip(r.longDesc)}</Label>
              <Text style={{ color: colors.accent, fontSize: 11 }}>
                {selected.includes(r.id)
                  ? "SELECCIONADA"
                  : "Pulsar para seleccionar"}
              </Text>
            </View>
          ))}
      </ScrollView>
    </Modal>
  );
}
