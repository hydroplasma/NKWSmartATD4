import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AppHeader } from "@/components/app-header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useTeacherAuth } from "@/lib/teacher-auth";
import { formatDateForApi, toThaiDateShort, toThaiDateWithDay, formatClassroomId } from "@/lib/thai-date";
import { DatePickerModal } from "@/components/date-picker-modal";
import { generateClassroomReportHtml, exportPdfAndShare } from "@/lib/pdf-export";
import type { StudentAttendanceEntry } from "@/shared/types";

const STATUS_OPTIONS = [
  { label: "มา", color: "#16A34A", bg: "#DCFCE7" },
  { label: "ขาด", color: "#DC2626", bg: "#FEE2E2" },
  { label: "สาย", color: "#CA8A04", bg: "#FEF9C3" },
  { label: "ลา", color: "#2563EB", bg: "#DBEAFE" },
  { label: "ป่วย", color: "#9333EA", bg: "#F3E8FF" },
];

export default function ClassroomSummaryScreen() {
  const { teacher } = useTeacherAuth();
  const [selectedDate, setSelectedDate] = useState(formatDateForApi(new Date()));
  const [selectedPeriod, setSelectedPeriod] = useState("morning");
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [showClassroomPicker, setShowClassroomPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: classrooms = [] } = trpc.classrooms.useQuery();
  const { data: periods = [] } = trpc.periods.useQuery();

  const allowedRooms = teacher?.role !== "admin" && teacher?.classroomIds
    ? teacher.classroomIds.split(",").map((r) => r.trim()).filter(Boolean)
    : null;
  const visibleClassrooms = allowedRooms
    ? classrooms.filter((c) => allowedRooms.includes(c.id))
    : classrooms;

  const currentClassroom = visibleClassrooms.find((c) => c.id === selectedClassroom);

  const { data: students = [] } = trpc.studentsByClassroom.useQuery(
    { classroomId: selectedClassroom ?? "" },
    { enabled: !!selectedClassroom }
  );

  const { data: attendanceRecord, isLoading } = trpc.getAttendance.useQuery(
    {
      date: selectedDate,
      period: selectedPeriod,
      roomId: selectedClassroom ?? "",
    },
    { enabled: !!selectedClassroom && !!selectedDate && !!selectedPeriod }
  );

  const activePeriods = periods.filter((p) => p.status === 1);

  const attendanceMap = React.useMemo(() => {
    if (!attendanceRecord) return {};
    const entries = attendanceRecord.students as StudentAttendanceEntry[];
    const map: Record<string, StudentAttendanceEntry> = {};
    for (const e of entries) {
      map[e.student_id] = e;
    }
    return map;
  }, [attendanceRecord]);

  const summary = React.useMemo(() => {
    if (!attendanceRecord) return null;
    const entries = attendanceRecord.students as StudentAttendanceEntry[];
    const counts = { มา: 0, ขาด: 0, สาย: 0, ลา: 0, ป่วย: 0 };
    for (const e of entries) {
      if (e.status in counts) counts[e.status as keyof typeof counts]++;
    }
    return { total: entries.length, ...counts };
  }, [attendanceRecord]);

  const getStatusStyle = (status: string) =>
    STATUS_OPTIONS.find((s) => s.label === status) ?? STATUS_OPTIONS[0];

  const handleExportPdf = async () => {
    if (!attendanceRecord || !summary || !selectedClassroom) return;
    try {
      const entries = attendanceRecord.students as StudentAttendanceEntry[];
      const roomName = formatClassroomId(currentClassroom?.name ?? selectedClassroom);
      const periodName = activePeriods.find((p) => p.id === selectedPeriod)?.name ?? selectedPeriod;
      const records = students.map((s) => {
        const entry = entries.find((e) => e.student_id === s.studentId);
        const statusMap: Record<string, string> = { "มา": "present", "ขาด": "absent", "สาย": "late", "ลา": "leave", "ป่วย": "sick" };
        const rawStatus = entry?.status ?? "-";
        return {
          studentId: s.studentId,
          studentName: s.name,
          classroomId: selectedClassroom,
          status: statusMap[rawStatus] ?? rawStatus,
          note: entry?.reason ?? null,
        };
      });
      const html = generateClassroomReportHtml({
        classroomId: selectedClassroom,
        classroomName: roomName,
        date: selectedDate,
        period: periodName,
        records,
        totalStudents: summary.total,
        present: summary.มา,
        absent: summary.ขาด,
        late: summary.สาย,
        leave: summary.ลา,
        sick: summary.ป่วย,
      });
      await exportPdfAndShare(html, `เช็คชื่อ_${roomName}_${selectedDate}.pdf`);
    } catch {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถสร้าง PDF ได้");
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="สรุปตามห้องเรียน" />
      <ScreenContainer edges={[]} className="flex-1">
        {/* Filters */}
        <View style={styles.filterBar}>
          {/* Date Picker */}
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <IconSymbol name="calendar" size={16} color="#F97316" />
            <Text style={styles.dateBtnText}>
              {toThaiDateWithDay(new Date(selectedDate + "T00:00:00"))}
            </Text>
          </TouchableOpacity>

          {/* Classroom Picker */}
          <TouchableOpacity
            style={styles.classroomPicker}
            onPress={() => setShowClassroomPicker(!showClassroomPicker)}
            activeOpacity={0.8}
          >
            <IconSymbol name="person.3.fill" size={16} color="#F97316" />
            <Text style={styles.classroomPickerText}>
              {currentClassroom ? formatClassroomId(currentClassroom.name) : "เลือกห้องเรียน"}
            </Text>
            <IconSymbol
              name={showClassroomPicker ? "chevron.up" : "chevron.down"}
              size={16}
              color="#78716C"
            />
          </TouchableOpacity>

          {/* Classroom Dropdown */}
          {showClassroomPicker && (
            <View style={styles.dropdown}>
              {visibleClassrooms.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.dropdownItem,
                    selectedClassroom === c.id && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSelectedClassroom(c.id);
                    setShowClassroomPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedClassroom === c.id && styles.dropdownItemTextActive,
                    ]}
                  >
                    {formatClassroomId(c.name)}
                  </Text>
                  {selectedClassroom === c.id && (
                    <IconSymbol name="checkmark" size={16} color="#F97316" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Period Selector */}
          <View style={styles.periodRow}>
            {activePeriods.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.periodButton,
                  selectedPeriod === p.id && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(p.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === p.id && styles.periodButtonTextActive,
                  ]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {!selectedClassroom ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="person.3.fill" size={48} color="#E7E5E4" />
            <Text style={styles.emptyTitle}>เลือกห้องเรียน</Text>
            <Text style={styles.emptySubtitle}>กรุณาเลือกห้องเรียนที่ต้องการดูสรุป</Text>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F97316" />
          </View>
        ) : !attendanceRecord ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="calendar" size={48} color="#E7E5E4" />
            <Text style={styles.emptyTitle}>ยังไม่มีข้อมูล</Text>
            <Text style={styles.emptySubtitle}>
              ยังไม่ได้เช็คชื่อ {formatClassroomId(currentClassroom?.name ?? "")} วันนี้
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Summary Cards */}
            {summary && (
              <View style={styles.summarySection}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                    สรุป {formatClassroomId(currentClassroom?.name ?? "")} • {toThaiDateShort(new Date(selectedDate + "T00:00:00"))} •{" "}
                    {activePeriods.find((p) => p.id === selectedPeriod)?.name}
                  </Text>
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FFF7ED", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                    onPress={handleExportPdf}
                    activeOpacity={0.8}
                  >
                    <IconSymbol name="square.and.arrow.up" size={14} color="#F97316" />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#F97316" }}>PDF</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.summaryGrid}>
                  <SummaryCard label="ทั้งหมด" count={summary.total} color="#1C1917" bg="#F3F4F6" />
                  <SummaryCard label="มา" count={summary.มา} color="#16A34A" bg="#DCFCE7" />
                  <SummaryCard label="ขาด" count={summary.ขาด} color="#DC2626" bg="#FEE2E2" />
                  <SummaryCard label="สาย" count={summary.สาย} color="#CA8A04" bg="#FEF9C3" />
                  <SummaryCard label="ลา" count={summary.ลา} color="#2563EB" bg="#DBEAFE" />
                  <SummaryCard label="ป่วย" count={summary.ป่วย} color="#9333EA" bg="#F3E8FF" />
                </View>
              </View>
            )}

            {/* Student List */}
            <View style={styles.studentSection}>
              <Text style={styles.sectionTitle}>รายชื่อนักเรียน</Text>
              {students.map((student) => {
                const entry = attendanceMap[student.studentId];
                const status = entry?.status ?? "-";
                const statusStyle = getStatusStyle(status);
                return (
                  <View key={student.studentId} style={styles.studentRow}>
                    <Text style={styles.studentNo}>{student.no}</Text>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {student.name}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: entry ? statusStyle.bg : "#F3F4F6" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: entry ? statusStyle.color : "#9CA3AF" },
                        ]}
                      >
                        {status}
                      </Text>
                    </View>
                    {entry?.reason ? (
                      <Text style={styles.reasonText} numberOfLines={1}>
                        {entry.reason}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
        <DatePickerModal
          visible={showDatePicker}
          selectedDate={selectedDate}
          onClose={() => setShowDatePicker(false)}
          onSelect={(date) => {
            setSelectedDate(date);
          }}
        />
      </ScreenContainer>
    </View>
  );
}

function SummaryCard({
  label,
  count,
  color,
  bg,
}: {
  label: string;
  count: number;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: bg }]}>
      <Text style={[styles.summaryCardCount, { color }]}>{count}</Text>
      <Text style={[styles.summaryCardLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  filterBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E7E5E4",
    zIndex: 10,
  },
  classroomPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "#F97316",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  classroomPickerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1917",
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemActive: {
    backgroundColor: "#FFF7ED",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#1C1917",
  },
  dropdownItemTextActive: {
    color: "#F97316",
    fontWeight: "700",
  },
  periodRow: {
    flexDirection: "row",
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  periodButtonActive: {
    backgroundColor: "#FFF7ED",
    borderColor: "#F97316",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  periodButtonTextActive: {
    color: "#F97316",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1917",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#78716C",
    textAlign: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summarySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#78716C",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    minWidth: 80,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  summaryCardCount: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  summaryCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  studentSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    overflow: "hidden",
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 8,
  },
  studentNo: {
    fontSize: 13,
    color: "#78716C",
    width: 24,
    textAlign: "center",
  },
  studentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1C1917",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  reasonText: {
    fontSize: 12,
    color: "#78716C",
    maxWidth: 80,
  },
});
