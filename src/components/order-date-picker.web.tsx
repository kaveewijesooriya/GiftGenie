import { Ionicons } from '@expo/vector-icons';
import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = { value: string; onChange: (value: string) => void; color: string; surface: string; border: string; isDark: boolean };

export default function OrderDatePicker({ value, onChange, color, surface, border, isDark }: Props) {
  return (
    <View style={[styles.field, { backgroundColor: surface, borderColor: border }]}>
      <Ionicons name="calendar-outline" size={18} color="#8055D8" />
      {createElement('input', {
        type: 'date',
        value,
        onChange: (event: { currentTarget: { value: string } }) => onChange(event.currentTarget.value),
        'aria-label': 'Due date',
        style: {
          flex: 1,
          minWidth: 0,
          height: 42,
          border: 0,
          outline: 'none',
          background: 'transparent',
          color,
          colorScheme: isDark ? 'dark' : 'light',
          fontSize: 14,
          fontFamily: 'inherit',
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 13 },
});
