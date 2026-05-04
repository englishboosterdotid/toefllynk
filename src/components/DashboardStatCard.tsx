type DashboardStatCardProps = {
  label: string;
  value: string | number;
};

export default function DashboardStatCard({
  label,
  value,
}: DashboardStatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h3 className="text-gray-500">{label}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}