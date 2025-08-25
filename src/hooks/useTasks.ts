import { useState, useEffect } from 'react';
import { Task } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedTasks = await taskService.getTasks(user.id);
      setTasks(fetchedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user?.id]);

  const addTask = async (taskData: Omit<Task, 'id' | 'dateCreated'>) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const taskId = await taskService.addTask(user.id, taskData);
      const newTask: Task = {
        id: taskId,
        ...taskData,
        dateCreated: new Date().toISOString(),
      };
      setTasks(prev => [newTask, ...prev]);
      return taskId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateTask = async (taskId: string, taskData: Partial<Task>) => {
    try {
      await taskService.updateTask(taskId, taskData);
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, ...taskData }
          : task
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getTasksByCustomer = (customerId: string) => {
    return tasks.filter(task => task.customerId === customerId);
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  const getTodaysTasks = () => {
    const today = new Date().toDateString();
    return tasks.filter(task => {
      const taskDate = new Date(task.dateDue).toDateString();
      return taskDate === today && task.status !== 'completed';
    });
  };

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    getTasksByCustomer,
    getTasksByStatus,
    getTodaysTasks,
    refetch: loadTasks,
  };
};