import { useEffect, useRef } from "react";

const useCountAnimation = (
  balanceTarget,
  goalTarget,
  setBalance,
  setGoalSaved,
  setProgress,
  duration = 2000 
) => {
  const requestRef = useRef();
  const startRef = useRef();

  // to avoid React re-rendering every frame
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    setBalance(0);
    setGoalSaved(0);
    setProgress(0);

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;

      const elapsed = timestamp - startRef.current;
      const t = Math.min(elapsed / duration, 1);

      // smooth quintic ease-out
      const ease = 1 - Math.pow(1 - t, 4);

      // only update state every 50ms (20fps)
      if (timestamp - lastUpdateRef.current > 50) {
        lastUpdateRef.current = timestamp;

        setBalance(balanceTarget * ease);
        setGoalSaved(goalTarget * ease);
        setProgress((goalTarget / 500) * 100 * ease);
      }

      if (t < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        // final snap for perfect accuracy
        setBalance(balanceTarget);
        setGoalSaved(goalTarget);
        setProgress((goalTarget / 500) * 100);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(requestRef.current);
      startRef.current = null;
      lastUpdateRef.current = 0;
    };
  }, [balanceTarget, goalTarget, duration]);
};

export default useCountAnimation;
