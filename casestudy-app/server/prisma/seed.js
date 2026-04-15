require('dotenv').config();
const prisma = require('../src/lib/prisma');
const bcrypt = require('bcryptjs');

async function main() {
    console.log("Seeding database...");

    // Fixed UUIDs for easier testing
    const teacherId = "11111111-1111-1111-1111-111111111111";
    const learnerId = "22222222-2222-2222-2222-222222222222";
    const caseId1 = "33333333-3333-3333-3333-333333333333";
    const caseId2 = "44444444-4444-4444-4444-444444444444";
    const caseId3 = "55555555-5555-5555-5555-555555555555";

    const hashedPassword = await bcrypt.hash('password', 10);

    // Clean up existing
    await prisma.comment.deleteMany({});
    await prisma.like.deleteMany({});
    await prisma.conceptNode.deleteMany({});
    await prisma.submissionKeyword.deleteMany({});
    await prisma.submission.deleteMany({});
    await prisma.case.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.notification.deleteMany({});

    // Create Users
    console.log("Creating Users...");
    await prisma.user.create({
        data: {
            id: teacherId,
            email: "teacher@example.com",
            password: hashedPassword,
            name: "Dr. Teacher",
            role: "teacher",
        }
    });

    await prisma.user.create({
        data: {
            id: learnerId,
            email: "learner@test.com",
            password: hashedPassword,
            name: "Learner One",
            role: "learner",
        }
    });

    // Create Cases
    console.log("Creating Cases...");
    await prisma.case.create({
        data: {
            id: caseId1,
            title: "Global Supply Chain Crisis 2024",
            content: "<p>The global supply chain is facing severe bottlenecks due to unforeseen geopolitical shifts...</p>",
            description: "Analyze the root causes of the 2024 supply chain blockages and propose actionable solutions.",
            status: "active",
            difficulty: "Hard",
            category: "Operations",
            teacherId: teacherId,
            attachments: JSON.stringify([{name: "report.pdf", url: "#"}]),
            update_history: JSON.stringify([{date: new Date().toISOString(), text: "Published case"}])
        }
    });

    await prisma.case.create({
        data: {
            id: caseId2,
            title: "Fintech Startup Expansion",
            content: "<p>A growing fintech startup is considering expanding into emerging markets...</p>",
            description: "Determine the viability and risks associated with expanding into Southeast Asia.",
            status: "draft",
            difficulty: "Medium",
            category: "Finance",
            teacherId: teacherId,
        }
    });

    await prisma.case.create({
        data: {
            id: caseId3,
            title: "Sustainable Packaging Initiative",
            content: "<p>A major retailer wants to transition 100% of its packaging to sustainable materials by 2030...</p>",
            description: "Evaluate the cost impact and brand equity changes from shifting to sustainable packaging.",
            status: "closed",
            difficulty: "Easy",
            category: "Marketing",
            teacherId: teacherId,
        }
    });

    // Create a Submission
    console.log("Creating Submissions...");
    await prisma.submission.create({
        data: {
            caseId: caseId1,
            learnerId: learnerId,
            status: "submitted",
            final_grade: 85,
            word_count: 500,
            keyword_count: 5,
            node_count: 3,
            has_conclusion: true,
            summary_text: "<p>The supply chain issues stem from labor shortages and misaligned transport networks.</p>",
            draft_nodes: JSON.stringify([
                { id: 'n1', type: 'problemNode', position: { x: 100, y: 100 }, data: { label: 'Labor shortage' } }
            ]),
        }
    });

    // Create Comments and Likes
    console.log("Creating Social Data...");
    await prisma.comment.create({
        data: {
            text: "This case is really complex, especially the geopolitical part.",
            caseId: caseId1,
            userId: learnerId
        }
    });

    await prisma.like.create({
        data: {
            caseId: caseId1,
            userId: learnerId
        }
    });

    console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
