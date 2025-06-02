import React from 'react';
import { Level, UserProgress } from '../../types.ts';
import Button from '../ui/Button.tsx';
import Card from '../ui/Card.tsx';

interface LevelSelectorProps {
  levels: Level[];
  userProgress: UserProgress;
  onSelectLevel: (levelId: string) => void;
  highestLevelUnlocked: string;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({ levels, userProgress, onSelectLevel, highestLevelUnlocked }) => {
  const getLevelStatus = (level: Level) => {
    const progress = userProgress[level.id];
    const levelIndex = levels.findIndex(l => l.id === level.id);
    const highestUnlockedIndex = levels.findIndex(l => l.id === highestLevelUnlocked);

    if (progress?.isCompleted) return 'completed';
    if (levelIndex <= highestUnlockedIndex) return 'unlocked';
    return 'locked';
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Choose Your Challenge</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {levels.map((level) => {
          const status = getLevelStatus(level);
          const isLocked = status === 'locked';
          const isCompleted = status === 'completed';

          return (
            <Card key={level.id} className={`transform transition-all duration-300 hover:scale-105 ${isLocked ? 'opacity-60 bg-gray-50' : 'hover:shadow-xl'}`}>
              <div className="flex flex-col items-center text-center p-2"> {/* Added small padding to card content area */}
                <div className={`text-4xl mb-3 ${isCompleted ? 'text-accent' : isLocked ? 'text-gray-400' : 'text-primary'}`}>{level.icon || '🎯'}</div>
                <h3 className={`text-xl font-semibold mb-2 ${isLocked ? 'text-gray-500' : 'text-gray-800'}`}>{level.title}</h3>
                <p className={`text-sm text-gray-600 mb-4 h-16 overflow-hidden ${isLocked ? 'text-gray-400' : ''}`}>{level.description}</p>
                <Button 
                  onClick={() => onSelectLevel(level.id)} 
                  disabled={isLocked}
                  variant={isCompleted ? 'success' : 'primary'}
                  className="w-full mt-auto" // Ensure button is at the bottom if content height varies
                >
                  {isCompleted ? 'Review' : isLocked ? 'Locked' : 'Start Level'}
                </Button>
                {isCompleted && <div className="mt-2 text-xs text-accent font-semibold">Level Completed!</div>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LevelSelector;