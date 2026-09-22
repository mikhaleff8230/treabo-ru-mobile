import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AudioSession, LiveKitRoom, VideoTrack, isTrackReference, useLocalParticipant, useTracks } from "@livekit/react-native";
import { Track } from "livekit-client";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../src/navigation/types";
import { colors, spacing, typography } from "../src/theme";
import { fileUrl } from "../src/api";
import { getConversation, type MessengerConversation } from "../src/services/messenger";
import { liveKitCallProvider, type MessengerCall } from "../src/services/calls";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "MessengerCall">;

function VideoStage({ name }: { name: string }) {
  const tracks = useTracks([Track.Source.Camera]);
  const remote = tracks.find((item) => isTrackReference(item) && !item.participant.isLocal);
  const local = tracks.find((item) => isTrackReference(item) && item.participant.isLocal);
  return (
    <View style={styles.videoStage}>
      {remote && isTrackReference(remote) ? <VideoTrack trackRef={remote} style={styles.remoteVideo} objectFit="cover" /> : <View style={styles.videoWaiting}><Ionicons name="videocam-outline" size={52} color={colors.white} /><Text style={styles.waitingText}>Ожидаем {name}</Text></View>}
      {local && isTrackReference(local) ? <VideoTrack trackRef={local} style={styles.localVideo} objectFit="cover" mirror zOrder={1} /> : null}
    </View>
  );
}

function MediaControls({ mode, onEnd }: { mode: "audio" | "video"; onEnd: () => void }) {
  const { localParticipant } = useLocalParticipant();
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(mode === "video");
  const toggleMic = async () => { const next = !mic; setMic(next); await localParticipant.setMicrophoneEnabled(next); };
  const toggleCamera = async () => { const next = !camera; setCamera(next); await localParticipant.setCameraEnabled(next); };
  return (
    <View style={styles.controls}>
      <Control icon={mic ? "mic" : "mic-off"} label="Микрофон" active={mic} onPress={() => void toggleMic()} />
      {mode === "video" ? <Control icon={camera ? "videocam" : "videocam-off"} label="Камера" active={camera} onPress={() => void toggleCamera()} /> : <Control icon="volume-high" label="Динамик" active />}
      <Control icon="call" label="Завершить" danger onPress={onEnd} />
    </View>
  );
}

function Control({ icon, label, active, danger, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean; danger?: boolean; onPress?: () => void }) {
  return <TouchableOpacity style={styles.control} onPress={onPress}><View style={[styles.controlCircle, active && styles.controlActive, danger && styles.controlDanger]}><Ionicons name={icon} size={27} color={colors.white} /></View><Text style={styles.controlLabel}>{label}</Text></TouchableOpacity>;
}

export default function MessengerCallScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { conversationId, mode, callId } = route.params;
  const [conversation, setConversation] = useState<MessengerConversation | null>(null);
  const [call, setCall] = useState<MessengerCall | null>(null);
  const [error, setError] = useState<string | null>(null);
  const contact = conversation?.contact!;
  const avatar = useMemo(() => fileUrl(contact?.avatar), [contact?.avatar]);

  useEffect(() => {
    let active = true;
    void AudioSession.startAudioSession();
    Promise.all([
      getConversation(conversationId),
      callId ? liveKitCallProvider.get(callId).then((value) => value.status === "ringing" ? liveKitCallProvider.accept(value.id) : value) : liveKitCallProvider.start(conversationId, mode),
    ]).then(([chat, current]) => { if (active) { setConversation(chat); setCall(current); } }).catch((reason) => active && setError(reason instanceof Error ? reason.message : "Не удалось начать звонок"));
    return () => { active = false; void AudioSession.stopAudioSession(); };
  }, [callId, conversationId, mode]);

  const end = async () => {
    if (call) await liveKitCallProvider.end(call.id).catch(() => undefined);
    navigation.goBack();
  };

  if (error) return <SafeAreaView style={styles.root}><View style={styles.center}><Ionicons name="call-outline" size={58} color={colors.white} /><Text style={styles.error}>{error}</Text><TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}><Text style={styles.closeText}>Закрыть</Text></TouchableOpacity></View></SafeAreaView>;
  if (!call || !conversation) return <SafeAreaView style={styles.root}><View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /><Text style={styles.connecting}>Соединяем…</Text></View></SafeAreaView>;

  return (
    <LiveKitRoom serverUrl={call.server_url} token={call.token} connect audio video={mode === "video"} onError={(reason) => setError(reason.message)}>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        {mode === "video" ? <VideoStage name={contact.name} /> : <View style={styles.audioStage}>{avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarLetter}>{contact.name?.charAt(0)}</Text></View>}<Text style={styles.name}>{contact.name}</Text><Text style={styles.status}>{call.status === "accepted" ? "Разговор" : "Вызов…"}</Text></View>}
        <View style={styles.top}><TouchableOpacity style={styles.back} onPress={() => void end()}><Ionicons name="chevron-back" size={28} color={colors.white} /></TouchableOpacity><Text style={styles.timer}>{mode === "video" ? "Видеозвонок" : "Аудиозвонок"}</Text><View style={styles.back} /></View>
        <MediaControls mode={mode} onEnd={() => void end()} />
      </SafeAreaView>
    </LiveKitRoom>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#171717" }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }, connecting: { ...typography.body, color: colors.white, marginTop: spacing.md }, error: { ...typography.body, color: colors.white, textAlign: "center", marginTop: spacing.lg }, closeButton: { marginTop: spacing.xl, backgroundColor: colors.white, borderRadius: 999, paddingHorizontal: spacing.xl, paddingVertical: spacing.md }, closeText: { ...typography.button }, top: { position: "absolute", left: 0, right: 0, top: 0, height: 74, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { width: 48, height: 48, alignItems: "center", justifyContent: "center" }, timer: { ...typography.secondary, color: colors.white }, audioStage: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 100 }, avatar: { width: 150, height: 150, borderRadius: 75, backgroundColor: "#323232" }, avatarFallback: { alignItems: "center", justifyContent: "center" }, avatarLetter: { fontSize: 58, color: colors.white, fontWeight: "500" }, name: { ...typography.screenTitle, color: colors.white, marginTop: spacing.xl }, status: { ...typography.body, color: "rgba(255,255,255,.7)", marginTop: spacing.xs }, videoStage: { ...StyleSheet.absoluteFillObject }, remoteVideo: { flex: 1 }, localVideo: { position: "absolute", right: spacing.md, top: 82, width: 110, height: 156, borderRadius: 16, overflow: "hidden" }, videoWaiting: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md }, waitingText: { ...typography.body, color: colors.white }, controls: { position: "absolute", left: spacing.lg, right: spacing.lg, bottom: 32, flexDirection: "row", justifyContent: "space-around", alignItems: "center" }, control: { alignItems: "center", width: 92 }, controlCircle: { width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.18)" }, controlActive: { backgroundColor: "rgba(255,255,255,.28)" }, controlDanger: { backgroundColor: colors.danger }, controlLabel: { ...typography.meta, color: colors.white, marginTop: spacing.sm },
});
