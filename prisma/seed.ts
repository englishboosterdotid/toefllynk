import "dotenv/config";
import prisma from "../src/lib/prisma";

console.log("DATABASE_URL:", process.env.DATABASE_URL);

// Section enum mapping
const Section = {
  LISTENING: "LISTENING",
  STRUCTURE: "STRUCTURE",
  READING: "READING",
} as const;

type SectionType = typeof Section[keyof typeof Section];

interface QuestionData {
  section: SectionType;
  questionNumber: number;
  questionText: string;
  passageText?: string;
  audioUrl?: string;
  correctAnswer: string;
  explanation: string;
  options: { optionKey: string; optionText: string }[];
}

async function seedQuestionBank() {
  console.log("Seeding Question Bank...");

  const questions: QuestionData[] = [
    // ============ LISTENING SECTION ============
    {
      section: Section.LISTENING,
      questionNumber: 1,
      questionText: "What is the main purpose of the conversation?",
      audioUrl: "/upload/audio/listening/listening_1.mp3",
      correctAnswer: "B",
      explanation: "The man is asking about the deadline extension for the assignment, and the woman is granting it. The main purpose is to request more time for an assignment.",
      options: [
        { optionKey: "A", optionText: "To discuss a grade dispute" },
        { optionKey: "B", optionText: "To request an extension on an assignment" },
        { optionKey: "C", optionText: "To ask about library resources" },
        { optionKey: "D", optionText: "To withdraw from a course" },
      ],
    },
    {
      section: Section.LISTENING,
      questionNumber: 2,
      questionText: "What will the man probably do next?",
      audioUrl: "/upload/audio/listening/listening_2.mp3",
      correctAnswer: "C",
      explanation: "After the conversation, the man will likely visit the writing center to get help with his paper, as suggested by the woman's recommendation.",
      options: [
        { optionKey: "A", optionText: "Submit his paper immediately" },
        { optionKey: "B", optionText: "Drop the course" },
        { optionKey: "C", optionText: "Go to the writing center" },
        { optionKey: "D", optionText: "Talk to the professor" },
      ],
    },
    {
      section: Section.LISTENING,
      questionNumber: 3,
      questionText: "What can be inferred about the woman?",
      audioUrl: "/upload/audio/listening/listening_3.mp3",
      correctAnswer: "D",
      explanation: "The woman demonstrates knowledge of university policies and is helpful, suggesting she may be a student advisor or staff member.",
      options: [
        { optionKey: "A", optionText: "She is a new student" },
        { optionKey: "B", optionText: "She is not familiar with campus resources" },
        { optionKey: "C", optionText: "She is the man's professor" },
        { optionKey: "D", optionText: "She works in the administration office" },
      ],
    },
    {
      section: Section.LISTENING,
      questionNumber: 4,
      questionText: "What does the speaker imply when he says 'The early bird catches the worm'?",
      audioUrl: "/upload/audio/listening/listening_4.mp3",
      correctAnswer: "A",
      explanation: "This idiom means that those who act quickly or start early have an advantage. The speaker is encouraging students to start their assignments early.",
      options: [
        { optionKey: "A", optionText: "Starting early gives you an advantage" },
        { optionKey: "B", optionText: "Birds are important for the ecosystem" },
        { optionKey: "C", optionText: "You should wake up early every day" },
        { optionKey: "D", optionText: "Assignments are difficult to complete" },
      ],
    },
    {
      section: Section.LISTENING,
      questionNumber: 5,
      questionText: "Where is this conversation most likely taking place?",
      audioUrl: "/upload/audio/listening/listening_5.mp3",
      correctAnswer: "B",
      explanation: "The references to course registration, prerequisites, and academic advisors indicate this conversation is taking place in an academic advising office.",
      options: [
        { optionKey: "A", optionText: "In a chemistry laboratory" },
        { optionKey: "B", optionText: "In an academic advising office" },
        { optionKey: "C", optionText: "In a campus cafeteria" },
        { optionKey: "D", optionText: "In a computer lab" },
      ],
    },

    // ============ STRUCTURE SECTION ============
    {
      section: Section.STRUCTURE,
      questionNumber: 1,
      questionText: "_____ the rain, we decided to go hiking anyway.",
      correctAnswer: "A",
      explanation: "'Despite' is a preposition that takes a noun phrase. 'The rain' is a noun phrase, so 'Despite the rain' is correct. 'In spite of' is also correct as an alternative.",
      options: [
        { optionKey: "A", optionText: "Despite" },
        { optionKey: "B", optionText: "Although" },
        { optionKey: "C", optionText: "Because of" },
        { optionKey: "D", optionText: "Unless" },
      ],
    },
    {
      section: Section.STRUCTURE,
      questionNumber: 2,
      questionText: "The professor suggested that the students _____ their research papers by Friday.",
      correctAnswer: "C",
      explanation: "After 'suggested,' the subjunctive mood requires the base form of the verb. 'Submit' is the correct form, not 'submitted' or 'to submit.'",
      options: [
        { optionKey: "A", optionText: "submitted" },
        { optionKey: "B", optionText: "to submit" },
        { optionKey: "C", optionText: "submit" },
        { optionKey: "D", optionText: "submitting" },
      ],
    },
    {
      section: Section.STRUCTURE,
      questionNumber: 3,
      questionText: "_____ the first vaccine was developed in the 18th century.",
      correctAnswer: "B",
      explanation: "This is a general historical fact, which requires a simple past tense. The sentence needs a time marker. 'In 1796' correctly specifies when the event occurred.",
      options: [
        { optionKey: "A", optionText: "However" },
        { optionKey: "B", optionText: "In 1796" },
        { optionKey: "C", optionText: "Because" },
        { optionKey: "D", optionText: "Nevertheless" },
      ],
    },
    {
      section: Section.STRUCTURE,
      questionNumber: 4,
      questionText: "Neither the students nor the professor _____ the exam results yet.",
      correctAnswer: "D",
      explanation: "With 'neither...nor,' the verb agrees with the nearest subject. 'Professor' is singular, so 'has' (singular) is correct.",
      options: [
        { optionKey: "A", optionText: "have seen" },
        { optionKey: "B", optionText: "has see" },
        { optionKey: "C", optionText: "have saw" },
        { optionKey: "D", optionText: "has seen" },
      ],
    },
    {
      section: Section.STRUCTURE,
      questionNumber: 5,
      questionText: "The research was _____ conducted than we had expected.",
      correctAnswer: "A",
      explanation: "'More' is the comparative form of 'much/many.' It modifies the adjective 'conducted' (understood as describing the manner of the research). 'B' would require 'than' instead of 'then.'",
      options: [
        { optionKey: "A", optionText: "more thoroughly" },
        { optionKey: "B", optionText: "most thoroughly" },
        { optionKey: "C", optionText: "very thoroughly" },
        { optionKey: "D", optionText: "too thoroughly" },
      ],
    },
    {
      section: Section.STRUCTURE,
      questionNumber: 6,
      questionText: "_____ the economic crisis, many small businesses closed their doors.",
      correctAnswer: "C",
      explanation: "'Due to' functions as a compound preposition meaning 'caused by' or 'attributable to.' It correctly shows that the economic crisis caused the closure.",
      options: [
        { optionKey: "A", optionText: "Due" },
        { optionKey: "B", optionText: "Because" },
        { optionKey: "C", optionText: "Due to" },
        { optionKey: "D", optionText: "Since that" },
      ],
    },
    {
      section: Section.STRUCTURE,
      questionNumber: 7,
      questionText: "Had I known about the traffic, I _____ earlier.",
      correctAnswer: "B",
      explanation: "This is a third conditional with an inverted structure. 'Would have left' is the correct form to express an unreal past action.",
      options: [
        { optionKey: "A", optionText: "will leave" },
        { optionKey: "B", optionText: "would have left" },
        { optionKey: "C", optionText: "would leave" },
        { optionKey: "D", optionText: "left" },
      ],
    },
    {
      section: Section.STRUCTURE,
      questionNumber: 8,
      questionText: "The more you practice, _____ you become at speaking English.",
      correctAnswer: "A",
      explanation: "This is a 'the...the' comparison structure. After 'the more,' we use a comparative adjective. 'Better' is the comparative form of 'good.'",
      options: [
        { optionKey: "A", optionText: "the better" },
        { optionKey: "B", optionText: "better" },
        { optionKey: "C", optionText: "the best" },
        { optionKey: "D", optionText: "more better" },
      ],
    },

    // ============ READING SECTION ============
    {
      section: Section.READING,
      questionNumber: 1,
      passageText: "Photosynthesis is the process by which green plants, algae, and some bacteria convert light energy into chemical energy. This process occurs in the chloroplasts of plant cells, where chlorophyll absorbs light, primarily in the red and blue wavelengths. The captured light energy is used to convert carbon dioxide and water into glucose and oxygen. This glucose serves as the primary energy source for the plant, while the oxygen is released as a byproduct into the atmosphere. Photosynthesis is essential for life on Earth as it produces the oxygen we breathe and forms the base of most food chains.",
      questionText: "According to the passage, what is the primary function of glucose in plants?",
      correctAnswer: "C",
      explanation: "The passage states that 'This glucose serves as the primary energy source for the plant.' It is not used to produce chlorophyll, create water, or absorbed directly by the plant.",
      options: [
        { optionKey: "A", optionText: "To produce chlorophyll" },
        { optionKey: "B", optionText: "To create water molecules" },
        { optionKey: "C", optionText: "To provide energy for the plant" },
        { optionKey: "D", optionText: "To be absorbed directly by the roots" },
      ],
    },
    {
      section: Section.READING,
      questionNumber: 2,
      passageText: "The Industrial Revolution, which began in Britain in the late 18th century, marked a fundamental shift from agrarian economies to industrial ones. New manufacturing processes, particularly the development of steam power and iron production, revolutionized production methods. Factories replaced workshops, and urbanization accelerated as workers moved from rural areas to cities. This period saw unprecedented economic growth, but also significant social challenges including child labor, poor working conditions, and environmental pollution.",
      questionText: "The word 'agrarian' in line 2 is closest in meaning to:",
      correctAnswer: "B",
      explanation: "'Agrarian' relates to agriculture and farming. In the context, it contrasts with 'industrial,' suggesting it means farming-based or related to land cultivation.",
      options: [
        { optionKey: "A", optionText: "Industrial" },
        { optionKey: "B", optionText: "Farming-related" },
        { optionKey: "C", optionText: "Urban" },
        { optionKey: "D", optionText: "Technological" },
      ],
    },
    {
      section: Section.READING,
      questionNumber: 3,
      passageText: "Marine biologists have discovered that coral reefs are sensitive to slight changes in water temperature. When海水温度升高仅1-2摄氏度时，许多珊瑚会驱逐生活在其组织内的藻类，这一过程称为白化。白化的珊瑚变得极其脆弱，容易受到疾病和死亡的侵袭。科学家警告说，如果全球变暖继续加剧，世界各地的珊瑚礁可能会在几十年内消失。",
      questionText: "What happens when coral experiences bleaching?",
      correctAnswer: "D",
      explanation: "According to the passage, bleached coral expels algae from its tissues, becomes very fragile, and is susceptible to disease and death.",
      options: [
        { optionKey: "A", optionText: "It reproduces more quickly" },
        { optionKey: "B", optionText: "Its color becomes brighter" },
        { optionKey: "C", optionText: "It becomes more resistant to disease" },
        { optionKey: "D", optionText: "It becomes vulnerable to disease and death" },
      ],
    },
    {
      section: Section.READING,
      questionNumber: 4,
      passageText: "Sleep deprivation has become increasingly common in modern society, with studies suggesting that one-third of adults fail to get the recommended seven to nine hours of sleep per night. Chronic sleep loss has been linked to numerous health problems including obesity, diabetes, cardiovascular disease, and mental health disorders. Research also indicates that sleep plays a crucial role in memory consolidation and learning. During sleep, the brain processes and stores information from the day's experiences, making adequate rest essential for academic and professional performance.",
      questionText: "The author's primary purpose in this passage is to:",
      correctAnswer: "A",
      explanation: "The passage explains the consequences of sleep deprivation and emphasizes the importance of adequate sleep, making 'to inform readers about the effects of sleep loss' the correct answer.",
      options: [
        { optionKey: "A", optionText: "To inform readers about the effects of sleep loss" },
        { optionKey: "B", optionText: "To persuade readers to sleep more" },
        { optionKey: "C", optionText: "To entertain readers with interesting facts" },
        { optionKey: "D", optionText: "To describe the author's personal sleep habits" },
      ],
    },
    {
      section: Section.READING,
      questionNumber: 5,
      passageText: "The human gut microbiome consists of trillions of microorganisms, including bacteria, viruses, and fungi, that live in our digestive system. Recent research has revealed that these microscopic inhabitants play a crucial role in our overall health, influencing everything from our immune system to our mood. Scientists have discovered connections between gut bacteria and conditions such as depression, anxiety, and even autism spectrum disorders. While the research is still evolving, it suggests that maintaining a healthy gut microbiome through diet and lifestyle may be key to preventing various chronic diseases.",
      questionText: "It can be inferred from the passage that:",
      correctAnswer: "C",
      explanation: "The passage mentions that scientists have discovered connections between gut bacteria and mental health conditions, suggesting that diet may influence mental health through the gut microbiome.",
      options: [
        { optionKey: "A", optionText: "The gut microbiome has been fully understood by scientists" },
        { optionKey: "B", optionText: "Gut bacteria only affect digestive health" },
        { optionKey: "C", optionText: "Diet may influence mental health through gut bacteria" },
        { optionKey: "D", optionText: "All chronic diseases are caused by gut bacteria" },
      ],
    },
    {
      section: Section.READING,
      questionNumber: 6,
      passageText: "Cognitive psychology focuses on how people perceive, think about, and remember information. Unlike behaviorism, which emphasizes observable behaviors, cognitive psychology delves into the mental processes underlying behavior. Key areas of study include attention, memory, problem-solving, and decision-making. Researchers in this field use various methods, including experiments, brain imaging, and computational modeling, to understand how the mind processes information. The insights gained from cognitive psychology have applications in education, artificial intelligence, and clinical treatment of mental disorders.",
      questionText: "According to the passage, what distinguishes cognitive psychology from behaviorism?",
      correctAnswer: "B",
      explanation: "The passage states that 'Unlike behaviorism, which emphasizes observable behaviors, cognitive psychology delves into the mental processes underlying behavior.'",
      options: [
        { optionKey: "A", optionText: "Cognitive psychology does not study behavior" },
        { optionKey: "B", optionText: "Cognitive psychology studies mental processes" },
        { optionKey: "C", optionText: "Cognitive psychology only uses experiments" },
        { optionKey: "D", optionText: "Cognitive psychology ignores memory" },
      ],
    },
    {
      section: Section.READING,
      questionNumber: 7,
      passageText: "Renewable energy sources, particularly solar and wind power, are becoming increasingly cost-competitive with fossil fuels. The cost of solar photovoltaic panels has declined by more than 99% since 1976, while wind energy costs have fallen by over 90% since the 1980s. This dramatic price reduction has made renewable energy the cheapest source of new electricity generation in many parts of the world. However, challenges remain, including energy storage, grid integration, and the intermittent nature of these energy sources.",
      questionText: "The word 'intermittent' in the last sentence is closest in meaning to:",
      correctAnswer: "A",
      explanation: "'Intermittent' means occurring at irregular intervals; not continuous. Solar and wind energy are described as such because they depend on weather conditions and are not always available.",
      options: [
        { optionKey: "A", optionText: "Not continuous" },
        { optionKey: "B", optionText: "Very expensive" },
        { optionKey: "C", optionText: "Highly efficient" },
        { optionKey: "D", optionText: "Environmentally harmful" },
      ],
    },
    {
      section: Section.READING,
      questionNumber: 8,
      passageText: "The concept of emotional intelligence, first popularized by psychologist Daniel Goleman in 1995, refers to the ability to recognize, understand, and manage our own emotions as well as recognize, understand, and influence the emotions of others. Research has shown that emotional intelligence is a better predictor of success in life and work than traditional measures like IQ. Components of emotional intelligence include self-awareness, self-regulation, motivation, empathy, and social skills. These skills can be developed through practice and training, making emotional intelligence unique among human capabilities in that it can be enhanced through effort.",
      questionText: "According to the passage, what makes emotional intelligence unique?",
      correctAnswer: "D",
      explanation: "The passage states that emotional intelligence 'can be developed through practice and training' and 'can be enhanced through effort,' making it unique among human capabilities.",
      options: [
        { optionKey: "A", optionText: "It is determined at birth" },
        { optionKey: "B", optionText: "It cannot be improved" },
        { optionKey: "C", optionText: "It is more important than IQ" },
        { optionKey: "D", optionText: "It can be enhanced through effort" },
      ],
    },
  ];

  // Delete existing questions and options
  console.log("Clearing existing questions...");
  await prisma.questionOption.deleteMany();
  await prisma.questionBank.deleteMany();

  // Insert new questions
  let insertedCount = 0;
  for (const q of questions) {
    const question = await prisma.questionBank.create({
      data: {
        section: q.section,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        passageText: q.passageText || null,
        audioUrl: q.audioUrl || null,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      },
    });

    for (const opt of q.options) {
      await prisma.questionOption.create({
        data: {
          questionId: question.id,
          optionKey: opt.optionKey,
          optionText: opt.optionText,
        },
      });
    }

    insertedCount++;
    console.log(`Created ${q.section} question #${q.questionNumber}: ${q.questionText.substring(0, 50)}...`);
  }

  console.log(`\nSeeded ${insertedCount} questions successfully!`);
  console.log("- LISTENING: 5 questions");
  console.log("- STRUCTURE: 8 questions");
  console.log("- READING: 8 questions");
}

async function main() {
  console.log("Starting seed process...\n");

  // Seed subscription plans first
  console.log("Seeding SubscriptionPlans...");

  await prisma.subscriptionPlan.deleteMany();

  const plans = [
    {
      tier: "FREE" as const,
      name: "Coba",
      price: 0,
      periodDays: 0,
      features: [
        "3 Produk untuk dijual",
        "3 Produk di microsite",
        "Affiliate System",
        "Midtrans Payment",
        "Basic Analytics",
      ],
    },
    {
      tier: "PRO" as const,
      name: "Berkembang",
      price: 79000,
      periodDays: 30,
      features: [
        "Unlimited Produk",
        "15 Produk di microsite",
        "Custom Certificate",
        "Promo/Discount Code",
        "Custom Domain",
        "Basic Theme Custom",
        "Customer Database (500)",
        "Export Customer Data",
        "Email Marketing (1.000/bulan)",
        "API Access",
      ],
    },
    {
      tier: "BUSINESS" as const,
      name: "Bisnis",
      price: 199000,
      periodDays: 30,
      features: [
        "Unlimited Produk",
        "Unlimited Microsite",
        "Full Theme Custom",
        "Custom Footer/Header",
        "Remove Lynk Logo",
        "Customer Database (Unlimited)",
        "Email Marketing (10.000/bulan)",
        "Webhook Integration",
      ],
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.create({
      data: {
        tier: plan.tier,
        name: plan.name,
        price: plan.price,
        periodDays: plan.periodDays,
        features: plan.features,
        isActive: true,
      },
    });
    console.log(`Created plan: ${plan.name}`);
  }

  // Seed question bank
  await seedQuestionBank();

  console.log("\nAll seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
