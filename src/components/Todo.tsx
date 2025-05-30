/**
 * @fileoverview This file defines the Todo component, a client-side application
 * for managing tasks. It supports CRUD (Create, Read, Update, Delete) operations
 * for tasks, allows associating tasks with projects, and provides filtering
 * capabilities. The component uses Apollo Client for GraphQL communication with
 * a backend server to persist and retrieve task and project data.
 */
'use client';

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { format } from 'date-fns';
import { PlusIcon, TrashIcon, CheckIcon } from 'lucide-react';

// GraphQL queries and mutations

/** GraphQL query to fetch all tasks along with their associated project details. */
const GET_TASKS = gql`
  query GetTasks {
    tasks {
      id
      title
      description
      status
      dueDate
      priority
      projectId
      project {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

/** GraphQL mutation to create a new task. */
const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      description
      status
      dueDate
      priority
      projectId
    }
  }
`;

/** GraphQL mutation to update an existing task (e.g., its status or title). */
const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      title
      status
      updatedAt
    }
  }
`;

/** GraphQL mutation to delete a task by its ID. */
const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

/** GraphQL query to fetch all available projects, typically for populating a dropdown. */
const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
    }
  }
`;

/**
 * Represents a Task object with its properties.
 */
interface Task {
  /** Unique identifier for the task. */
  id: string;
  /** The title or name of the task. */
  title: string;
  /** Optional detailed description of the task. */
  description?: string;
  /** Current status of the task. */
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  /** Optional due date for the task (ISO string format). */
  dueDate?: string;
  /** Priority level of the task (e.g., 1 for Low, 2 for Medium, 3 for High). */
  priority: number;
  /** Optional ID of the project this task belongs to. */
  projectId?: string;
  /** Optional associated project details. */
  project?: {
    id: string;
    name: string;
  };
  /** Timestamp of when the task was created (ISO string format). */
  createdAt: string;
  /** Timestamp of the last update to the task (ISO string format). */
  updatedAt: string;
}

/**
 * Represents a Project object, typically used for associating tasks.
 */
interface Project {
  /** Unique identifier for the project. */
  id: string;
  /** Name of the project. */
  name: string;
}

/**
 * `Todo` is a client-side component that provides a full-featured Todo list application interface.
 * It allows users to create, view, update (status), and delete tasks. Tasks can be associated
 * with projects, and the list of tasks can be filtered by status.
 *
 * State Management:
 * - `newTask`: Object holding the data for a new task being entered in the form.
 * - `projects`: Array of `Project` objects, fetched from the backend, used to populate the project selection dropdown.
 * - `filter`: String indicating the current filter applied to the task list (e.g., 'ALL', 'COMPLETED').
 *
 * GraphQL Interaction (using Apollo Client):
 * - `useQuery(GET_TASKS)`: Fetches all tasks. Includes `refetch` function to refresh the list after mutations.
 * - `useQuery(GET_PROJECTS)`: Fetches all projects. `onCompleted` handler populates the `projects` state.
 *   Uses `fetchPolicy: 'network-only'` to ensure fresh project data.
 * - `useMutation(CREATE_TASK)`: For creating new tasks. `onCompleted` clears the form and refetches tasks.
 *   `onError` logs errors and shows an alert.
 * - `useMutation(UPDATE_TASK)`: For updating task status. `onCompleted` refetches tasks.
 *   `onError` logs errors and shows an alert.
 * - `useMutation(DELETE_TASK)`: For deleting tasks. `onCompleted` refetches tasks.
 *   `onError` logs errors and shows an alert.
 *
 * Form Handling:
 * - `handleInputChange`: Updates the `newTask` state as the user types in the form fields.
 * - `handleCreateTask`: Validates that the task title is provided. Constructs the input object
 *   (parsing priority, handling optional fields) and calls the `createTask` mutation.
 *
 * Task Actions:
 * - `handleStatusChange`: Called when a task's status is changed via the dropdown in the task item
 *   or when the "Mark as completed" button is clicked. Calls the `updateTask` mutation.
 * - `handleDeleteTask`: Shows a `confirm()` dialog before calling the `deleteTask` mutation.
 *
 * UI Features:
 * - **Filtering**: Buttons allow users to filter the task list by status ('ALL', 'NOT_STARTED', etc.).
 *   The `filteredTasks` memoized variable holds the tasks matching the current `filter`.
 * - **New Task Form**: A form with fields for title, description, due date, priority (select dropdown),
 *   and project (select dropdown populated from `projects` state).
 * - **Task List Rendering**:
 *   - Displays tasks in a list format.
 *   - Shows task title, description (if any), status (with a colored badge using `getStatusColor`),
 *     priority (with a label and color using `getPriorityLabel` and `getPriorityColor`),
 *     associated project name, creation date, and due date (formatted using `date-fns`).
 *   - Provides controls for each task: a "Mark as completed" button (if not already completed) and a delete button.
 *   - Allows changing the status of non-completed/non-cancelled tasks via a dropdown.
 * - **Loading/Error States**: Displays messages for loading tasks or if an error occurs during the initial task fetch.
 *
 * Helper Functions:
 * - `getStatusColor`: Returns Tailwind CSS classes for styling status badges based on the task status.
 * - `getPriorityLabel`: Returns a user-friendly string for the priority level (e.g., "Low", "Medium", "High").
 * - `getPriorityColor`: Returns Tailwind CSS text color classes for styling priority labels.
 *
 * @returns {React.JSX.Element} The rendered Todo list application UI.
 */
export default function Todo() {
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    status: 'NOT_STARTED',
    priority: 1,
    projectId: '',
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState('ALL');

  // Fetch tasks
  const { data, loading, error, refetch } = useQuery(GET_TASKS);
  
  // Fetch projects for dropdown
  useQuery(GET_PROJECTS, {
    onCompleted: (data) => {
      console.log('Projects data received:', data);
      if (data?.projects && Array.isArray(data.projects)) {
        setProjects(data.projects);
      } else {
        console.warn('No projects data available or invalid format - using empty array');
        setProjects([]);
      }
    },
    onError: (error) => {
      console.error('Error fetching projects:', error);
      // Set projects to empty array to avoid rendering issues
      setProjects([]);
    },
    // Add fetchPolicy to ensure we always go to the network
    fetchPolicy: 'network-only'
  });

  // Mutations
  const [createTask] = useMutation(CREATE_TASK, {
    onCompleted: () => {
      setNewTask({
        title: '',
        description: '',
        dueDate: '',
        status: 'NOT_STARTED',
        priority: 1,
        projectId: '',
      });
      refetch();
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      alert(`Failed to create task: ${error.message}`);
    }
  });

  const [updateTask] = useMutation(UPDATE_TASK, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      alert(`Failed to update task: ${error.message}`);
    }
  });

  const [deleteTask] = useMutation(DELETE_TASK, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      alert(`Failed to delete task: ${error.message}`);
    }
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask({
      ...newTask,
      [name]: value
    });
  };

  // Handle task creation
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newTask.title.trim()) {
      alert('Task title is required');
      return;
    }
    
    const taskInput = {
      ...newTask,
      priority: parseInt(newTask.priority.toString()),
      projectId: newTask.projectId || undefined,
      dueDate: newTask.dueDate || undefined,
    };
    
    createTask({ variables: { input: taskInput } });
  };

  // Handle status change
  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTask({
      variables: {
        id: taskId,
        input: { status: newStatus }
      }
    });
  };

  // Handle task deletion
  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask({ variables: { id: taskId } });
    }
  };

  // Filter tasks based on status
  const filteredTasks = data?.tasks?.filter((task: Task) => {
    if (filter === 'ALL') return true;
    return task.status === filter;
  }) || [];

  // Status badge color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Priority level formatting
  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Low';
      case 2: return 'Medium';
      case 3: return 'High';
      default: return 'Low';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-gray-500';
      case 2: return 'text-yellow-500';
      case 3: return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) return <div className="flex justify-center p-6">Loading tasks...</div>;
  if (error) return <div className="text-red-500 p-6">Error loading tasks: {error.message}</div>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
      {/* Filter controls */}
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${filter === 'ALL' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
        >
          All
        </button>
        <button 
          onClick={() => setFilter('NOT_STARTED')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${filter === 'NOT_STARTED' ? 'bg-gray-300 text-gray-800' : 'bg-gray-100 text-gray-800'}`}
        >
          Not Started
        </button>
        <button 
          onClick={() => setFilter('IN_PROGRESS')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${filter === 'IN_PROGRESS' ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
        >
          In Progress
        </button>
        <button 
          onClick={() => setFilter('COMPLETED')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${filter === 'COMPLETED' ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-800'}`}
        >
          Completed
        </button>
        <button 
          onClick={() => setFilter('CANCELLED')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${filter === 'CANCELLED' ? 'bg-red-200 text-red-800' : 'bg-gray-100 text-gray-800'}`}
        >
          Cancelled
        </button>
      </div>

      {/* New task form */}
      <form onSubmit={handleCreateTask} className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Add New Task</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={newTask.title}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              placeholder="Task title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={newTask.dueDate}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              name="priority"
              value={newTask.priority}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
            >
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              name="projectId"
              value={newTask.projectId}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
            >
              <option value="">No Project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={newTask.description}
              onChange={handleInputChange}
              rows={2}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              placeholder="Task description"
            ></textarea>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Task
          </button>
        </div>
      </form>

      {/* Task list */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Your Tasks</h3>
        {filteredTasks.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No tasks found</p>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task: Task) => (
              <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-md font-medium text-gray-900">{task.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(task.status)}`}>
                        {task.status?.replace(/_/g, ' ')}
                      </span>
                      {task.priority && (
                        <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)} Priority
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center text-xs text-gray-500 space-x-2">
                      {task.project && (
                        <span className="bg-gray-100 px-2 py-1 rounded-full">
                          {task.project.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span>
                          Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      )}
                      <span>
                        Created: {format(new Date(task.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {task.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Mark as completed"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Delete task"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                  <div className="mt-3 border-t pt-3">
                    <div className="flex space-x-2">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className="text-sm rounded border-gray-300 py-1"
                      >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 