import React from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler, // --- [THE FIX] 1. Import the Filler plugin ---
} from "chart.js";
import { useTheme } from "../contexts/ThemeContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler // --- [THE FIX] 2. Register the Filler plugin ---
);

const AdminChart = ({ type, data, label }) => {
  const { isDarkMode } = useTheme();

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: label,
        data: data.data,
        backgroundColor:
          type === "bar" ? "rgba(79, 70, 229, 0.7)" : "rgba(79, 70, 229, 0.2)",
        borderColor: "rgba(79, 70, 229, 1)",
        borderWidth: type === "bar" ? 1 : 2,
        tension: 0.4,
        fill: type === "line", // This line now works correctly
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: isDarkMode ? "#CBD5E1" : "#4A5568" },
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        ticks: { color: isDarkMode ? "#CBD5E1" : "#4A5568" },
        grid: { display: false },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  if (type === "bar") {
    return (
      <div style={{ height: "300px" }}>
        <Bar options={options} data={chartData} />
      </div>
    );
  }
  return (
    <div style={{ height: "300px" }}>
      <Line options={options} data={chartData} />
    </div>
  );
};

export default AdminChart;
