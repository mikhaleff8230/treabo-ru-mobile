import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, View, type ViewToken } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { fileUrl } from "../../src/api";
import { AppText } from "../ui";
import { colors, radius, sizes, spacing } from "../../src/theme";
import type { Place, PlaceImage, PlaceVideo } from "../../src/types/place";

type FeedMedia = { id: string; kind: "image"; image: PlaceImage } | { id: string; kind: "video"; video: PlaceVideo };
const fallback = require("../../assets/intro-interior.png");

function mediaFor(place: Place): FeedMedia[] {
  const images = place.gallery?.length ? place.gallery : place.cover ? [place.cover] : [];
  const imageMedia: FeedMedia[] = images.map((image, index) => ({ id: `image-${image.id ?? index}`, kind: "image", image }));
  const videoMedia: FeedMedia[] = (place.videos ?? []).slice(0, 1).map((video, index) => ({ id: `video-${video.id ?? index}`, kind: "video", video }));
  return [...imageMedia.slice(0, 5 - videoMedia.length), ...videoMedia];
}

function VideoSlide({ video, width, height, active }: { video: PlaceVideo; width: number; height: number; active: boolean }) {
  const uri = fileUrl(video.url);
  const poster = fileUrl(video.thumbnail || video.poster);
  const player = useVideoPlayer(uri ?? "", (instance) => {
    instance.loop = true;
    instance.muted = true;
  });
  useEffect(() => {
    if (!uri) return;
    if (active) player.play();
    else player.pause();
  }, [active, player, uri]);

  if (!uri || !active) {
    return <Image source={poster ? { uri: poster } : fallback} style={{ width, height }} resizeMode="cover" />;
  }
  return <VideoView player={player} style={{ width, height }} contentFit="cover" nativeControls={false} />;
}

export const PlaceMediaCarousel = memo(function PlaceMediaCarousel({ place, width, visible, onOpen }: { place: Place; width: number; visible: boolean; onOpen: () => void }) {
  const media = useMemo(() => mediaFor(place), [place]);
  const [index, setIndex] = useState(0);
  const height = Math.min(Math.round(width * 0.94), 470);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<FeedMedia>[] }) => {
    const next = viewableItems[0]?.index;
    if (typeof next === "number") setIndex(next);
  }).current;
  const data = media.length ? media : [{ id: "fallback", kind: "image" as const, image: {} }];

  return (
    <View style={[styles.root, { height }]}>
      <FlatList
        horizontal
        pagingEnabled
        data={data}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
        renderItem={({ item, index: mediaIndex }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`Открыть ${place.title}`} onPress={onOpen} style={{ width, height }}>
            {item.kind === "video" ? (
              <VideoSlide video={item.video} width={width} height={height} active={visible && mediaIndex === index} />
            ) : (
              <Image source={fileUrl(item.image.thumbnail || item.image.url) ? { uri: fileUrl(item.image.thumbnail || item.image.url)! } : fallback} style={{ width, height }} resizeMode="cover" resizeMethod="resize" />
            )}
            {item.kind === "video" ? <View style={styles.videoMark}><Ionicons name="play" size={sizes.icon.sm} color={colors.white} /></View> : null}
          </Pressable>
        )}
      />
      {data.length > 1 ? <View style={styles.counter}><AppText variant="meta" style={styles.counterText}>{index + 1}/{data.length}</AppText></View> : null}
      {data.length > 1 ? <View style={styles.dots}>{data.map((item, dotIndex) => <View key={item.id} style={[styles.dot, dotIndex === index && styles.dotActive]} />)}</View> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { backgroundColor: colors.surfaceSecondary },
  counter: { position: "absolute", top: spacing.md, right: spacing.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.overlay },
  counterText: { color: colors.white, fontWeight: "500" },
  videoMark: { position: "absolute", left: spacing.md, top: spacing.md, width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center" },
  dots: { position: "absolute", bottom: spacing.sm, alignSelf: "center", flexDirection: "row", gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.overlay },
  dot: { width: 5, height: 5, borderRadius: radius.full, backgroundColor: colors.textTertiary },
  dotActive: { width: 12, backgroundColor: colors.accent },
});
