import React from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Mic, Send } from "lucide-react-native";
import { theme, healthColors } from '@/theme';

const ChatComposer = ({
  value,
  onChangeText,
  onSend,
  onVoicePress,
  sending = false,
  sendDisabled = false,
  placeholder = "Type a message...",
  maxLength = 500,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={healthColors.text.disabled}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={maxLength}
          accessibilityLabel="Chat message input"
          accessibilityHint="Type your message for the health assistant"
        />
        <TouchableOpacity
          style={styles.micButton}
          onPress={onVoicePress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Voice input"
          accessibilityHint="Opens voice input"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Mic size={theme.iconSizes.md} color={healthColors.text.secondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.sendButton, sendDisabled && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={sendDisabled}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityHint="Sends your chat message"
      >
        {sending ? (
          <ActivityIndicator size="small" color={healthColors.text.white} />
        ) : (
          <Send size={theme.iconSizes.sm} color={healthColors.text.white} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + theme.spacing.xs,
    backgroundColor: healthColors.background.card,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: healthColors.background.secondary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: theme.touchTargets.md,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    maxHeight: 100,
    paddingVertical: theme.spacing.xs,
  },
  micButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  sendButton: {
    width: theme.touchTargets.lg - theme.spacing.xs,
    height: theme.touchTargets.lg - theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: healthColors.primary.main,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.md,
  },
  sendButtonDisabled: {
    backgroundColor: healthColors.text.disabled,
  },
});

export default ChatComposer;
