import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Image,
  Modal as NativeModal,
  ScrollView,
  Switch,
} from "react-native";
import { asset } from "../data/catalog";
export const colors = {
  bg: "#0B0F14",
  surface: "#111827",
  raised: "#18212F",
  border: "#263244",
  text: "#F8FAFC",
  muted: "#94A3B8",
  accent: "#38BDF8",
  physical: "#FB8C86",
  magic: "#A99BFF",
  true: "#DAE7ED",
};
export const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  text: { color: colors.text, fontSize: 14 },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  title: { color: colors.text, fontSize: 18, fontWeight: "700" },
  input: {
    color: colors.text,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 44,
  },
  button: {
    minHeight: 42,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  active: { backgroundColor: "#123044", borderColor: colors.accent },
  tiny: {
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
});
export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}
export function Button({
  title,
  onPress,
  active = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        active && styles.active,
        { opacity: disabled ? 0.35 : pressed ? 0.65 : 1 },
      ]}
    >
      <Text style={[styles.text, active && { color: colors.accent }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Card({
  title,
  kicker,
  children,
  collapsible = false,
}: {
  title: string;
  kicker?: string;
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <View style={styles.card}>
      {kicker && <Text style={styles.tiny}>{kicker}</Text>}
      <Pressable
        accessibilityRole={collapsible ? "button" : "header"}
        onPress={() => collapsible && setOpen(!open)}
      >
        <Text style={styles.title}>
          {title}
          {collapsible ? (open ? "  −" : "  +") : ""}
        </Text>
      </Pressable>
      {open && children}
    </View>
  );
}
export function NumericInput({
  label,
  value,
  onChange,
  min = 0,
  max = 99999,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return (
    <View style={{ flexGrow: 1, flexBasis: 110, gap: 5 }}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        keyboardType="decimal-pad"
        selectTextOnFocus
        value={draft}
        onChangeText={(v) => {
          setDraft(v);
          if (v.trim() && Number.isFinite(Number(v))) {
            const n = Math.min(max, Math.max(min, Number(v)));
            if (step !== 1 || Number.isInteger(n)) onChange(n);
          }
        }}
        onBlur={() => {
          const n = Number(draft);
          const v = Number.isFinite(n)
            ? Math.min(max, Math.max(min, step === 1 ? Math.round(n) : n))
            : value;
          setDraft(String(v));
          onChange(v);
        }}
        style={styles.input}
      />
    </View>
  );
}
export function SafeIcon({
  uri,
  name,
  size = 48,
}: {
  uri?: string;
  name: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  return uri && !failed ? (
    <Image
      accessibilityLabel={name}
      source={{ uri }}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        backgroundColor: colors.raised,
      }}
    />
  ) : (
    <View
      accessibilityLabel={name}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        backgroundColor: "#243750",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: colors.accent,
          fontSize: size * 0.3,
          fontWeight: "700",
        }}
      >
        {name.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}
export const ChampionIcon = ({
  id,
  name,
  size = 48,
}: {
  id: string;
  name: string;
  size?: number;
}) => <SafeIcon uri={asset("champion", `${id}.png`)} name={name} size={size} />;
export const SearchInput = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
}) => (
  <TextInput
    autoFocus
    accessibilityLabel={placeholder}
    placeholder={placeholder}
    placeholderTextColor={colors.muted}
    value={value}
    onChangeText={onChange}
    style={styles.input}
  />
);
export function Modal({
  title,
  visible,
  onClose,
  children,
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <NativeModal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#000B",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <View
          accessibilityViewIsModal
          style={[
            styles.card,
            { width: "100%", maxWidth: 850, maxHeight: "90%" },
          ]}
        >
          <View style={[styles.row, { justifyContent: "space-between" }]}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Button title="Cerrar ×" onPress={onClose} />
          </View>
          {children}
        </View>
      </View>
    </NativeModal>
  );
}
export function BuffToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={[styles.row, { justifyContent: "space-between" }]}>
      <Text style={[styles.text, { flex: 1 }]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: "#1476A0", false: colors.border }}
        thumbColor={value ? colors.accent : colors.muted}
      />
    </View>
  );
}
export const DamageTypeBadge = ({
  type,
}: {
  type: "physical" | "magic" | "true";
}) => (
  <Text style={{ color: colors[type], fontSize: 11 }}>
    {{ physical: "FÍSICO", magic: "MÁGICO", true: "VERDADERO" }[type]}
  </Text>
);
export const PatchBadge = ({ patch }: { patch: string }) => (
  <View style={[styles.button, { minHeight: 32, paddingVertical: 6 }]}>
    <Text style={{ fontSize: 11, color: "#7CE4BB" }}>● DATA PATCH {patch}</Text>
  </View>
);
export const EmptyState = ({ text }: { text: string }) => (
  <View style={{ padding: 24 }}>
    <Label>{text}</Label>
  </View>
);
export const Tooltip = ({ text }: { text: string }) => <Label>{text}</Label>;
