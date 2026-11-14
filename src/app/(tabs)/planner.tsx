
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

import { gifts } from '@/data/gifts';
import { Colors } from '@/constants/theme';

type GiftPlan = {
  id: string;
  recipientName: string;
  recipient: string;
  occasion: string;
  eventDate: string;
  budget: string;
};

const STORAGE_KEY = '@giftgenie_plans';

const recipients = [
  'Mother',
  'Father',
  'Sister',
  'Brother',
  'Friend',
  'Partner',
  'Child',
  'Colleague',
];

const occasions = [
  'Birthday',
  'Anniversary',
  'Wedding',
  'Graduation',
  'Christmas',
  'Valentines Day',
  'Other',
];

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export default function PlannerScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const isDark = scheme === 'dark';

  const [recipientName, setRecipientName] = useState('');
  const [recipient, setRecipient] = useState('');
  const [occasion, setOccasion] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [budget, setBudget] = useState('');

  const [plans, setPlans] = useState<GiftPlan[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const savedPlans = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedPlans) {
          const parsed: unknown = JSON.parse(savedPlans);

          if (Array.isArray(parsed)) {
            setPlans(parsed as GiftPlan[]);
          }
        }
      } catch {
        Alert.alert('Error', 'Could not load saved gift plans.');
      } finally {
        setIsLoaded(true);
      }
    };

    loadPlans();
  }, []);

  const suggestedGifts = useMemo(() => {
    const numericBudget = Number(budget);

    if (!recipient || !occasion || !budget || numericBudget <= 0) {
      return [];
    }

    return gifts.filter(
      (gift) =>
        gift.recipients.includes(recipient) &&
        gift.occasions.includes(occasion) &&
        gift.price <= numericBudget
    );
  }, [recipient, occasion, budget]);

  const selectRecipient = (item: string) => {
    setRecipient(item);
    setRecipientName(item);
  };

  const resetForm = () => {
    setRecipientName('');
    setRecipient('');
    setOccasion('');
    setEventDate('');
    setBudget('');
  };

  const savePlan = async () => {
    if (isSaving || !isLoaded) return;

    if (
      !recipientName.trim() ||
      !recipient ||
      !occasion ||
      !eventDate.trim() ||
      !budget.trim()
    ) {
      Alert.alert('Missing Details', 'Please complete all the fields.');
      return;
    }

    const selectedDate = parseLocalDate(eventDate.trim());

    if (!selectedDate) {
      Alert.alert(
        'Invalid Date',
        'Please enter the date in YYYY-MM-DD format.'
      );
      return;
    }

    const numericBudget = Number(budget);

    if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid budget.');
      return;
    }

    setIsSaving(true);

    try {
      const newPlan: GiftPlan = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        recipientName: recipientName.trim(),
        recipient,
        occasion,
        eventDate: eventDate.trim(),
        budget: String(numericBudget),
      };

      const updatedPlans = [newPlan, ...plans];

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedPlans)
      );

      setPlans(updatedPlans);
      resetForm();

      Alert.alert('Success!', 'Your gift plan has been saved.');
    } catch {
      Alert.alert('Save Failed', 'Could not save your gift plan. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePlan = async (id: string) => {
    const updatedPlans = plans.filter((plan) => plan.id !== id);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedPlans)
      );

      setPlans(updatedPlans);
    } catch {
      Alert.alert('Error', 'Could not delete this gift plan.');
    }
  };

  const backgroundColor = colors.background;
  const cardColor = isDark ? '#252238' : '#F7F3FF';
  const textColor = colors.text;
  const mutedColor = isDark ? '#B8B3C7' : '#777080';
  const purple = '#8055D8';
  const borderColor = isDark ? '#49435B' : '#E5DDF2';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: textColor }]}>
        Gift Planner 🎁
      </Text>

      <Text style={[styles.subtitle, { color: mutedColor }]}>
        Plan thoughtful gifts for your special people.
      </Text>

      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Create a Gift Plan
        </Text>

        <Text style={[styles.label, { color: textColor }]}>
          Recipient Name
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              color: textColor,
              borderColor,
              backgroundColor,
            },
          ]}
          placeholder="Enter recipient name"
          placeholderTextColor={mutedColor}
          value={recipientName}
          onChangeText={setRecipientName}
        />

        <Text style={[styles.label, { color: textColor }]}>
          Select Recipient
        </Text>

        <View style={styles.chipContainer}>
          {recipients.map((item) => {
            const selected = recipient === item;

            return (
              <Pressable
                key={item}
                onPress={() => selectRecipient(item)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? purple : backgroundColor,
                    borderColor: selected ? purple : borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selected ? '#FFFFFF' : textColor },
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: textColor }]}>
          Occasion
        </Text>

        <View style={styles.chipContainer}>
          {occasions.map((item) => {
            const selected = occasion === item;

            return (
              <Pressable
                key={item}
                onPress={() => setOccasion(item)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? purple : backgroundColor,
                    borderColor: selected ? purple : borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selected ? '#FFFFFF' : textColor },
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: textColor }]}>
          Event Date
        </Text>

        <View style={styles.dateRow}>
          <TextInput
            style={[
              styles.input,
              styles.dateInput,
              {
                color: textColor,
                borderColor,
                backgroundColor,
              },
            ]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={mutedColor}
            value={eventDate}
            onChangeText={setEventDate}
            keyboardType="numbers-and-punctuation"
          />

          <Pressable
            style={[styles.dateButton, { backgroundColor: purple }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>📅 Select</Text>
          </Pressable>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={parseLocalDate(eventDate) ?? new Date()}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);

              if (event.type === 'set' && selectedDate) {
                setEventDate(formatLocalDate(selectedDate));
              }
            }}
          />
        )}

        <Text style={[styles.label, { color: textColor }]}>
          Maximum Budget (LKR)
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              color: textColor,
              borderColor,
              backgroundColor,
            },
          ]}
          placeholder="Enter your budget"
          placeholderTextColor={mutedColor}
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
        />

        <Pressable
          onPress={savePlan}
          disabled={!isLoaded || isSaving}
          style={[
            styles.saveButton,
            {
              backgroundColor: purple,
              opacity: !isLoaded || isSaving ? 0.6 : 1,
            },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {!isLoaded ? 'Loading...' : 'Save Gift Plan'}
            </Text>
          )}
        </Pressable>
      </View>

      {recipient && occasion && Number(budget) > 0 && (
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Suggested Gifts 🎁
          </Text>

          {suggestedGifts.length > 0 ? (
            suggestedGifts.map((gift) => (
              <View
                key={gift.id}
                style={[
                  styles.giftItem,
                  { borderBottomColor: borderColor },
                ]}
              >
                <Text style={[styles.giftName, { color: textColor }]}>
                  {gift.emoji} {gift.name}
                </Text>

                <Text style={[styles.giftDescription, { color: mutedColor }]}>
                  {gift.description}
                </Text>

                <Text style={[styles.giftPrice, { color: purple }]}>
                  LKR {gift.price.toLocaleString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: mutedColor }]}>
              No matching gifts found within this budget.
            </Text>
          )}
        </View>
      )}

      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          My Saved Plans ({plans.length})
        </Text>

        {!isLoaded ? (
          <ActivityIndicator color={purple} />
        ) : plans.length === 0 ? (
          <Text style={[styles.emptyText, { color: mutedColor }]}>
            No saved plans yet. Create your first gift plan above!
          </Text>
        ) : (
          plans.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.planItem,
                { borderBottomColor: borderColor },
              ]}
            >
              <View style={styles.planDetails}>
                <Text style={[styles.planName, { color: textColor }]}>
                  🎁 {plan.recipientName}
                </Text>

                <Text style={[styles.planInfo, { color: mutedColor }]}>
                  {plan.recipient} • {plan.occasion}
                </Text>

                <Text style={[styles.planInfo, { color: mutedColor }]}>
                  📅 {plan.eventDate}
                </Text>

                <Text style={[styles.planBudget, { color: purple }]}>
                  Budget: LKR {Number(plan.budget).toLocaleString()}
                </Text>
              </View>

              <Pressable
                onPress={() => deletePlan(plan.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 35,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 13,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 13,
    fontSize: 14,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginBottom: 3,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  dateInput: {
    flex: 1,
  },
  dateButton: {
    height: 48,
    paddingHorizontal: 13,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  saveButton: {
    height: 50,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  giftItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  giftName: {
    fontSize: 15,
    fontWeight: '700',
  },
  giftDescription: {
    fontSize: 12,
    marginTop: 5,
  },
  giftPrice: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 7,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  planDetails: {
    flex: 1,
    paddingRight: 10,
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
  },
  planInfo: {
    fontSize: 12,
    marginTop: 5,
  },
  planBudget: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
  },
  deleteButton: {
    backgroundColor: '#FCE8E8',
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  deleteText: {
    color: '#D93636',
    fontSize: 12,
    fontWeight: '700',
  },
});
