"use client";

import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";

interface ExamResult {
  id: string;
  studentId: string;
  listeningCorrect: number;
  structureCorrect: number;
  readingCorrect: number;
  totalScore: number;
  productId: string;
  createdAt: Date;
}

interface StudentAccount {
  id: string;
  buyerName: string;
  buyerEmail: string | null;
}

// Register fonts
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter",
    fontWeight: 700,
    color: "#1e3a5f",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 4,
  },
  badge: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  badgeText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: 700,
  },
  certificateBody: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  presentedTo: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  studentName: {
    fontSize: 36,
    fontFamily: "Inter",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 20,
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: 8,
    paddingHorizontal: 40,
  },
  description: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    maxWidth: 400,
    lineHeight: 1.6,
    marginBottom: 30,
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginVertical: 30,
  },
  scoreBox: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    minWidth: 100,
  },
  scoreValue: {
    fontSize: 42,
    fontFamily: "Inter",
    fontWeight: 700,
    color: "#3b82f6",
  },
  scoreLabel: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },
  mainScore: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#1e3a5f",
    borderRadius: 16,
    minWidth: 160,
  },
  mainScoreValue: {
    fontSize: 56,
    fontFamily: "Inter",
    fontWeight: 700,
    color: "#ffffff",
  },
  mainScoreLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  sectionScores: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 20,
  },
  sectionItem: {
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    minWidth: 80,
  },
  sectionValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
  },
  sectionLabel: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 40,
    paddingTop: 20,
    borderTop: "1px solid #e2e8f0",
  },
  dateSection: {
    alignItems: "flex-start",
  },
  dateLabel: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: 700,
  },
  qrSection: {
    alignItems: "center",
  },
  qrLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 4,
    textAlign: "center",
  },
  qrCode: {
    width: 80,
    height: 80,
  },
  signature: {
    alignItems: "flex-end",
  },
  signatureLine: {
    borderBottom: "1px solid #0f172a",
    width: 120,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 10,
    color: "#64748b",
  },
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-30deg)",
    fontSize: 80,
    color: "#f1f5f9",
    opacity: 0.5,
    fontWeight: 700,
  },
  border: {
    border: "2px solid #3b82f6",
    margin: 20,
    padding: 40,
    borderRadius: 16,
  },
});

interface CertificateProps {
  result: ExamResult & {
    student: StudentAccount;
  };
  qrCodeDataUrl: string;
}

export function CertificatePDF({ result, qrCodeDataUrl }: CertificateProps) {
  const date = new Date(result.createdAt);
  const formattedDate = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const getScoreCategory = (score: number) => {
    if (score >= 550) return { label: "Excellent", color: "#10b981" };
    if (score >= 500) return { label: "Good", color: "#3b82f6" };
    if (score >= 450) return { label: "Average", color: "#f59e0b" };
    return { label: "Needs Improvement", color: "#ef4444" };
  };

  const category = getScoreCategory(result.totalScore);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>TOEFL ITP Simulation</Text>
            <Text style={styles.subtitle}>Certificate of Completion</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{category.label.toUpperCase()}</Text>
            </View>
          </View>

          {/* Body */}
          <View style={styles.certificateBody}>
            <Text style={styles.presentedTo}>This is to certify that</Text>
            <Text style={styles.studentName}>{result.student.buyerName}</Text>
            <Text style={styles.description}>
              Has successfully completed the TOEFL ITP Simulation and achieved the predicted score as shown below.
            </Text>

            {/* Score Display */}
            <View style={styles.scoreSection}>
              <View style={styles.scoreBox}>
                <Text style={styles.sectionValue}>{result.listeningCorrect}</Text>
                <Text style={styles.sectionLabel}>Listening</Text>
              </View>
              <View style={styles.scoreBox}>
                <Text style={styles.sectionValue}>{result.structureCorrect}</Text>
                <Text style={styles.sectionLabel}>Structure</Text>
              </View>
              <View style={styles.scoreBox}>
                <Text style={styles.sectionValue}>{result.readingCorrect}</Text>
                <Text style={styles.sectionLabel}>Reading</Text>
              </View>
              <View style={styles.mainScore}>
                <Text style={styles.mainScoreValue}>{result.totalScore}</Text>
                <Text style={styles.mainScoreLabel}>TOTAL SCORE</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.dateSection}>
              <Text style={styles.dateLabel}>Date of Examination</Text>
              <Text style={styles.dateValue}>{formattedDate}</Text>
            </View>
            <View style={styles.qrSection}>
              <Text style={styles.qrLabel}>Scan to verify</Text>
              <Image src={qrCodeDataUrl} style={styles.qrCode} />
              <Text style={{ fontSize: 8, color: "#94a3b8" }}>{result.id.slice(0, 8)}...</Text>
            </View>
            <View style={styles.signature}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Authorized Signature</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}