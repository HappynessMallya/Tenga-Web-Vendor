import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../styles/theme';

interface DividerProps {
  text?: string;
  style?: any;
}

export const Divider: React.FC<DividerProps> = ({ text, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.line} />
      {text && (
        <View style={styles.textContainer}>
          <Text style={styles.text}>{text}</Text>
        </View>
      )}
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#9CA3AF',
  },
  textContainer: {
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: theme.typography.fontFamily,
    fontWeight: '500',
  },
});
