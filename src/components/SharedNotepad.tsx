import React from "react";
import "./SharedNotepad.css"; // Make sure this CSS file is next to the component

interface SharedNotepadProps {
  content: string;
  onContentChange: (newContent: string) => void;
  isOpen: boolean;
  theme: "light" | "dark"; // Add the theme prop
}

const SharedNotepad = ({
  content,
  onContentChange,
  isOpen,
  theme,
}: SharedNotepadProps) => {
  // Add the theme to the class list
  const notepadClasses = `notepad-container ${isOpen ? "open" : ""} ${theme}`;

  return (
    <div className={notepadClasses}>
      <h3 className="notepad-header">Shared Notes</h3>
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Type your shared notes here..."
        className="notepad-textarea"
      />
    </div>
  );
};

export default SharedNotepad;
