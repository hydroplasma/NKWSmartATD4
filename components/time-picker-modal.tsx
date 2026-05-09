import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface TimePickerModalProps {
  visible: boolean;
  selectedTime: string; // HH:MM
  onSelect: (time: string) => void;
  onClose: () => void;
}

export function TimePickerModal({ visible, selectedTime, onSelect, onClose }: TimePickerModalProps) {
  const parts = selectedTime.split(":");
  const initialHour = parseInt(parts[0]) || 0;
  const initialMinute = parseInt(parts[1]) || 0;

  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleConfirm = () => {
    const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    onSelect(timeStr);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          <Text style={styles.title}>เลือกเวลา</Text>
          
          <View style={styles.pickerContainer}>
            {/* Hours */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>ชั่วโมง</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {hours.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.item, hour === h && styles.selectedItem]}
                    onPress={() => setHour(h)}
                  >
                    <Text style={[styles.itemText, hour === h && styles.selectedItemText]}>
                      {String(h).padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.separator}>:</Text>

            {/* Minutes */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>นาที</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {minutes.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.item, minute === m && styles.selectedItem]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[styles.itemText, minute === m && styles.selectedItemText]}>
                      {String(m).padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
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
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "80%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1917",
    marginBottom: 20,
    textAlign: "center",
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 200,
    marginBottom: 20,
  },
  column: {
    flex: 1,
    height: "100%",
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#78716C",
    textAlign: "center",
    marginBottom: 8,
  },
  scrollContent: {
    paddingVertical: 10,
  },
  item: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  selectedItem: {
    backgroundColor: "#FFF7ED",
  },
  itemText: {
    fontSize: 20,
    color: "#44403C",
    fontWeight: "500",
  },
  selectedItemText: {
    color: "#F97316",
    fontWeight: "700",
  },
  separator: {
    fontSize: 24,
    fontWeight: "700",
    color: "#D6D3D1",
    paddingHorizontal: 10,
    marginTop: 20,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F5F5F4",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#78716C",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F97316",
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
