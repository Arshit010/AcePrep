import { useEffect, useState } from "react";
import "./Meteors.css";

export const Meteors = ({ number = 20, className = "" }) => {
  const [meteorStyles, setMeteorStyles] = useState([]);

  useEffect(() => {
    const styles = Array.from({ length: number }).map(() => ({
      top: -5 + "px",
      left: Math.floor(Math.random() * (800 - -400) + -400) + "px",
      animationDelay: (Math.random() * 0.6 + 0.2).toFixed(2) + "s",
      animationDuration: Math.floor(Math.random() * 8 + 2) + "s",
    }));
    setMeteorStyles(styles);
  }, [number]);

  return (
    <>
      {meteorStyles.map((style, idx) => (
        <span
          key={"meteor" + idx}
          className={`meteor-span ${className}`}
          style={style}
        >
          <div className="meteor-tail" />
        </span>
      ))}
    </>
  );
};

export default Meteors;
