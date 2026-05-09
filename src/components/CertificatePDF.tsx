import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";

interface CustomTemplate {
  title: string;
  subtitle: string;
  showLogo: boolean;
  logoUrl: string | null;
  signatureText: string;
  footerText: string | null;
  fontFamily: string;
  backgroundImage: string | null;
  validityDays: number | null;
}

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

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    position: "relative",
    backgroundColor: "#ffffff",
    fontFamily: "Inter",
    width: 842,
    height: 595,
  },

  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 842,
    height: 595,
    zIndex: -1,
  },

  container: {
    position: "relative",
    margin: 24,
    padding: 30,
    height: "90%",
    justifyContent: "space-between",
  },

  header: {
    alignItems: "center",
    marginBottom: 5,
  },

  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
    objectFit: "contain",
  },

  title: {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 13,
    letterSpacing: 2,
  },

  badge: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: 700,
  },

  body: {
    alignItems: "center",
    marginTop: 10,
  },

  presentedText: {
    fontSize: 12,
    marginBottom: 6,
  },

  studentName: {
    fontSize: 30,
    fontWeight: 700,
    paddingBottom: 5,
    paddingHorizontal: 20,
    marginBottom: 14,
  },

  description: {
    fontSize: 11,
    textAlign: "center",
    maxWidth: 420,
    lineHeight: 1.5,
    marginBottom: 18,
  },

  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },

  scoreBox: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 10,
    minWidth: 70,
  },

  sectionValue: {
    fontSize: 22,
    fontWeight: 700,
  },

  sectionLabel: {
    fontSize: 8,
    marginTop: 2,
  },

  totalBox: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minWidth: 120,
  },

  totalValue: {
    fontSize: 40,
    fontWeight: 700,
  },

  totalLabel: {
    fontSize: 10,
  },

  qrTopLeft: {
    position: "absolute",
    top: 50,
    left: 50,
    alignItems: "center",
  },

  qrCode: {
    width: 60,
    height: 60,
  },

  qrText: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 20,
  },

  footerLeft: {},

  footerLabel: {
    fontSize: 8,
  },

  footerValue: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 2,
  },

  validityText: {
    fontSize: 8,
    marginTop: 4,
  },

  footerTextCustom: {
    fontSize: 8,
    marginTop: 4,
  },
});

interface CertificateProps {
  result: ExamResult & {
    student: StudentAccount;
  };
  qrCodeDataUrl: string;
  backgroundImage?: string | null;
  customTemplate?: CustomTemplate | null;
  logoUrl?: string | null;
}

// Default colors
const DEFAULT_COLORS = {
  primaryColor: "#1e3a5f",
  accentColor: "#2563eb",
};

export function CertificatePDF({ result, qrCodeDataUrl, backgroundImage, customTemplate, logoUrl }: CertificateProps) {
  const date = new Date(result.createdAt);

  const formattedDate = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Calculate validity date if validityDays is set
  const validityDays = customTemplate?.validityDays;
  let validityText: string | null = null;
  if (validityDays && validityDays > 0) {
    const validUntil = new Date(date);
    validUntil.setDate(validUntil.getDate() + validityDays);
    validityText = `Valid until ${validUntil.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
  }

  const getCategory = (score: number) => {
    if (score >= 550) return { label: "EXCELLENT", bgColor: "#059669", textColor: "#ffffff" }; // green
    if (score >= 500) return { label: "GOOD", bgColor: "#2563eb", textColor: "#ffffff" }; // blue
    if (score >= 450) return { label: "AVERAGE", bgColor: "#d97706", textColor: "#ffffff" }; // orange
    return { label: "NEEDS IMPROVEMENT", bgColor: "#dc2626", textColor: "#ffffff" }; // red
  };

  // Default colors
  const primaryColor = DEFAULT_COLORS.primaryColor;
  const accentColor = DEFAULT_COLORS.accentColor;

  // Always use dark text for better visibility on white/light backgrounds
  const textColor = primaryColor;
  const lightTextColor = "#64748b";
  const borderColor = primaryColor;

  // Get category with colors
  const category = getCategory(result.totalScore);

  // Dynamic styles based on colors
  const dynamicStyles = {
    title: { color: textColor },
    subtitle: { color: lightTextColor },
    badge: { backgroundColor: category.bgColor },
    badgeText: { color: category.textColor },
    presentedText: { color: lightTextColor },
    studentName: { color: textColor, borderBottom: `3px solid ${borderColor}` },
    description: { color: lightTextColor },
    scoreBox: {
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: "#e2e8f0",
    },
    totalBox: { backgroundColor: category.bgColor },
    totalValue: { color: category.textColor },
    totalLabel: { color: "rgba(255,255,255,0.8)" },
    footerLabel: { color: lightTextColor },
    footerValue: { color: textColor },
    qrText: { color: lightTextColor },
  };

  return (
    <Document>
      <Page
        size="A4"
        orientation="landscape"
        wrap={false}
        style={styles.page}
      >
        {/* Background - must be first to render behind content */}
        {backgroundImage && (
          <Image
            src={backgroundImage}
            style={styles.backgroundImage}
          />
        )}

        {/* QR Code - Bottom Right Corner */}
        <View style={styles.qrTopLeft}>
          <Image
            src={qrCodeDataUrl}
            style={styles.qrCode}
          />
          <Text style={styles.qrText}>
            Scan to verify
          </Text>
        </View>

        {/* Main Container */}
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            {logoUrl && (
              <Image
                src={logoUrl}
                style={styles.logo}
              />
            )}

            <Text style={[styles.title, dynamicStyles.title]}>
              {customTemplate?.title || "TOEFL ITP Simulation"}
            </Text>

            <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
              {customTemplate?.subtitle || "Certificate of Completion"}
            </Text>

            <View style={[styles.badge, dynamicStyles.badge]}>
              <Text style={[styles.badgeText, dynamicStyles.badgeText]}>
                {category.label}
              </Text>
            </View>
          </View>

          {/* Body */}
          <View style={styles.body}>
            <Text style={[styles.presentedText, dynamicStyles.presentedText]}>
              This certificate is proudly presented to
            </Text>

            <Text style={[styles.studentName, dynamicStyles.studentName]}>
              {result.student.buyerName}
            </Text>

            <Text style={[styles.description, dynamicStyles.description]}>
              Has successfully completed the TOEFL ITP Simulation
              and achieved the following score prediction.
            </Text>

            {/* Scores */}
            <View style={styles.scoreSection}>

              <View style={[styles.scoreBox, dynamicStyles.scoreBox]}>
                <Text style={styles.sectionValue}>
                  {result.listeningCorrect}
                </Text>
                <Text style={styles.sectionLabel}>
                  LISTENING
                </Text>
              </View>

              <View style={[styles.scoreBox, dynamicStyles.scoreBox]}>
                <Text style={styles.sectionValue}>
                  {result.structureCorrect}
                </Text>
                <Text style={styles.sectionLabel}>
                  STRUCTURE
                </Text>
              </View>

              <View style={[styles.scoreBox, dynamicStyles.scoreBox]}>
                <Text style={styles.sectionValue}>
                  {result.readingCorrect}
                </Text>
                <Text style={styles.sectionLabel}>
                  READING
                </Text>
              </View>

              <View style={[styles.totalBox, dynamicStyles.totalBox]}>
                <Text style={[styles.totalValue, dynamicStyles.totalValue]}>
                  {result.totalScore}
                </Text>

                <Text style={[styles.totalLabel, dynamicStyles.totalLabel]}>
                  TOTAL SCORE
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>

            <View style={styles.footerLeft}>
              <Text style={[styles.footerLabel, dynamicStyles.footerLabel]}>
                Date of Examination
              </Text>

              <Text style={[styles.footerValue, dynamicStyles.footerValue]}>
                {formattedDate}
              </Text>

              {validityText && (
                <Text style={[styles.validityText, { color: lightTextColor }]}>
                  {validityText}
                </Text>
              )}

              {customTemplate?.footerText && (
                <Text style={[styles.footerTextCustom, { color: lightTextColor }]}>
                  {customTemplate.footerText}
                </Text>
              )}
            </View>

          </View>
        </View>
      </Page>
    </Document>
  );
}