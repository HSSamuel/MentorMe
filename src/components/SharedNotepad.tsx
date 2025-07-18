import React from "react";

// Define the props the component will accept
interface SharedNotepadProps {
  content: string;
  onContentChange: (newContent: string) => void;
  isOpen: boolean;
}

// A simple, clean style for the notepad
const notepadStyles: React.CSSProperties = {
  position: "absolute",
  top: "1rem",
  right: "1rem",
  width: "300px",
  height: "calc(100% - 2rem)",
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "0.75rem",
  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.3s ease-in-out",
  zIndex: 10,
};

const SharedNotepad = ({
  content,
  onContentChange,
  isOpen,
}: SharedNotepadProps) => {
  // Control visibility with a transform
  const dynamicStyle = {
    ...notepadStyles,
    transform: isOpen ? "translateX(0)" : "translateX(calc(100% + 2rem))",
  };

  return (
    <div style={dynamicStyle}>
      <h3
        style={{
          padding: "1rem",
          fontWeight: 600,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        Shared Notes
      </h3>
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Type your shared notes here..."
        style={{
          flex: 1,
          width: "100%",
          border: "none",
          padding: "1rem",
          fontSize: "0.9rem",
          lineHeight: 1.6,
          resize: "none",
          outline: "none",
          backgroundColor: "transparent",
          borderBottomLeftRadius: "0.75rem",
          borderBottomRightRadius: "0.75rem",
        }}
      />
    </div>
  );
};

export default SharedNotepad;
