import React from 'react';
import { Task } from '../../types.ts';
import Card from '../ui/Card.tsx';

interface TaskDisplayProps {
  task: Task;
  taskNumber: number;
  totalTasks: number;
}

const TaskDisplay: React.FC<TaskDisplayProps> = ({ task, taskNumber, totalTasks }) => {
  return (
    <Card title={`Task ${taskNumber} of ${totalTasks}: ${task.language}`}>
      <p className="text-lg text-gray-700 mb-2">{task.instruction}</p>
      {task.longDescription && <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">{task.longDescription}</p>}
      {task.hint && <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-md border border-blue-200">💡 Hint: {task.hint}</p>}
    </Card>
  );
};

export default TaskDisplay;