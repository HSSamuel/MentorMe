export const formatLastSeen = (lastSeen: string | Date | undefined): string => {
  if (!lastSeen) return "N/A";

  const date = new Date(lastSeen);
  const now = new Date();

  const diffMinutes = Math.round(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffMinutes < 1) {
    return "Online"; // Or "Just now" if you consider active connection as online
  } else if (diffMinutes < 60) {
    return `Last seen ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `Last seen ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays === 1) {
    return "Last seen yesterday";
  } else if (diffDays < 7) {
    return `Last seen ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else {
    // Format as "Jan 1, 2023"
    return `Last seen ${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }
};
