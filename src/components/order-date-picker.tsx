import { Ionicons } from '@expo/vector-icons';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { value: string; onChange: (value: string) => void; color: string; surface: string; border: string; isDark: boolean };

export default function OrderDatePicker({ value, onChange, color, surface, border, isDark }: Props) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(`${value}T12:00:00`) : new Date();

  return (
    <View style={styles.container}>
      <Pressable accessibilityRole="button" onPress={() => setOpen((current) => !current)} style={[styles.button, { backgroundColor: surface, borderColor: border }]}>
        <Ionicons name="calendar-outline" size={18} color="#8055D8" />
        <Text style={[styles.value, { color }]}>{value || 'Choose a date'}</Text>
        <Ionicons name="chevron-down" size={16} color="#8E8797" />
      </Pressable>
      {open ? <View style={[styles.picker, { backgroundColor: surface, borderColor: border }]}>
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          presentation={Platform.OS === 'android' ? 'dialog' : 'inline'}
          themeVariant={isDark ? 'dark' : 'light'}
          accentColor="#8055D8"
          onValueChange={(_event, selectedDate) => {
            onChange(toLocalDate(selectedDate));
            if (Platform.OS === 'android') setOpen(false);
          }}
          onDismiss={() => setOpen(false)}
        />
        {Platform.OS === 'ios' ? <Pressable onPress={() => setOpen(false)} style={styles.done}><Text style={styles.doneText}>Done</Text></Pressable> : null}
      </View> : null}
    </View>
  );
}

function toLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { marginBottom: 13 },
  button: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  value: { flex: 1, fontSize: 14 },
  picker: { marginTop: 8, borderWidth: 1, borderRadius: 13, padding: 8, alignItems: 'center' },
  done: { alignSelf: 'flex-end', paddingHorizontal: 13, paddingVertical: 9 },
  doneText: { color: '#8055D8', fontWeight: '800' },
});
