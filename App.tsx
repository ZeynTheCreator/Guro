import React, { useState, useEffect, useCallback } from 'react';
import { AppView, Level, UserProgress, ProjectCode } from './types.ts';
import { LEVELS } from './constants/levels.ts';
import Header from './components/layout/Header.tsx';
import LevelSelector from './components/learning/LevelSelector.tsx';
import LevelView from './components/learning/LevelView.tsx';
import Footer from './components/layout/Footer.tsx';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('level_selector');
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const savedProgress = localStorage.getItem('guroUserProgress');
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      // Restore Set objects
      Object.keys(parsed).forEach(levelId => {
        if (parsed[levelId].completedTasks && !(parsed[levelId].completedTasks instanceof Set)) {
          // Ensure completedTasks is an array before creating a Set from it
          if (Array.isArray(parsed[levelId].completedTasks)) {
            parsed[levelId].completedTasks = new Set(parsed[levelId].completedTasks);
          } else {
            parsed[levelId].completedTasks = new Set(); // Initialize as empty Set if data is malformed
          }
        } else if (!parsed[levelId].completedTasks) {
           parsed[levelId].completedTasks = new Set(); // Initialize if missing
        }
      });
      return parsed;
    }
    return {};
  });
  
  const [highestLevelUnlocked, setHighestLevelUnlocked] = useState<string>('1');

  useEffect(() => {
    localStorage.setItem('guroUserProgress', JSON.stringify(userProgress, (key, value) => {
      if (value instanceof Set) {
        return Array.from(value);
      }
      return value;
    }));

    // Determine highest unlocked level
    let maxUnlocked = "1";
    const initialLevel = LEVELS[0];
    if (!initialLevel) { // Should not happen if LEVELS is populated
        setHighestLevelUnlocked("1");
        return;
    }

    let allLevelsCompleted = true;
    for (const level of LEVELS) {
        if (userProgress[level.id]?.isCompleted) {
            const nextLevel = LEVELS.find(l => l.id === level.unlocksNextLevel);
            if (nextLevel) {
                maxUnlocked = nextLevel.id;
            } else if (!level.unlocksNextLevel) { // This is a last level in a sequence or the absolute last level
                 maxUnlocked = level.id; 
            }
        } else {
            // This level is not completed. It's the highest unlockable if previous was completed OR it's the first level.
            const levelIndex = LEVELS.findIndex(l => l.id === level.id);
            if (levelIndex === 0) { // First level
                maxUnlocked = level.id;
            } else {
                const prevLevel = LEVELS[levelIndex - 1];
                if (userProgress[prevLevel.id]?.isCompleted) {
                    maxUnlocked = level.id;
                } else {
                  // If previous level is not completed, maxUnlocked should be the first uncompleted level from start.
                  // This part of logic is a bit tricky, let's trace from the beginning for the first uncompleted.
                  for(let i=0; i < LEVELS.length; i++) {
                    if(!userProgress[LEVELS[i].id]?.isCompleted) {
                      maxUnlocked = LEVELS[i].id;
                      break;
                    }
                    if(i === LEVELS.length - 1) { // all levels completed
                       maxUnlocked = LEVELS[i].id;
                    }
                  }
                }
            }
            allLevelsCompleted = false;
            break; 
        }
    }
    
    if (allLevelsCompleted && LEVELS.length > 0) {
        maxUnlocked = LEVELS[LEVELS.length - 1].id; // If all levels are completed, the highest is the last one.
    } else if (LEVELS.length === 0) {
        maxUnlocked = "1"; // Default if no levels
    }


     setHighestLevelUnlocked(maxUnlocked);

  }, [userProgress]);

  const selectLevel = useCallback((levelId: string) => {
    const levelExists = LEVELS.find(l => l.id === levelId);
    if (!levelExists) return;

    const levelIndex = LEVELS.findIndex(l => l.id === levelId);
    const highestUnlockedIndex = LEVELS.findIndex(l => l.id === highestLevelUnlocked);
    
    if (levelIndex <= highestUnlockedIndex) {
      setCurrentLevelId(levelId);
      setCurrentView('level_view');
    } else {
      // Find the first locked level to provide a more accurate message
      let firstLockedMessage = "Complete previous levels to unlock this one!";
      if (highestUnlockedIndex + 1 < LEVELS.length) {
        firstLockedMessage = `Please complete "${LEVELS[highestUnlockedIndex].title}" to unlock "${LEVELS[highestUnlockedIndex+1].title}".`;
      }
      alert(firstLockedMessage);
    }
  }, [highestLevelUnlocked]);

  const completeLevel = useCallback((levelId: string, finalProjectCode?: ProjectCode) => {
    const level = LEVELS.find(l => l.id === levelId);
    setUserProgress(prev => ({
      ...prev,
      [levelId]: {
        ...(prev[levelId] || { completedTasks: new Set(), currentProjectCode: {} }),
        isCompleted: true,
        currentProjectCode: finalProjectCode || prev[levelId]?.currentProjectCode || {},
      }
    }));
    if (level?.unlocksNextLevel) {
      // The useEffect on userProgress will handle updating highestLevelUnlocked
    } else {
      // If it's the last level or no next level defined, ensure highestLevelUnlocked reflects this
      // This is also handled by the useEffect
    }
    setCurrentView('level_selector');
    setCurrentLevelId(null);
  }, []);

  const updateTaskProgress = useCallback((levelId: string, taskId: string, projectCodeUpdate?: ProjectCode) => {
    setUserProgress(prev => {
      const currentLevelProgress = prev[levelId] || { completedTasks: new Set(), currentProjectCode: {}, isCompleted: false };
      const newCompletedTasks = new Set(currentLevelProgress.completedTasks);
      newCompletedTasks.add(taskId);
      
      const updatedLevelData = {
        ...currentLevelProgress,
        completedTasks: newCompletedTasks,
        currentProjectCode: projectCodeUpdate || currentLevelProgress.currentProjectCode,
      };

      // Check if all tasks in this level are now complete
      const levelDefinition = LEVELS.find(l => l.id === levelId);
      if (levelDefinition && newCompletedTasks.size === levelDefinition.tasks.length) {
        updatedLevelData.isCompleted = true;
      }
      
      return {
        ...prev,
        [levelId]: updatedLevelData
      };
    });
  }, []);
  
  const getCurrentLevel = (): Level | undefined => {
    return LEVELS.find(level => level.id === currentLevelId);
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {currentView === 'level_selector' && (
          <LevelSelector
            levels={LEVELS}
            userProgress={userProgress}
            onSelectLevel={selectLevel}
            highestLevelUnlocked={highestLevelUnlocked}
          />
        )}
        {currentView === 'level_view' && currentLevelId && getCurrentLevel() && (
          <LevelView
            level={getCurrentLevel()!}
            userProgress={userProgress[currentLevelId] || { completedTasks: new Set(), currentProjectCode: {}, isCompleted: false }}
            onCompleteLevel={completeLevel}
            onTaskComplete={updateTaskProgress}
            onExit={() => { setCurrentView('level_selector'); setCurrentLevelId(null); }}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;