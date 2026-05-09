import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AppHeader } from "@/components/app-header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTeacherAuth } from "@/lib/teacher-auth";
import { formatClassroomId } from "@/lib/thai-date";
import { trpc } from "@/lib/trpc";
import { TimePickerModal } from "@/components/time-picker-modal";
import {
  scheduleDailyAttendanceReminder,
  cancelAttendanceReminders,
  getScheduledReminders,
  requestNotificationPermission,
} from "@/lib/notifications";

export default function ProfileScreen() {
  const { teacher, setTeacher, logout } = useTeacherAuth();
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyTime, setNotifyTime] = useState(teacher?.notifyTime ?? "07:30");
  const [loadingNotify, setLoadingNotify] = useState(false);
  const [checkingReminders, setCheckingReminders] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Check if reminder is already scheduled
  useEffect(() => {
    if (Platform.OS !== "web") {
      getScheduledReminders().then((reminders) => {
        setNotifyEnabled(reminders.length > 0);
        setCheckingReminders(false);
      });
    } else {
      setCheckingReminders(false);
    }
  }, []);

  const updateTeacherMutation = trpc.updateTeacher.useMutation({
    onSuccess: (_, vars) => {
      if (teacher) {
        setTeacher({
          ...teacher,
          notifyTime: vars.notifyTime ?? teacher.notifyTime,
        });
      }
    },
  });

  const handleToggleNotify = async (val: boolean) => {
    if (Platform.OS === "web") {
      Alert.alert("แจ้งเตือน", "การแจ้งเตือนไม่รองรับบนเว็บ กรุณาใช้แอพบนมือถือ");
      return;
    }
    setLoadingNotify(true);
    try {
      if (val) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert("ไม่ได้รับอนุญาต", "กรุณาเปิดสิทธิ์การแจ้งเตือนในการตั้งค่าของอุปกรณ์");
          setLoadingNotify(false);
          return;
        }
        const [h, m] = notifyTime.split(":").map(Number);
        const id = await scheduleDailyAttendanceReminder(h, m);
        if (id) {
          setNotifyEnabled(true);
          Alert.alert("เปิดการแจ้งเตือนแล้ว", `จะแจ้งเตือนทุกวันเวลา ${notifyTime} น.`);
          // Save notify time to server
          if (teacher) {
            await updateTeacherMutation.mutateAsync({
              id: teacher.id,
              name: teacher.name,
              username: teacher.username,
              role: teacher.role,
              classroomIds: teacher.classroomIds ?? "",
              notifyTime,
            });
          }
        }
      } else {
        await cancelAttendanceReminders();
        setNotifyEnabled(false);
        Alert.alert("ปิดการแจ้งเตือนแล้ว");
      }
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถตั้งค่าการแจ้งเตือนได้");
    }
    setLoadingNotify(false);
  };

  const handleUpdateNotifyTime = async (newTime?: string) => {
    const timeToSave = typeof newTime === "string" ? newTime : notifyTime;
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeToSave)) {
      Alert.alert("รูปแบบเวลาไม่ถูกต้อง", "กรุณาใช้รูปแบบ HH:MM");
      return;
    }
    
    setLoadingNotify(true);
    try {
      if (teacher) {
        await updateTeacherMutation.mutateAsync({
          id: teacher.id,
          name: teacher.name,
          username: teacher.username,
          role: teacher.role,
          classroomIds: teacher.classroomIds || "",
          notifyTime: timeToSave,
        });

        // Re-schedule reminder with new time
        if (notifyEnabled && Platform.OS !== "web") {
          await cancelAttendanceReminders();
          const [h, m] = timeToSave.split(":").map(Number);
          await scheduleDailyAttendanceReminder(h, m);
        }
        
        setNotifyTime(timeToSave);
        Alert.alert("สำเร็จ", "อัปเดตเวลาแจ้งเตือนเรียบร้อยแล้ว");
      }
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถอัปเดตเวลาได้");
    } finally {
      setLoadingNotify(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("ออกจากระบบ", "ต้องการออกจากระบบหรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ออกจากระบบ",
        style: "destructive",
        onPress: async () => {
          if (notifyEnabled && Platform.OS !== "web") {
            await cancelAttendanceReminders();
          }
          await logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="โปรไฟล์" />
      <ScreenContainer edges={[]} className="flex-1">
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{teacher?.name?.charAt(0) ?? "?"}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{teacher?.name}</Text>
              <Text style={styles.profileUsername}>@{teacher?.username}</Text>
              <View style={[styles.roleBadge, teacher?.role === "admin" && styles.roleBadgeAdmin]}>
                <Text style={[styles.roleBadgeText, teacher?.role === "admin" && styles.roleBadgeTextAdmin]}>
                  {teacher?.role === "admin" ? "ผู้ดูแลระบบ" : "ครู"}
                </Text>
              </View>
            </View>
          </View>

          {/* Assigned classrooms */}
          {teacher?.role !== "admin" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ห้องเรียนที่รับผิดชอบ</Text>
              {teacher?.classroomIds ? (
                <View style={styles.roomsRow}>
                  {teacher.classroomIds.split(",").map((r) => r.trim()).filter(Boolean).map((r) => (
                    <View key={r} style={styles.roomChip}>
                      <Text style={styles.roomChipText}>{formatClassroomId(r)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.allRoomsText}>ดูแลทุกห้องเรียน</Text>
              )}
            </View>
          )}

          {/* Notification Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>การแจ้งเตือน</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <IconSymbol name="bell.fill" size={18} color="#F97316" />
                <View>
                  <Text style={styles.settingLabel}>แจ้งเตือนก่อนเช็คชื่อ</Text>
                  <Text style={styles.settingDesc}>แจ้งเตือนทุกวันตามเวลาที่กำหนด</Text>
                </View>
              </View>
              {checkingReminders || loadingNotify ? (
                <ActivityIndicator size="small" color="#F97316" />
              ) : (
                <Switch
                  value={notifyEnabled}
                  onValueChange={handleToggleNotify}
                  trackColor={{ false: "#E5E7EB", true: "#FED7AA" }}
                  thumbColor={notifyEnabled ? "#F97316" : "#9CA3AF"}
                />
              )}
            </View>
            {notifyEnabled && (
              <View style={styles.notifyTimeRow}>
                <Text style={styles.notifyTimeLabel}>เวลาแจ้งเตือน</Text>
                <TouchableOpacity 
                  style={styles.notifyTimeInput}
                  onPress={() => setShowTimePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timeInputText}>{notifyTime}</Text>
                  <IconSymbol name="clock.fill" size={16} color="#F97316" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* App Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>เกี่ยวกับแอพ</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ชื่อแอพ</Text>
              <Text style={styles.infoValue}>ระบบบันทึกกิจกรรมหน้าเสาธง (NKW Student Care)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>เวอร์ชัน</Text>
              <Text style={styles.infoValue}>4.0.0</Text>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <IconSymbol name="arrow.right.square.fill" size={18} color="#DC2626" />
            <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </ScrollView>

        <TimePickerModal
          visible={showTimePicker}
          selectedTime={notifyTime}
          onClose={() => setShowTimePicker(false)}
          onSelect={(time) => {
            handleUpdateNotifyTime(time);
          }}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  profileCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700", color: "#1C1917", marginBottom: 2 },
  profileUsername: { fontSize: 13, color: "#78716C", marginBottom: 6 },
  roleBadge: { alignSelf: "flex-start", backgroundColor: "#F3F4F6", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  roleBadgeAdmin: { backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FED7AA" },
  roleBadgeText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  roleBadgeTextAdmin: { color: "#F97316" },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1C1917", marginBottom: 12 },
  roomsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roomChip: { backgroundColor: "#FFF7ED", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#FED7AA" },
  roomChipText: { fontSize: 13, fontWeight: "600", color: "#F97316" },
  allRoomsText: { fontSize: 13, color: "#78716C" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: "600", color: "#1C1917" },
  settingDesc: { fontSize: 11, color: "#78716C", marginTop: 1 },
  notifyTimeRow: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  notifyTimeLabel: { fontSize: 13, fontWeight: "600", color: "#78716C", marginBottom: 8 },
  notifyTimeInput: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F9FAFB", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  timeInputText: { fontSize: 16, fontWeight: "700", color: "#1C1917" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  infoLabel: { fontSize: 13, color: "#78716C" },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#1C1917" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutButtonText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },
});
