import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../ThemeContext";
import { px } from "../../utils/tokens";
import type { BottomSheetProps } from "./BottomSheet.types";

const CLOSE_VELOCITY_THRESHOLD = 0.5;
const CLOSE_DISTANCE_THRESHOLD = 80;
const HANDLE_AREA_HEIGHT = 28;

function resolveSnapHeight(value: number | string, screenHeight: number): number {
  if (typeof value === "number") return value;
  const pct = parseFloat(value);
  return (pct / 100) * screenHeight;
}

export function BottomSheet({
  visible,
  onClose,
  snapPoints = ["50%", "90%"],
  initialSnapIndex = 0,
  title,
  children,
  showHandle = true,
  closeOnBackdrop = true,
  closeOnSwipeDown = true,
  style,
  testID,
}: BottomSheetProps) {
  const { theme } = useTheme();
  const t = theme.color;

  const screenHeight = Dimensions.get("window").height;
  const resolvedSnaps = snapPoints.map((s) => resolveSnapHeight(s, screenHeight));

  // translateY: 0 = fully visible, positive = sliding off-screen downward
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const currentSnap = useRef(initialSnapIndex);
  const [currentHeight, setCurrentHeight] = useState(resolvedSnaps[initialSnapIndex]);

  const animateTo = useCallback(
    (snapIndex: number, done?: () => void) => {
      const h = resolvedSnaps[snapIndex];
      setCurrentHeight(h);
      currentSnap.current = snapIndex;
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start(done);
    },
    [resolvedSnaps, translateY],
  );

  const animateClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [backdropOpacity, onClose, screenHeight, translateY]);

  useEffect(() => {
    if (visible) {
      const h = resolvedSnaps[initialSnapIndex];
      setCurrentHeight(h);
      currentSnap.current = initialSnapIndex;
      translateY.setValue(screenHeight);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 4,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 4,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          // only allow downward drag
          translateY.setValue(gs.dy);
        } else {
          // upward drag: try to go to next snap
          translateY.setValue(gs.dy * 0.15);
        }
      },
      onPanResponderRelease: (_, gs) => {
        const dy = gs.dy;
        const vy = gs.vy;

        if (
          closeOnSwipeDown &&
          (vy > CLOSE_VELOCITY_THRESHOLD || dy > CLOSE_DISTANCE_THRESHOLD)
        ) {
          const snapIdx = currentSnap.current;
          if (snapIdx === 0) {
            // At smallest snap — close
            animateClose();
            return;
          }
          // Snap to previous (smaller) point
          animateTo(snapIdx - 1);
          return;
        }

        if (dy < -CLOSE_DISTANCE_THRESHOLD / 2) {
          // Upward drag — go to next snap point if available
          const snapIdx = currentSnap.current;
          if (snapIdx < resolvedSnaps.length - 1) {
            animateTo(snapIdx + 1);
            return;
          }
        }

        // Spring back to current position
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      },
    }),
  ).current;

  const sheetBg = t.surface.raised;
  const borderRadius = px(theme.radius["2xl"]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={animateClose}
      statusBarTranslucent
    >
      {/* Backdrop — outer View always opacity:1 so RNTL can query it; animated overlay is a child */}
      <View
        style={styles.backdrop}
        testID={testID ? `${testID}-backdrop` : undefined}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: t.surface.overlay, opacity: backdropOpacity }]}
          pointerEvents="none"
        />
        {closeOnBackdrop && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={animateClose}
            accessibilityLabel="Close sheet"
          />
        )}
      </View>

      {/* Sheet panel */}
      <Animated.View
        testID={testID}
        style={[
          styles.sheet,
          {
            height: currentHeight,
            backgroundColor: sheetBg,
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            transform: [{ translateY }],
          },
          style,
        ]}
        {...panResponder.panHandlers}
        accessibilityViewIsModal
      >
        {showHandle && (
          <View
            style={[styles.handleArea]}
            testID={testID ? `${testID}-handle-area` : undefined}
          >
            <View
              style={[styles.handle, { backgroundColor: t.border.subtle }]}
              testID={testID ? `${testID}-handle` : undefined}
              accessibilityLabel="Drag handle"
            />
          </View>
        )}

        {title != null && (
          <Text
            style={[
              styles.title,
              {
                color: t.text.primary,
                fontSize: px(theme["font-size"]["300"]),
                paddingHorizontal: px(theme.space["4"]),
                paddingBottom: px(theme.space["3"]),
                fontWeight: "600",
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}

        <View style={styles.content}>{children}</View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  handleArea: {
    height: HANDLE_AREA_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  title: {
    lineHeight: 28,
  },
  content: {
    flex: 1,
  },
});
