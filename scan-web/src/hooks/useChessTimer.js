import { useState, useEffect, useRef, useCallback } from 'react';

export function useChessTimer(timeControl) {
  // Refs for stable values
  const timeControlRef = useRef(timeControl);
  const initialSecondsRef = useRef(0);

  // Update refs and state when timeControl changes
  useEffect(() => {
    timeControlRef.current = timeControl;
    if (timeControl && timeControl.minutes !== Infinity) {
      const seconds = timeControl.minutes * 60;
      initialSecondsRef.current = seconds;
      setWhiteTime(seconds);
      setBlackTime(seconds);
      console.log(`⏱️ TimeControl changed: ${timeControl.name} - ${seconds}s per player`);
    } else {
      initialSecondsRef.current = Infinity;
      setWhiteTime(Infinity);
      setBlackTime(Infinity);
      console.log('⏱️ TimeControl changed: Unlimited');
    }
    // Reset other timer state when time control changes
    setIsWhiteTurn(true);
    setGameActive(false);
    setWhiteTimedOut(false);
    setBlackTimedOut(false);
  }, [timeControl]);

  // State
  const [whiteTime, setWhiteTime] = useState(() => {
    return timeControl && timeControl.minutes !== Infinity 
      ? timeControl.minutes * 60 
      : Infinity;
  });
  const [blackTime, setBlackTime] = useState(() => {
    return timeControl && timeControl.minutes !== Infinity 
      ? timeControl.minutes * 60 
      : Infinity;
  });
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [gameActive, setGameActive] = useState(false);
  const [whiteTimedOut, setWhiteTimedOut] = useState(false);
  const [blackTimedOut, setBlackTimedOut] = useState(false);

  // Refs
  const timerIntervalRef = useRef(null);
  const onTimeoutRef = useRef(null);

  // Debug logging
  useEffect(() => {
    console.log(`⏱️ Timer state - White: ${whiteTime}s, Black: ${blackTime}s, Active: ${gameActive}, Turn: ${isWhiteTurn ? 'White' : 'Black'}`);
  }, [whiteTime, blackTime, gameActive, isWhiteTurn]);

  // Register timeout callback
  const setOnTimeout = useCallback((callback) => {
    onTimeoutRef.current = callback;
  }, []);

  // Timer interval - decrement active player's time
  useEffect(() => {
    // Don't run timer if not active, no time control, or unlimited time
    if (!gameActive || !timeControlRef.current || initialSecondsRef.current === Infinity) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    console.log(`⏱️ Starting timer interval. Active: ${gameActive}, TimeControl: ${timeControlRef.current?.name}`);

    timerIntervalRef.current = setInterval(() => {
      if (isWhiteTurn) {
        // White's turn - decrement white time
        setWhiteTime((prevWhiteTime) => {
          if (prevWhiteTime === Infinity) return Infinity; // Don't decrement infinite time
          if (prevWhiteTime <= 1) {
            setWhiteTimedOut(true);
            if (onTimeoutRef.current) {
              onTimeoutRef.current('white');
            }
            return 0;
          }
          return prevWhiteTime - 1;
        });
      } else {
        // Black's turn - decrement black time
        setBlackTime((prevBlackTime) => {
          if (prevBlackTime === Infinity) return Infinity; // Don't decrement infinite time
          if (prevBlackTime <= 1) {
            setBlackTimedOut(true);
            if (onTimeoutRef.current) {
              onTimeoutRef.current('black');
            }
            return 0;
          }
          return prevBlackTime - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [gameActive, isWhiteTurn]);

  // Switch turn and add increment
  const switchTurn = useCallback(() => {
    if (!timeControlRef.current) {
      return;
    }

    setIsWhiteTurn((prevIsWhite) => {
      const initialSecs = initialSecondsRef.current;
      const increment = timeControlRef.current?.increment || 0;

      if (prevIsWhite) {
        // White just moved, add increment to white
        setWhiteTime((prevTime) => {
          if (prevTime === Infinity) return Infinity;
          const newTime = prevTime + increment;
          return Math.min(newTime, initialSecs);
        });
      } else {
        // Black just moved, add increment to black
        setBlackTime((prevTime) => {
          if (prevTime === Infinity) return Infinity;
          const newTime = prevTime + increment;
          return Math.min(newTime, initialSecs);
        });
      }

      return !prevIsWhite;
    });
  }, []);

  // Start the game timer
  const startTimer = useCallback(() => {
    console.log('⏱️ startTimer called');
    setGameActive(true);
  }, []);

  // Pause the game timer
  const pauseTimer = useCallback(() => {
    console.log('⏱️ pauseTimer called');
    setGameActive(false);
  }, []);

  // Resume the game timer
  const resumeTimer = useCallback(() => {
    console.log('⏱️ resumeTimer called');
    setGameActive(true);
  }, []);

  // Reset timer to initial times
  const resetTimer = useCallback(() => {
    console.log(`⏱️ resetTimer called - initialSeconds: ${initialSecondsRef.current}`);
    setWhiteTime(initialSecondsRef.current);
    setBlackTime(initialSecondsRef.current);
    setIsWhiteTurn(true);
    setGameActive(false);
    setWhiteTimedOut(false);
    setBlackTimedOut(false);
  }, []);

  // Get formatted time string (MM:SS)
  const formatTime = useCallback((seconds) => {
    if (seconds === Infinity) {
      return '∞';
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get time color based on remaining time
  const getTimeColor = useCallback((seconds) => {
    if (seconds <= 0) {
      return '#ef4444'; // Red - time is up
    }
    if (seconds <= 5) {
      return '#dc2626'; // Dark red - critical
    }
    if (seconds <= 10) {
      return '#f59e0b'; // Orange - low time warning
    }
    return '#3b82f6'; // Blue - normal
  }, []);

  return {
    whiteTime,
    blackTime,
    isWhiteTurn,
    gameActive,
    whiteTimedOut,
    blackTimedOut,
    formatTime,
    getTimeColor,
    switchTurn,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setOnTimeout,
  };
}
