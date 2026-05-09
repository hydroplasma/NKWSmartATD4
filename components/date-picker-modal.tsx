import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const THAI_DAYS_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  onClose: () => void;
  maxDate?: string; // YYYY-MM-DD, defaults to today
}

export function DatePickerModal({ visible, selectedDate, onSelect, onClose, maxDate }: DatePickerModalProps) {
  const today = new Date();
  const maxD = maxDate ? new Date(maxDate + "T00:00:00") : today;

  const [viewYear, setViewYear] = useState(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return d.getMonth();
  });

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedParts = selectedDate.split("-");
  const selYear = parseInt(selectedParts[0]);
  const selMonth = parseInt(selectedParts[1]) - 1;
  const selDay = parseInt(selectedParts[2]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    const nextDate = new Date(viewYear, viewMonth + 1, 1);
    if (nextDate > maxD) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const isNextDisabled = () => {
    const nextDate = new Date(viewYear, viewMonth + 1, 1);
    return nextDate > maxD;
  };

  const handleDayPress = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const d = new Date(dateStr + "T00:00:00");
    if (d > maxD) return;
    onSelect(dateStr);
    onClose();
  };

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    return d > maxD;
  };

  const isSelected = (day: number) =>
    viewYear === selYear && viewMonth === selMonth && day === selDay;

  const isToday = (day: number) =>
    viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
              <IconSymbol name="chevron.left" size={20} color="#F97316" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {THAI_MONTHS[viewMonth]} {viewYear + 543}
            </Text>
            <TouchableOpacity
              style={[styles.navBtn, isNextDisabled() && styles.navBtnDisabled]}
              onPress={nextMonth}
              disabled={isNextDisabled()}
            >
              <IconSymbol name="chevron.right" size={20} color={isNextDisabled() ? "#D1D5DB" : "#F97316"} />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {THAI_DAYS_SHORT.map((d) => (
              <Text key={d} style={[styles.dayHeader, d === "อา" && styles.sundayText]}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (day === null) return <View key={`empty-${idx}`} style={styles.cell} />;
              const disabled = isDisabled(day);
              const selected = isSelected(day);
              const todayCell = isToday(day);
              const isSunday = (idx % 7) === 0;
              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.cell,
                    selected && styles.selectedCell,
                    todayCell && !selected && styles.todayCell,
                  ]}
                  onPress={() => !disabled && handleDayPress(day)}
                  disabled={disabled}
                >
                  <Text style={[
                    styles.dayText,
                    selected && styles.selectedDayText,
                    todayCell && !selected && styles.todayDayText,
                    disabled && styles.disabledDayText,
                    isSunday && !selected && !disabled && styles.sundayText,
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Today button */}
          <TouchableOpacity
            style={styles.todayButton}
            onPress={() => {
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              setViewYear(today.getFullYear());
              setViewMonth(today.getMonth());
              onSelect(todayStr);
              onClose();
            }}
          >
            <Text style={styles.todayButtonText}>วันนี้</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnDisabled: {
    backgroundColor: "#F3F4F6",
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1917",
  },
  dayHeaders: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#78716C",
    paddingVertical: 4,
  },
  sundayText: {
    color: "#DC2626",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCell: {
    backgroundColor: "#F97316",
    borderRadius: 20,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: "#F97316",
    borderRadius: 20,
  },
  dayText: {
    fontSize: 14,
    color: "#1C1917",
    fontWeight: "500",
  },
  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  todayDayText: {
    color: "#F97316",
    fontWeight: "700",
  },
  disabledDayText: {
    color: "#D1D5DB",
  },
  todayButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
  },
  todayButtonText: {
    color: "#F97316",
    fontWeight: "700",
    fontSize: 14,
  },
});
