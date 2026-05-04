import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function StudentUpgradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const student = await prisma.studentAccount.findUnique({
    where: { id },
  });

  if (!student) return notFound();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        action="/api/student-upgrade"
        method="POST"
        className="w-[450px] bg-white rounded-3xl shadow p-8 space-y-4"
      >
        <h1 className="text-3xl font-bold text-center">Upgrade to Partner</h1>
        <p className="text-center text-gray-500">
          Your student email will be used as your TOEFLLYNK partner account identity.
        </p>

        <input type="hidden" name="studentId" value={student.id} />

        <input
          value={student.buyerEmail}
          readOnly
          className="w-full border p-3 rounded bg-gray-100"
        />

        <input
          name="username"
          placeholder="Choose Username"
          className="w-full border p-3 rounded"
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Create Password"
          className="w-full border p-3 rounded"
          required
        />

        <button className="w-full bg-black text-white py-3 rounded-full">
          Create Partner Account
        </button>
      </form>
    </main>
  );
}