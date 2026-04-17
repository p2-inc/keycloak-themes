type ColorPickerProps = {
  color: string;
  onChange: (color: string) => void;
};

export const ColorPicker = ({ color, onChange }: ColorPickerProps) => {
  return (
    <input
      type="color"
      value={color}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: 28,
        height: 28,
        padding: 0,
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
        background: "none",
      }}
    />
  );
};
