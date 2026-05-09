import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AppHeader } from "@/components/app-header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { formatDateForApi, toThaiDateWithDay, formatClassroomId } from "@/lib/thai-date";
import { DatePickerModal } from "@/components/date-picker-modal";
import type { StudentAttendanceEntry } from "@/shared/types";

const STATUS_OPTIONS = [
  { label: "มา", color: "#16A34A", bg: "#DCFCE7" },
  { label: "ขาด", color: "#DC2626", bg: "#FEE2E2" },
  { label: "สาย", color: "#CA8A04", bg: "#FEF9C3" },
  { label: "ลา", color: "#2563EB", bg: "#DBEAFE" },
  { label: "ป่วย", color: "#9333EA", bg: "#F3E8FF" },
];

interface RoomSummary {
  roomId: string;
  roomName: string;
  total: number;
  มา: number;
  ขาด: number;
  สาย: number;
  ลา: number;
  ป่วย: number;
  checked: boolean;
  teacher: string;
}

export default function OverallSummaryScreen() {
  const [selectedDate, setSelectedDate] = useState(formatDateForApi(new Date()));
  const [selectedPeriod, setSelectedPeriod] = useState("morning");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: classrooms = [] } = trpc.classrooms.useQuery();
  const { data: periods = [] } = trpc.periods.useQuery();
  const { data: attendanceList = [], isLoading } = trpc.getAttendanceByDatePeriod.useQuery(
    { date: selectedDate, period: selectedPeriod },
    { enabled: !!selectedDate && !!selectedPeriod }
  );

  const activePeriods = periods.filter((p) => p.status === 1);

  // Build summary per room
  const roomSummaries: RoomSummary[] = classrooms.map((c) => {
    const record = attendanceList.find((a) => a.roomId === c.id);
    if (!record) {
      return {
        roomId: c.id,
        roomName: formatClassroomId(c.name),
        total: 0,
        มา: 0,
        ขาด: 0,
        สาย: 0,
        ลา: 0,
        ป่วย: 0,
        checked: false,
        teacher: "-",
      };
    }
    const entries = record.students as StudentAttendanceEntry[];
    const counts = { มา: 0, ขาด: 0, สาย: 0, ลา: 0, ป่วย: 0 };
    for (const e of entries) {
      if (e.status in counts) counts[e.status as keyof typeof counts]++;
    }
    return {
      roomId: c.id,
      roomName: formatClassroomId(c.name),
      total: entries.length,
      ...counts,
      checked: true,
      teacher: record.teacher,
    };
  });

  // Grand totals
  const grandTotal = roomSummaries.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      มา: acc.มา + r.มา,
      ขาด: acc.ขาด + r.ขาด,
      สาย: acc.สาย + r.สาย,
      ลา: acc.ลา + r.ลา,
      ป่วย: acc.ป่วย + r.ป่วย,
      checked: acc.checked + (r.checked ? 1 : 0),
    }),
    { total: 0, มา: 0, ขาด: 0, สาย: 0, ลา: 0, ป่วย: 0, checked: 0 }
  );

  const attendanceRate =
    grandTotal.total > 0
      ? Math.round((grandTotal.มา / grandTotal.total) * 100)
      : 0;

  const renderRoomRow = ({ item }: { item: RoomSummary }) => (
    <View style={[styles.roomRow, !item.checked && styles.roomRowUnchecked]}>
      <View style={styles.roomNameCol}>
        <View style={[styles.roomDot, { backgroundColor: item.checked ? "#F97316" : "#E7E5E4" }]} />
        <Text style={styles.roomNameText}>{item.roomName}</Text>
      </View>
      <Text style={styles.roomTotalText}>{item.checked ? item.total : "-"}</Text>
      {STATUS_OPTIONS.map((s) => (
        <Text
          key={s.label}
          style={[
            styles.roomStatText,
            item.checked && (item[s.label as keyof RoomSummary] as number) > 0
              ? { color: s.color, fontWeight: "700" }
              : { color: "#9CA3AF" },
          ]}
        >
          {item.checked ? (item[s.label as keyof RoomSummary] as number) : "-"}
        </Text>
      ))}
      {!item.checked && (
        <View style={styles.uncheckedTag}>
          <Text style={styles.uncheckedTagText}>ยังไม่เช็ค</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="สรุปภาพรวมทั้งโรงเรียน" />
      <ScreenContainer edges={[]} className="flex-1">
        {/* Filters */}
        <View style={styles.filterBar}>
          <TouchableOpacity 
            style={styles.dateRow}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <IconSymbol name="calendar" size={16} color="#F97316" />
            <Text style={styles.dateText}>
              {toThaiDateWithDay(new Date(selectedDate + "T00:00:00"))}
            </Text>
          </TouchableOpacity>
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

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F97316" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Grand Total Cards */}
            <View style={styles.grandTotalSection}>
              <Text style={styles.sectionTitle}>ยอดรวมทั้งโรงเรียน</Text>
              <View style={styles.statsRow}>
                <StatCard
                  label="ทั้งหมด"
                  value={grandTotal.total}
                  color="#1C1917"
                  bg="#F3F4F6"
                  icon="person.3.fill"
                />
                <StatCard
                  label="มาเรียน"
                  value={grandTotal.มา}
                  color="#16A34A"
                  bg="#DCFCE7"
                  icon="checkmark.circle.fill"
                />
                <StatCard
                  label="ขาดเรียน"
                  value={grandTotal.ขาด}
                  color="#DC2626"
                  bg="#FEE2E2"
                  icon="xmark.circle.fill"
                />
              </View>
              <View style={styles.statsRow}>
                <StatCard
                  label="มาสาย"
                  value={grandTotal.สาย}
                  color="#CA8A04"
                  bg="#FEF9C3"
                  icon="clock.fill"
                />
                <StatCard
                  label="ลาหยุด"
                  value={grandTotal.ลา}
                  color="#2563EB"
                  bg="#DBEAFE"
                  icon="doc.text"
                />
                <StatCard
                  label="ลาป่วย"
                  value={grandTotal.ป่วย}
                  color="#9333EA"
                  bg="#F3E8FF"
                  icon="info.circle"
                />
              </View>

              {/* Attendance Rate Bar */}
              <View style={styles.rateCard}>
                <View style={styles.rateHeader}>
                  <Text style={styles.rateLabel}>อัตราการเข้าเรียน</Text>
                  <Text style={styles.rateValue}>{attendanceRate}%</Text>
                </View>
                <View style={styles.rateBarBg}>
                  <View style={[styles.rateBarFill, { width: `${attendanceRate}%` }]} />
                </View>
                <View style={styles.rateFooter}>
                  <Text style={styles.rateFooterText}>
                    เช็คแล้ว {grandTotal.checked}/{classrooms.length} ห้อง
                  </Text>
                </View>
              </View>
            </View>

            {/* Room-by-Room Table */}
            <View style={styles.tableSection}>
              <Text style={styles.sectionTitle}>สรุปรายห้องเรียน</Text>
              <View style={styles.tableContainer}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.roomNameCol]}>ห้อง</Text>
                  <Text style={styles.tableHeaderText}>รวม</Text>
                  {STATUS_OPTIONS.map((s) => (
                    <Text
                      key={s.label}
                      style={[styles.tableHeaderText, { color: s.color }]}
                    >
                      {s.label}
                    </Text>
                  ))}
                </View>

                {/* Table Rows */}
                <FlatList
                  data={roomSummaries}
                  keyExtractor={(item) => item.roomId}
                  renderItem={renderRoomRow}
                  scrollEnabled={false}
                />

                {/* Total Row */}
                <View style={styles.totalRow}>
                  <Text style={[styles.totalRowText, styles.roomNameCol, { color: "#F97316" }]}>
                    รวมทั้งหมด
                  </Text>
                  <Text style={[styles.totalRowText, { color: "#1C1917" }]}>{grandTotal.total}</Text>
                  {STATUS_OPTIONS.map((s) => (
                    <Text
                      key={s.label}
                      style={[styles.totalRowText, { color: s.color }]}
                    >
                      {grandTotal[s.label as keyof typeof grandTotal] as number}
                    </Text>
                  ))}
                </View>
              </View>
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

function StatCard({
  label,
  value,
  color,
  bg,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  icon: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <IconSymbol name={icon as any} size={20} color={color} />
      <Text style={[styles.statCardValue, { color }]}>{value}</Text>
      <Text style={[styles.statCardLabel, { color }]}>{label}</Text>
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
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1917",
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  grandTotalSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#78716C",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  statCardValue: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  statCardLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  rateCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  rateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1917",
  },
  rateValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F97316",
  },
  rateBarBg: {
    height: 8,
    backgroundColor: "#E7E5E4",
    borderRadius: 4,
    overflow: "hidden",
  },
  rateBarFill: {
    height: "100%",
    backgroundColor: "#F97316",
    borderRadius: 4,
  },
  rateFooter: {
    marginTop: 6,
  },
  rateFooterText: {
    fontSize: 12,
    color: "#78716C",
  },
  tableSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    overflow: "hidden",
  },
  tableContainer: {
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F97316",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  roomRowUnchecked: {
    backgroundColor: "#FAFAFA",
  },
  roomNameCol: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roomDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roomNameText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1C1917",
  },
  roomTotalText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#1C1917",
    textAlign: "center",
  },
  roomStatText: {
    flex: 1,
    fontSize: 13,
    textAlign: "center",
  },
  uncheckedTag: {
    position: "absolute",
    right: 8,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  uncheckedTagText: {
    fontSize: 10,
    color: "#DC2626",
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: "#F97316",
  },
  totalRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
});
