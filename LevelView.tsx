import React, { useState, useEffect, useCallback } from 'react';
import { Level, Task, UserProgress, Language, ProjectCode, ValidationResult } from '../../types.ts';
import TaskDisplay from './TaskDisplay.tsx';
import CodeEditor from './CodeEditor.tsx';
import OutputPreview from './OutputPreview.tsx';
import FeedbackMessage from './FeedbackMessage.tsx';
import Button from '../ui/Button.tsx';
import ProgressBar from './ProgressBar.tsx';

interface LevelViewProps {
  level: Level;
  userProgress: UserProgress[string]; // Progress for this specific level
  onCompleteLevel: (levelId: string, finalProjectCode?: ProjectCode) => void;
  onTaskComplete: (levelId: string, taskId: string, projectCodeUpdate?: ProjectCode) => void;
  onExit: () => void;
}

const LevelView: React.FC<LevelViewProps> = ({ level, userProgress, onCompleteLevel, onTaskComplete, onExit }) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [userCode, setUserCode] = useState<string>('');
  const [feedback, setFeedback] = useState<ValidationResult | null>(null);
  const [projectCode, setProjectCode] = useState<ProjectCode>(userProgress.currentProjectCode || {});
  const [isSubmitting, setIsSubmitting] = useState(false);


  const currentTask = level.tasks[currentTaskIndex];

  useEffect(() => {
    // Find the first uncompleted task or set to tasks.length if all completed
    const firstUncompletedIndex = level.tasks.findIndex(task => !userProgress.completedTasks?.has(task.id));
    setCurrentTaskIndex(firstUncompletedIndex >= 0 ? firstUncompletedIndex : level.tasks.length);
    setProjectCode(userProgress.currentProjectCode || {});
  }, [level, userProgress]);
  
  useEffect(() => {
    if (currentTask) {
      let initialCode = '';
      if (typeof currentTask.starterCode === 'function') {
        initialCode = currentTask.starterCode(projectCode);
      } else {
        initialCode = currentTask.starterCode || '';
      }
      setUserCode(initialCode);
      setFeedback(null); // Clear feedback when task changes
    }
  }, [currentTask, projectCode]);

  const handleCodeChange = (newCode: string) => {
    setUserCode(newCode);
    if (feedback?.success) return; // Don't clear positive feedback immediately on typing
    setFeedback(null); // Clear (typically error) feedback when code changes
  };

  const handleSubmitCode = () => {
    if (!currentTask || isSubmitting) return;
    setIsSubmitting(true);

    const result = currentTask.validate(userCode, projectCode);
    setFeedback(result);

    if (result.success) {
      const updatedProjectCode = result.updatedProjectCode || projectCode;
      onTaskComplete(level.id, currentTask.id, updatedProjectCode);
      if (result.updatedProjectCode) {
        setProjectCode(result.updatedProjectCode);
      }
      
      // Check if this was the last task
      if (currentTaskIndex >= level.tasks.length - 1 || (userProgress.completedTasks && userProgress.completedTasks.size + 1 === level.tasks.length) ) {
         // All tasks completed for the level
         setTimeout(() => {
            onCompleteLevel(level.id, updatedProjectCode);
            setIsSubmitting(false);
         }, 1500);
      } else {
        // Automatically move to next task if current one is successful and not the last one
        setTimeout(() => {
           // setCurrentTaskIndex(prev => prev + 1); // This will be handled by useEffect on userProgress update
           // The useEffect watching [level, userProgress] will find the next uncompleted task.
           setFeedback(null); // Clear success message for next task
           setIsSubmitting(false);
        }, 1500);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  if (currentTaskIndex >= level.tasks.length && userProgress.isCompleted) {
    // All tasks for this level are completed (verified by userProgress.isCompleted)
    return (
      <div className="text-center p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold text-accent mb-4">Level Complete!</h2>
        <p className="text-gray-700 mb-6">Congratulations on finishing {level.title}!</p>
        <Button onClick={onExit} variant="success">
          Back to Levels
        </Button>
      </div>
    );
  }
  
  if (!currentTask) {
     // This might happen briefly if all tasks are marked complete but level itself not yet.
     // Or if currentTaskIndex is out of bounds due to rapid changes.
     // Check if level is actually completed.
    if (userProgress.isCompleted) {
        return (
          <div className="text-center p-8 bg-white shadow-lg rounded-lg">
            <h2 className="text-3xl font-bold text-accent mb-4">Level Complete!</h2>
            <p className="text-gray-700 mb-6">You've finished all tasks in {level.title}!</p>
            <Button onClick={onExit} variant="success">Back to Levels</Button>
          </div>
        );
    }
    return <div className="text-center p-8 text-gray-600">Loading task or all tasks completed...</div>;
  }
  
  const completedTasksCount = userProgress.completedTasks?.size || 0;
  const progressPercent = level.tasks.length > 0 ? (completedTasksCount / level.tasks.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">{level.title}</h2>
        <Button onClick={onExit} variant="ghost" size="sm">Exit Level</Button>
      </div>
      <ProgressBar percentage={progressPercent} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <TaskDisplay task={currentTask} taskNumber={currentTaskIndex + 1} totalTasks={level.tasks.length} />
          <CodeEditor
            language={currentTask.language}
            value={userCode}
            onChange={handleCodeChange}
          />
          <Button onClick={handleSubmitCode} disabled={isSubmitting || !!(feedback?.success)} className="w-full md:w-auto">
            {isSubmitting ? 'Checking...' : feedback?.success ? 'Correct!' : 'Check Code'}
          </Button>
          {feedback && <FeedbackMessage result={feedback} />}
        </div>
        <OutputPreview
          html={currentTask.language === Language.HTML ? userCode : projectCode.html}
          css={currentTask.language === Language.CSS ? userCode : projectCode.css}
          js={currentTask.language === Language.JavaScript ? userCode : projectCode.js}
          expectedOutput={currentTask.expectedOutputPreview}
        />
      </div>
    </div>
  );
};

export default LevelView;