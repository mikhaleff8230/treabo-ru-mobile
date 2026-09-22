import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppText, Button, Chip } from "../components/ui";
import { apiFetch, apiUploadFile } from "../src/api";
import { colors, radius, spacing } from "../src/theme";
import { createPlace } from "../src/services/places";
import type { RootStackParamList } from "../src/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Category = { id: string; name_ru?: string; name?: string };
type Work = { id: number; title: string; category_id?: string };
type Picked = { uri: string; kind: "image" | "video"; mime?: string | null; duration?: number | null; width?: number | null; height?: number | null; size?: number | null; uploaded?: string };
type Step = "media" | "details";

function isVideo(asset: ImagePicker.ImagePickerAsset) {
  return asset.type === "video" || Boolean(asset.mimeType?.startsWith("video/"));
}

export default function CreatePlaceScreen() {
  const navigation = useNavigation<Nav>();
  const openedPicker = useRef(false);
  const [step, setStep] = useState<Step>("media");
  const [media, setMedia] = useState<Picked[]>([]);
  const [activeMedia, setActiveMedia] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [workId, setWorkId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Москва");
  const [price, setPrice] = useState("");
  const [hidePrice, setHidePrice] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch("/categories", { method: "GET", auth: false }).then((data) => setCategories(Array.isArray(data) ? data : data?.data || [])).catch(() => setCategories([]));
  }, []);
  useEffect(() => {
    if (!categoryId) { setWorks([]); setWorkId(null); return; }
    apiFetch(`/works?category_id=${encodeURIComponent(categoryId)}`, { method: "GET", auth: false }).then((data) => { const next = Array.isArray(data) ? data : data?.data || []; setWorks(next); setWorkId(next[0]?.id || null); }).catch(() => setWorks([]));
  }, [categoryId]);

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert("Нужен доступ к медиатеке", "Разрешите TREABO выбирать фото и видео работы."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsMultipleSelection: true, selectionLimit: 6, quality: 0.86 });
    if (result.canceled) return;
    setMedia((current) => {
      const known = new Set(current.map((item) => item.uri));
      const next = [...current];
      let imageCount = next.filter((item) => item.kind === "image").length;
      let videoCount = next.filter((item) => item.kind === "video").length;
      result.assets.forEach((asset) => {
        if (known.has(asset.uri)) return;
        const kind = isVideo(asset) ? "video" : "image";
        if ((kind === "image" && imageCount >= 5) || (kind === "video" && videoCount >= 1)) return;
        next.push({ uri: asset.uri, kind, mime: asset.mimeType, duration: asset.duration, width: asset.width, height: asset.height, size: asset.fileSize });
        if (kind === "image") imageCount += 1; else videoCount += 1;
      });
      return next;
    });
  };

  useEffect(() => {
    if (openedPicker.current) return;
    openedPicker.current = true;
    const frame = requestAnimationFrame(() => void pick());
    return () => cancelAnimationFrame(frame);
  }, []);

  const selectedCategory = useMemo(() => categories.find((item) => String(item.id) === categoryId), [categories, categoryId]);
  const selectedWork = works.find((item) => item.id === workId);
  const canContinue = media.length > 0;

  const removeMedia = (index: number) => {
    setMedia((items) => items.filter((_, itemIndex) => itemIndex !== index));
    setActiveMedia((current) => Math.max(0, Math.min(current, media.length - 2)));
  };

  const publish = async (status: "draft" | "published") => {
    if (!title.trim() || !categoryId || !workId || !city.trim()) { Alert.alert("Заполните обязательные поля", "Укажите название, категорию, услугу и город."); return; }
    if (!media.length) { Alert.alert("Добавьте фото или видео работы"); setStep("media"); return; }
    setBusy(true);
    try {
      const images: Array<{ url: string; is_cover: boolean; sort_order: number }> = [];
      const videos: Array<{ url: string; duration?: number | null; width?: number | null; height?: number | null; file_size?: number | null; mime_type?: string | null }> = [];
      for (const [index, item] of media.entries()) {
        const extension = item.kind === "video" ? "mp4" : "jpg";
        const uploaded = item.uploaded ?? (await apiUploadFile(item.uri, item.mime || (item.kind === "video" ? "video/mp4" : "image/jpeg"), `place-${index + 1}.${extension}`)).path;
        if (item.kind === "video") videos.push({ url: uploaded, duration: item.duration ? item.duration / 1000 : null, width: item.width, height: item.height, file_size: item.size, mime_type: item.mime });
        else images.push({ url: uploaded, is_cover: images.length === 0, sort_order: images.length });
      }
      const created = await createPlace({ title: title.trim(), description: description.trim(), category_id: categoryId, work_id: workId, city: city.trim(), price: hidePrice || !price ? null : Number(price), hide_price: hidePrice, status, images, videos });
      if (status === "draft") { Alert.alert("Черновик сохранён"); navigation.goBack(); }
      else navigation.replace("PlacePublished", { placeId: created.id });
    } catch (requestError) {
      Alert.alert("Не удалось сохранить Плейс", requestError instanceof Error ? requestError.message : String(requestError));
    } finally { setBusy(false); }
  };

  return <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.topAction} onPress={() => step === "details" ? setStep("media") : navigation.goBack()}><Ionicons name={step === "details" ? "chevron-back" : "close"} size={24} color={colors.textPrimary} /></TouchableOpacity>
      <View style={styles.topTitle}><AppText variant="section">Создать Плейс</AppText><AppText variant="meta" tone="secondary">{step === "media" ? "До 5 фото и 1 видео" : "Информация о работе"}</AppText></View>
      {step === "media" ? <Button label="Далее" fullWidth={false} disabled={!canContinue} onPress={() => setStep("details")} style={styles.nextButton} /> : <TouchableOpacity style={styles.topAction} onPress={() => void publish("draft")}><Ionicons name="bookmark-outline" size={22} color={colors.textSecondary} /></TouchableOpacity>}
    </View>
    <View style={styles.progress}><View style={[styles.progressPart, styles.progressActive]} /><View style={[styles.progressPart, step === "details" && styles.progressActive]} /></View>
    {step === "media" ? <MediaStep media={media} activeMedia={activeMedia} setActiveMedia={setActiveMedia} onPick={() => void pick()} onRemove={removeMedia} /> : <DetailsStep title={title} setTitle={setTitle} description={description} setDescription={setDescription} categories={categories} categoryId={categoryId} setCategoryId={setCategoryId} selectedCategory={selectedCategory} works={works} workId={workId} setWorkId={setWorkId} selectedWork={selectedWork} city={city} setCity={setCity} price={price} setPrice={setPrice} hidePrice={hidePrice} setHidePrice={setHidePrice} busy={busy} publish={() => void publish("published")} />}
  </SafeAreaView>;
}

function MediaStep({ media, activeMedia, setActiveMedia, onPick, onRemove }: { media: Picked[]; activeMedia: number; setActiveMedia: (index: number) => void; onPick: () => void; onRemove: (index: number) => void }) {
  const active = media[activeMedia];
  if (!active) return <View style={styles.emptyMedia}><View style={styles.emptyIcon}><Ionicons name="images-outline" size={32} color={colors.textPrimary} /></View><AppText variant="screenTitle">Выберите фото и видео</AppText><AppText variant="secondary" tone="secondary" style={styles.center}>Системная медиатека сохранит привычный выбор и порядок файлов.</AppText><Button label="Открыть медиатеку" onPress={onPick} style={styles.libraryButton} /></View>;
  return <ScrollView contentContainerStyle={styles.mediaContent} showsVerticalScrollIndicator={false}>
    <View style={styles.heroMedia}>{active.kind === "image" ? <Image source={{ uri: active.uri }} style={styles.heroImage} /> : <View style={styles.videoPreview}><Ionicons name="play-circle" size={64} color={colors.surface} /><AppText variant="secondary" style={styles.videoText}>Видео {active.duration ? `${Math.round(active.duration / 1000)} сек.` : ""}</AppText></View>}<TouchableOpacity style={styles.removeHero} onPress={() => onRemove(activeMedia)}><Ionicons name="close" size={20} color={colors.surface} /></TouchableOpacity></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbTrack}>{media.map((item, index) => <TouchableOpacity key={item.uri} style={[styles.thumbWrap, index === activeMedia && styles.thumbActive]} onPress={() => setActiveMedia(index)}>{item.kind === "image" ? <Image source={{ uri: item.uri }} style={styles.thumb} /> : <View style={[styles.thumb, styles.videoThumb]}><Ionicons name="play" size={24} color={colors.surface} /></View>}<View style={styles.orderBadge}><AppText variant="meta">{index + 1}</AppText></View></TouchableOpacity>)}{media.length < 6 ? <TouchableOpacity style={styles.addThumb} onPress={onPick}><Ionicons name="add" size={28} color={colors.textSecondary} /><AppText variant="meta" tone="secondary">Добавить</AppText></TouchableOpacity> : null}</ScrollView>
    <View style={styles.mediaHint}><Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} /><AppText variant="secondary" tone="secondary" style={styles.flex}>Первое фото станет обложкой. Выберите миниатюру, чтобы проверить файл.</AppText></View>
  </ScrollView>;
}

type DetailsProps = { title: string; setTitle: (value: string) => void; description: string; setDescription: (value: string) => void; categories: Category[]; categoryId: string; setCategoryId: (value: string) => void; selectedCategory?: Category; works: Work[]; workId: number | null; setWorkId: (value: number) => void; selectedWork?: Work; city: string; setCity: (value: string) => void; price: string; setPrice: (value: string) => void; hidePrice: boolean; setHidePrice: (value: boolean) => void; busy: boolean; publish: () => void };
function DetailsStep(props: DetailsProps) {
  return <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    <Field label="Название работы" counter={`${props.title.length}/100`}><TextInput value={props.title} onChangeText={(value) => props.setTitle(value.slice(0, 100))} placeholder="Например: современная ванная комната" placeholderTextColor={colors.textTertiary} style={styles.input} /></Field>
    <Field label="Описание" counter={`${props.description.length}/500`}><TextInput value={props.description} onChangeText={(value) => props.setDescription(value.slice(0, 500))} placeholder="Расскажите о работе, материалах и особенностях" placeholderTextColor={colors.textTertiary} multiline style={[styles.input, styles.textarea]} /></Field>
    <Field label="Категория"><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>{props.categories.map((item) => <Chip key={String(item.id)} label={item.name_ru || item.name || "Категория"} selected={String(item.id) === props.categoryId} onPress={() => props.setCategoryId(String(item.id))} />)}</ScrollView></Field>
    {props.categoryId ? <Field label="Услуга"><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>{props.works.map((item) => <Chip key={item.id} label={item.title} selected={item.id === props.workId} onPress={() => props.setWorkId(item.id)} />)}</ScrollView></Field> : null}
    <Field label="Цена"><View style={styles.priceRow}><TextInput value={props.price} onChangeText={(value) => props.setPrice(value.replace(/\D/g, ""))} editable={!props.hidePrice} keyboardType="number-pad" placeholder={props.hidePrice ? "Цена по запросу" : "120 000 ₽"} placeholderTextColor={colors.textTertiary} style={[styles.input, styles.flex]} /><View style={styles.hidePrice}><Switch value={props.hidePrice} onValueChange={props.setHidePrice} trackColor={{ false: colors.border, true: colors.accent }} thumbColor={colors.surface} /><AppText variant="meta" tone="secondary">Не показывать</AppText></View></View></Field>
    <Field label="Местоположение"><View style={styles.locationInput}><Ionicons name="location-outline" size={21} color={colors.textPrimary} /><TextInput value={props.city} onChangeText={props.setCity} placeholder="Москва" placeholderTextColor={colors.textTertiary} style={styles.locationText} /></View></Field>
    <View style={styles.summary}><Ionicons name="checkmark-circle-outline" size={22} color={colors.success} /><View style={styles.flex}><AppText variant="bodyMedium">Проверьте данные перед публикацией</AppText><AppText variant="meta" tone="secondary">{props.selectedCategory?.name_ru || props.selectedCategory?.name || "Категория не выбрана"}{props.selectedWork ? ` · ${props.selectedWork.title}` : ""}</AppText></View></View>
    <Button label="Опубликовать" loading={props.busy} onPress={props.publish} style={styles.publishButton} />
  </ScrollView>;
}

function Field({ label, counter, children }: { label: string; counter?: string; children: React.ReactNode }) {
  return <View style={styles.field}><View style={styles.fieldHead}><AppText variant="bodyMedium">{label}</AppText>{counter ? <AppText variant="meta" tone="secondary">{counter}</AppText> : null}</View>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 }, center: { textAlign: "center" },
  topBar: { minHeight: 62, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center" }, topAction: { width: 52, height: 44, alignItems: "center", justifyContent: "center" }, topTitle: { flex: 1, alignItems: "center" }, nextButton: { minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.md },
  progress: { flexDirection: "row", gap: spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm }, progressPart: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfacePressed }, progressActive: { backgroundColor: colors.accentPressed },
  emptyMedia: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl, gap: spacing.md }, emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }, libraryButton: { marginTop: spacing.md },
  mediaContent: { padding: spacing.md, paddingBottom: spacing.xxl }, heroMedia: { aspectRatio: 0.82, borderRadius: radius.xl, overflow: "hidden", backgroundColor: colors.textPrimary }, heroImage: { width: "100%", height: "100%" }, videoPreview: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm }, videoText: { color: colors.surface }, removeHero: { position: "absolute", right: spacing.sm, top: spacing.sm, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,.62)", alignItems: "center", justifyContent: "center" },
  thumbTrack: { gap: spacing.sm, paddingVertical: spacing.md }, thumbWrap: { width: 74, height: 82, borderRadius: radius.md, padding: 2, borderWidth: 2, borderColor: "transparent" }, thumbActive: { borderColor: colors.accentPressed }, thumb: { flex: 1, borderRadius: radius.sm, backgroundColor: colors.surfaceSecondary }, videoThumb: { backgroundColor: colors.textPrimary, alignItems: "center", justifyContent: "center" }, orderBadge: { position: "absolute", left: 5, bottom: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }, addThumb: { width: 74, height: 82, borderRadius: radius.md, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, alignItems: "center", justifyContent: "center" }, mediaHint: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.md },
  form: { padding: spacing.md, paddingBottom: spacing.xxl }, field: { marginBottom: spacing.lg }, fieldHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }, input: { minHeight: 52, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md, color: colors.textPrimary, fontSize: 15 }, textarea: { minHeight: 118, paddingTop: spacing.md, textAlignVertical: "top" }, choices: { gap: spacing.sm, paddingRight: spacing.md }, priceRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm }, hidePrice: { flexDirection: "row", alignItems: "center", gap: 3 }, locationInput: { minHeight: 52, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md }, locationText: { flex: 1, color: colors.textPrimary, fontSize: 15 }, summary: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.accentSoft, borderRadius: radius.lg, padding: spacing.md }, publishButton: { marginTop: spacing.lg },
});
