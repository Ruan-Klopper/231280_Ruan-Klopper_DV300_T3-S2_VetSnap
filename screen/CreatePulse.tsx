import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import React from "react";
import AppHeader from "../components/global/AppHeader";
import { globalStyles } from "../global/styles";
import AppContentGroup from "../components/global/AppContentGroup";
import { GetCurrentUserData } from "../services/auth/authService";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

// Pulse service
import {
  createPost,
  updatePost,
  getPost,
} from "../services/pulse/pulse.service";

type PulseCategory = "alert" | "tips" | "suggestion";

type RouteParams = {
  // Either pass initialData for edit OR just postId (will fetch)
  postId?: string;
  initialData?: {
    id: string;
    category: PulseCategory;
    title: string;
    description?: string;
    photoUrl?: string | null;
  };
};

const CreatePulse = () => {
  const [user, setUser] = React.useState<any>(null);
  const navigation = useNavigation();
  const route = useRoute<any>();
  const params: RouteParams = route.params ?? {};

  // ─── Detect Mode ────────────────────────────────────────────────
  const isEditMode = Boolean(params.initialData?.id || params.postId);
  const editingPostId = params.initialData?.id ?? params.postId ?? null;

  // ─── Form State ────────────────────────────────────────────────
  const [category, setCategory] = React.useState<PulseCategory>(
    params.initialData?.category ?? "alert"
  );
  const [title, setTitle] = React.useState<string>(
    params.initialData?.title ?? ""
  );
  const [description, setDescription] = React.useState<string>(
    params.initialData?.description ?? ""
  );

  // Single image slot
  const [imageUri, setImageUri] = React.useState<string | undefined>(
    params.initialData?.photoUrl ?? undefined
  );
  // For edit mode we need to know if the user removed the existing one
  const [imageRemoved, setImageRemoved] = React.useState<boolean>(false);

  // UI state
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPrefilling, setIsPrefilling] = React.useState<boolean>(
    isEditMode && !params.initialData?.id // we’ll fetch if only postId was provided
  );

  // ─── Load User ─────────────────────────────────────────────────
  React.useEffect(() => {
    (async () => {
      const res = await GetCurrentUserData();
      if (res?.success) setUser(res.data);
      console.log("USER ID", res.data?.userId);
    })();
  }, []);

  // ─── Prefill if only postId provided ───────────────────────────
  React.useEffect(() => {
    (async () => {
      if (!isEditMode || !editingPostId || params.initialData?.id) return;
      setIsPrefilling(true);
      const res = await getPost(editingPostId);
      if (res.success && res.data) {
        const p = res.data;
        setCategory(p.category);
        setTitle(p.title);
        setDescription(p.description ?? "");
        setImageUri(p.media?.photoUrl ?? undefined);
      } else {
        Alert.alert("Not found", "We couldn’t load that pulse.");
        navigation.goBack();
      }
      setIsPrefilling(false);
    })();
  }, [isEditMode, editingPostId]);

  // ─── Image pick/remove ─────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "We need access to your photos to attach an image."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.82,
    });
    if (!result.canceled && result.assets?.length) {
      setImageUri(result.assets[0].uri);
      setImageRemoved(false); // if user picks new image after previously removing
    }
  };

  const removeImage = () => {
    setImageUri(undefined);
    // If we’re editing an existing pulse which had a photo, mark for removal
    if (isEditMode) setImageRemoved(true);
  };

  // ─── Validation (client-side mirror of service) ────────────────
  const validate = () => {
    const t = title.trim();
    const d = description.trim();
    const allowed: PulseCategory[] = ["alert", "tips", "suggestion"];

    if (!t || t.length < 4) {
      Alert.alert("Title required", "Title must be at least 4 characters.");
      return false;
    }
    if (t.length > 120) {
      Alert.alert("Too long", "Title cannot exceed 120 characters.");
      return false;
    }
    if (d.length > 2000) {
      Alert.alert("Too long", "Description cannot exceed 2000 characters.");
      return false;
    }
    if (!allowed.includes(category)) {
      Alert.alert("Invalid category", "Choose Alert, Tip or Suggestion.");
      return false;
    }
    return true;
  };

  // ─── Save (Create or Update) ───────────────────────────────────
  const savePulse = async () => {
    if (!user?.userId) {
      Alert.alert("Not signed in", "Please sign in and try again.");
      return;
    }
    if (!validate()) return;

    try {
      setIsSaving(true);

      if (!isEditMode) {
        // CREATE
        const resp = await createPost({
          authorId: user.userId,
          category,
          title: title.trim(),
          description: description.trim(),
          localPhotoUri: imageUri, // optional
        });

        if (!resp.success) {
          Alert.alert(
            "Error",
            resp.error ?? resp.message ?? "Failed to create."
          );
        } else {
          Alert.alert("Saved", "Your pulse has been created.");
          // @ts-ignore
          navigation.navigate("YourPulses");
        }
      } else if (editingPostId) {
        // UPDATE
        // replacePhotoWithUri semantics:
        //   - string: replace with new image
        //   - null: remove existing image
        //   - undefined: keep current as-is
        let replacePhotoWithUri: string | null | undefined = undefined;
        if (imageRemoved) {
          replacePhotoWithUri = null;
        } else {
          // If imageUri is a local file (starts with file:/ or content:) or if there
          // was no initial photo and now we have a URI, treat as replacement upload.
          // Heuristic: if params.initialData?.photoUrl equals imageUri -> unchanged.
          const initialUrl = params.initialData?.photoUrl ?? undefined; // may be undefined if we fetched by postId
          const looksLocal =
            typeof imageUri === "string" &&
            (imageUri.startsWith("file:") || imageUri.startsWith("content:"));

          if (imageUri && (looksLocal || imageUri !== initialUrl)) {
            replacePhotoWithUri = imageUri;
          }
        }

        const resp = await updatePost({
          postId: editingPostId,
          changes: {
            category,
            title: title.trim(),
            description: description.trim(),
          },
          replacePhotoWithUri,
        });

        if (!resp.success) {
          Alert.alert(
            "Error",
            resp.error ?? resp.message ?? "Failed to update."
          );
        } else {
          Alert.alert("Saved", "Your pulse has been updated.");
          // @ts-ignore
          navigation.navigate("YourPulses");
        }
      }
    } catch (e: any) {
      console.warn("[savePulse] error", e);
      Alert.alert(
        "Error",
        "There was a problem saving your pulse. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Header ────────────────────────────────────────────────────
  const HeaderComponents: React.FC<{
    onYourPulses: () => void;
    onAllPulses: () => void;
  }> = ({ onYourPulses, onAllPulses }) => (
    <View style={styles.headerBlock}>
      <Text style={styles.headerText}>New or Edit Pulse</Text>
      <Text style={styles.headerSub}>
        Create a quick Alert, Tip, or Suggestion
      </Text>

      <View style={styles.headerButtonsRow}>
        <Pressable
          onPress={onYourPulses}
          style={({ pressed }) => [
            styles.hBtnSecondary,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons name="person-circle" size={18} color="#518649" />
          <Text style={styles.hBtnSecondaryLabel}>Your Pulses</Text>
        </Pressable>

        <Pressable
          onPress={onAllPulses}
          style={({ pressed }) => [
            styles.hBtnSecondary,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons name="albums" size={18} color="#518649" />
          <Text style={styles.hBtnSecondaryLabel}>All Pulses</Text>
        </Pressable>
      </View>
    </View>
  );

  if (isPrefilling) {
    return (
      <View style={[globalStyles.root, { justifyContent: "center" }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={globalStyles.root}>
      <AppHeader
        variant={3}
        title={isEditMode ? "Editing Pulse" : "Create Pulse"}
      />

      <AppContentGroup
        headerComponents={
          <HeaderComponents
            // @ts-ignore
            onYourPulses={() => navigation.navigate("YourPulses")}
            // @ts-ignore
            onAllPulses={() => navigation.navigate("AllPulses")}
          />
        }
      >
        <View
          style={[
            globalStyles.globalContentBlock,
            globalStyles.globalContentBlockPadding,
          ]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.subtitle}>
                {isEditMode ? "Editing" : "Creating"}
              </Text>
              <Text style={styles.heading}>Pulse</Text>
            </View>
          </View>

          {/* IMAGE SELECTOR (single) */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Photo (optional)</Text>
            {imageUri ? (
              <View style={styles.imageRow}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <Pressable onPress={removeImage} style={styles.linkBtn}>
                  <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  <Text style={styles.linkBtnDangerText}>Remove</Text>
                </Pressable>
                {!imageRemoved && isEditMode && (
                  <Text style={styles.hintText}>
                    Replacing the image will upload a new one.
                  </Text>
                )}
              </View>
            ) : (
              <Pressable onPress={pickImage} style={styles.addImageBtn}>
                <Ionicons name="image" size={18} color={BRAND_GREEN} />
                <Text style={styles.addImageLabel}>Add Image</Text>
              </Pressable>
            )}
          </View>

          {/* CATEGORY PILLS */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pillsRow}>
              <CategoryPill
                label="Alert"
                active={category === "alert"}
                color="#FF3B30"
                onPress={() => setCategory("alert")}
              />
              <CategoryPill
                label="Tip"
                active={category === "tips"}
                color={BRAND_GREEN}
                onPress={() => setCategory("tips")}
              />
              <CategoryPill
                label="Suggestion"
                active={category === "suggestion"}
                color={BRAND_GREEN}
                onPress={() => setCategory("suggestion")}
              />
            </View>
          </View>

          {/* TITLE */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Short, clear summary…"
              maxLength={120}
              style={styles.input}
            />
            <Text style={styles.hintText}>{title.length}/120</Text>
          </View>

          {/* DESCRIPTION */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add helpful details…"
              multiline
              maxLength={2000}
              style={styles.textarea}
            />
            <Text style={styles.hintText}>{description.length}/2000</Text>
          </View>

          {/* ACTIONS */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Ionicons name="close-circle" size={18} color="#6B7280" />
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={savePulse}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && { opacity: 0.95 },
                isSaving && { opacity: 0.7 },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons
                  name={isEditMode ? "save-outline" : "checkmark-circle"}
                  size={18}
                  color="#fff"
                />
              )}
              <Text style={styles.saveLabel}>
                {isEditMode ? "Save Changes" : "Create Pulse"}
              </Text>
            </Pressable>
          </View>
        </View>
      </AppContentGroup>
    </View>
  );
};

export default CreatePulse;

// ─── Small component: Category Pill ───────────────────────────────
const CategoryPill: React.FC<{
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}> = ({ label, active, color, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        active
          ? { backgroundColor: color, borderColor: color }
          : { backgroundColor: "#FFFFFF", borderColor: color },
      ]}
    >
      <Text style={[styles.pillText, { color: active ? "#FFFFFF" : color }]}>
        {label}
      </Text>
    </Pressable>
  );
};

const BRAND_GREEN = "#518649";

const styles = StyleSheet.create({
  // Header area inside AppContentGroup
  headerBlock: {
    alignItems: "flex-start",
    gap: 6,
  },
  headerText: {
    color: "white",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
  },
  headerSub: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginTop: 2,
  },
  headerButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  hBtnSecondary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: BRAND_GREEN,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hBtnSecondaryLabel: {
    color: BRAND_GREEN,
    fontWeight: "800",
    fontSize: 14,
  },

  // Section heading
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "300",
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
  },

  // Form blocks
  fieldBlock: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
    minHeight: 110,
    textAlignVertical: "top",
  },
  hintText: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
  },

  // Image
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  previewImage: {
    width: 120,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  addImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: BRAND_GREEN,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  addImageLabel: {
    color: BRAND_GREEN,
    fontWeight: "800",
    fontSize: 14,
  },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  linkBtnDangerText: {
    color: "#FF3B30",
    fontWeight: "700",
    fontSize: 13,
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  cancelLabel: {
    color: "#6B7280",
    fontWeight: "800",
    fontSize: 14,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: BRAND_GREEN,
  },
  saveLabel: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },

  // Category pills
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
  },
  pillText: {
    fontWeight: "800",
    fontSize: 13,
  },
});
