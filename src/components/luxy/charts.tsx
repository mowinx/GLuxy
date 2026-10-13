import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

const COLORS = ["#6d4aff", "#3b82f6", "#f59e0b", "#22c55e", "#ec4899", "#14b8a6"];

export function LineBlock({ data, dataKey = "value" }: { data: { name: string; value: number }[]; dataKey?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(true), []);
  if (!on) return <div className="h-56 rounded-xl bg-page" />;
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#ececf4" />
          <XAxis dataKey="name" tick={{ fill: "#6b6785", fontSize: 12 }} />
          <YAxis tick={{ fill: "#6b6785", fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke="#6d4aff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutBlock({ data }: { data: { name: string; value: number }[] }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(true), []);
  const rows = data.filter((d) => d.value > 0);
  if (!on) return <div className="h-56" />;
  if (!rows.length) return <p className="text-sm text-muted">No released earnings yet.</p>;
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72}>
            {rows.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
