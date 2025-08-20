import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type PulseCategory = "alert" | "tips" | "suggestion";

export type YourPulseCardProps = {
  postId: string;
  category: PulseCategory;
  title: string;
  description: string;
  photoUrl?: string; // single image (optional)
  authorName?: string; // e.g., "Ruan Klopper"
  authorRole?: string; // e.g., "Vet"
  createdAt: Date | string | number;
  isPulsedByMe?: boolean; // per-user toggle state
  pulseCount?: number; // optional (only shown if provided)
  onPressPulse?: (postId: string, nextState: boolean) => void;
  onPressCard?: (postId: string) => void;
  onEdit?: (postId: string) => void; // NEW
  onDelete?: (postId: string) => void; // NEW
  style?: ViewStyle;
};

const BRAND_GREEN = "#518649";
const ALERT_RED = "#FF3B30";

const formatDateTime = (d: Date | string | number) => {
  const dt = d instanceof Date ? d : new Date(d);
  const dd = dt.getDate().toString().padStart(2, "0");
  const MMM = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][dt.getMonth()];
  const yyyy = dt.getFullYear();
  const hh = dt.getHours().toString().padStart(2, "0");
  const mm = dt.getMinutes().toString().padStart(2, "0");
  return `${dd} ${MMM} ${yyyy} - ${hh}h${mm}`;
};

const YourPulseCard: React.FC<YourPulseCardProps> = ({
  postId,
  category,
  title,
  description,
  photoUrl,
  authorName,
  authorRole,
  createdAt,
  isPulsedByMe = false,
  pulseCount,
  onPressPulse,
  onPressCard,
  onEdit,
  onDelete,
  style,
}) => {
  const isAlert = category === "alert";
  const dateText = useMemo(() => formatDateTime(createdAt), [createdAt]);

  const categoryLabel =
    category === "alert" ? "Alert" : category === "tips" ? "Tip" : "Suggestion";

  return (
    <Pressable
      onPress={() => onPressCard?.(postId)}
      style={[
        styles.card,
        isAlert ? styles.alertBorder : styles.standardBorder,
        style,
      ]}
    >
      {/* IMAGE (only if provided) */}
      {photoUrl && (
        <View style={styles.imageWrap}>
          <Image source={{ uri: photoUrl }} style={styles.image} />
          {/* Pulse (like/pin) toggle button over image */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onPressPulse?.(postId, !isPulsedByMe);
            }}
            style={[
              styles.pulseFabImage,
              isPulsedByMe && styles.pulseFabActive,
            ]}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Pulse"
            accessibilityState={{ selected: !!isPulsedByMe }}
          >
            <Ionicons
              name={isPulsedByMe ? "checkmark" : "add"}
              size={18}
              color={isPulsedByMe ? "#FFFFFF" : BRAND_GREEN}
            />
          </Pressable>
        </View>
      )}

      {/* BODY */}
      <View style={styles.body}>
        <View style={styles.headerRow}>
          {/* Category badge */}
          <View
            style={[
              styles.badge,
              isAlert ? styles.badgeAlert : styles.badgeNeutral,
            ]}
          >
            <Text
              style={[styles.badgeText, !isAlert && styles.badgeTextNeutral]}
            >
              {categoryLabel}
            </Text>
          </View>

          {/* If no image, show the pulse button in the header row (top-right) */}
          {!photoUrl && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onPressPulse?.(postId, !isPulsedByMe);
              }}
              style={[
                styles.pulseFabBody,
                isPulsedByMe && styles.pulseFabActive,
              ]}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Pulse"
              accessibilityState={{ selected: !!isPulsedByMe }}
            >
              <Ionicons
                name={isPulsedByMe ? "checkmark" : "add"}
                size={18}
                color={isPulsedByMe ? "#FFFFFF" : BRAND_GREEN}
              />
            </Pressable>
          )}
        </View>

        {/* Title (green) + optional pulse count */}
        <Text numberOfLines={2} style={styles.title}>
          {title}
          {typeof pulseCount === "number" ? ` - ${pulseCount} Pulses` : ""}
        </Text>

        {/* Description */}
        <Text numberOfLines={3} style={styles.desc}>
          {description}
        </Text>

        {/* Footer: author & datetime */}
        <View style={styles.footer}>
          <Text style={styles.author}>
            {authorName
              ? `~${authorName}${authorRole ? ` - ${authorRole}` : ""}`
              : ""}
          </Text>
          <Text style={styles.date}>{dateText}</Text>
        </View>

        {/* NEW: Actions row (Edit / Delete) */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onEdit?.(postId);
            }}
            style={({ pressed }) => [
              styles.editBtn,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Ionicons name="create-outline" size={16} color={BRAND_GREEN} />
            <Text style={styles.editLabel}>Edit</Text>
          </Pressable>

          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onDelete?.(postId);
            }}
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && { opacity: 0.92 },
            ]}
          >
            <Ionicons name="trash-outline" size={16} color={ALERT_RED} />
            <Text style={styles.deleteLabel}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

export default YourPulseCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    elevation: 2,
  },
  alertBorder: {
    borderWidth: 2,
    borderColor: ALERT_RED,
  },
  standardBorder: {
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  imageWrap: {
    width: "100%",
    height: 140,
    position: "relative",
    backgroundColor: "#F3F4F6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  body: {
    padding: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeAlert: {
    backgroundColor: "#FFE8E6",
  },
  badgeNeutral: {
    backgroundColor: "#EEF6ED",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: ALERT_RED,
  },
  badgeTextNeutral: {
    color: BRAND_GREEN,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: BRAND_GREEN,
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    color: "#5B6B73",
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  author: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
  date: {
    fontSize: 12,
    color: "#6B7280",
  },
  // Pulse button styles
  pulseFabImage: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E6F2E4",
    alignItems: "center",
    justifyContent: "center",
  },
  pulseFabBody: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E6F2E4",
    alignItems: "center",
    justifyContent: "center",
  },
  pulseFabActive: {
    backgroundColor: BRAND_GREEN,
    borderColor: BRAND_GREEN,
  },

  // NEW: actions
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: BRAND_GREEN,
    backgroundColor: "#FFFFFF",
  },
  editLabel: {
    color: BRAND_GREEN,
    fontWeight: "800",
    fontSize: 14,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFE8E6",
    borderWidth: 1.5,
    borderColor: "#FFD1CD",
  },
  deleteLabel: {
    color: ALERT_RED,
    fontWeight: "800",
    fontSize: 14,
  },
});
