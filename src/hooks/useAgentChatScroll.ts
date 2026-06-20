/**
 * Smart auto-scroll for the Agent chat timeline.
 * Scrolls to latest when the user is near the bottom; shows jump control otherwise.
 */

import { useCallback, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const NEAR_BOTTOM_THRESHOLD = 140;

export function useAgentChatScroll(messageCount: number) {
  const listRef = useRef<FlatList>(null);
  const isNearBottomRef = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const scrollToLatest = useCallback(
    (animated = true) => {
      if (messageCount === 0) return;
      listRef.current?.scrollToEnd({ animated });
      isNearBottomRef.current = true;
      setShowJumpToLatest(false);
    },
    [messageCount]
  );

  const prepareForOutgoingMessage = useCallback(() => {
    isNearBottomRef.current = true;
    setShowJumpToLatest(false);
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const visibleBottom = contentOffset.y + layoutMeasurement.height;
      const distanceFromBottom = contentSize.height - visibleBottom;
      const nearBottom = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD;
      isNearBottomRef.current = nearBottom;
      if (messageCount > 0) {
        setShowJumpToLatest(!nearBottom);
      }
    },
    [messageCount]
  );

  const onContentSizeChange = useCallback(() => {
    if (isNearBottomRef.current && messageCount > 0) {
      requestAnimationFrame(() => scrollToLatest(false));
    }
  }, [messageCount, scrollToLatest]);

  const notifyNewContent = useCallback(() => {
    if (messageCount === 0) return;
    if (isNearBottomRef.current) {
      requestAnimationFrame(() => scrollToLatest(true));
    } else {
      setShowJumpToLatest(true);
    }
  }, [messageCount, scrollToLatest]);

  const stickToLatest = useCallback(() => {
    prepareForOutgoingMessage();
    requestAnimationFrame(() => scrollToLatest(true));
  }, [prepareForOutgoingMessage, scrollToLatest]);

  return {
    listRef,
    showJumpToLatest,
    handleScroll,
    onContentSizeChange,
    notifyNewContent,
    stickToLatest,
    prepareForOutgoingMessage,
    scrollToLatest,
  };
}
