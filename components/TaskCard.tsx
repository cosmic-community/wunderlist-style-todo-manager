'use client'

import { useState, useEffect, useRef } from 'react'
import { Task, List } from '@/types'
import { Trash2 } from 'lucide-react'
import EditTaskModal from '@/components/EditTaskModal'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/components/ThemeProvider'

interface TaskCardProps {
  task: Task
  lists: List[]
  onOptimisticToggle: (taskId: string) => void
  onOptimisticDelete: (taskId: string) => void
  onOptimisticUpdate: (taskId: string, updates: Partial<Task['metadata']>) => void
  onSyncComplete?: (taskId: string) => void
  // Changed: Added callback to notify parent when task should be removed after animation
  onAnimationComplete?: (taskId: string) => void
}

// Changed: Simplified confetti particle without overflow issues
function ConfettiParticle({ delay, color, index, total }: { delay: number; color: string; index: number; total: number }) {
  // Calculate angle in radians for true circular distribution
  const angle = (index / total) * Math.PI * 2
  
  return (
    <div
      className="absolute w-2 h-2 rounded-full animate-confetti pointer-events-none"
      style={{
        backgroundColor: color,
        left: '50%',
        top: '50%',
        animationDelay: `${delay}ms`,
        '--confetti-angle': `${angle}rad`,
      } as React.CSSProperties}
    />
  )
}

export default function TaskCard({ 
  task, 
  lists,
  onOptimisticToggle,
  onOptimisticDelete,
  onOptimisticUpdate,
  onSyncComplete,
  onAnimationComplete
}: TaskCardProps) {
  // Changed: Get checkbox position from user preferences
  const { user } = useAuth()
  const { styleTheme } = useTheme()
  const checkboxPosition = user?.checkbox_position || 'left'
  
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  // Changed: Track if task should be hidden (removed completely after animation)
  const [shouldHide, setShouldHide] = useState(false)
  // Changed: Add state for edit modal
  const [showEditModal, setShowEditModal] = useState(false)
  // Changed: Track if we should show the checkmark (delayed state update)
  const [showCheckmark, setShowCheckmark] = useState(task.metadata.completed)
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Changed: Track previous completed state with ref to detect transitions
  const prevCompletedRef = useRef(task.metadata.completed)
  
  useEffect(() => {
    // Changed: If task just became completed (wasn't before, is now)
    if (!prevCompletedRef.current && task.metadata.completed) {
      // Changed: Show checkmark immediately for visual feedback
      setShowCheckmark(true)
      setShowCelebration(true)
      setShouldHide(false)
      
      // Changed: Wait for confetti animation to complete (600ms) then instantly remove
      // The confetti animation is 0.6s, so we wait for it to finish
      const removeTimer = setTimeout(() => {
        setShowCelebration(false)
        setShouldHide(true)
        // Changed: Notify parent to remove this task from the celebrating list
        if (onAnimationComplete) {
          onAnimationComplete(task.id)
        }
      }, 600) // Match the confetti animation duration exactly
      
      return () => {
        clearTimeout(removeTimer)
      }
    } else if (prevCompletedRef.current && !task.metadata.completed) {
      // Changed: Task was uncompleted, reset states
      setShowCheckmark(false)
      setShowCelebration(false)
      setShouldHide(false)
    }
    
    // Changed: Update ref after checking
    prevCompletedRef.current = task.metadata.completed
  }, [task.metadata.completed, task.id, onAnimationComplete])
  
  // Changed: Sync showCheckmark with task state for non-animated updates
  useEffect(() => {
    if (!showCelebration) {
      setShowCheckmark(task.metadata.completed)
    }
  }, [task.metadata.completed, showCelebration])
  
  const handleToggleComplete = async () => {
    if (isUpdating) return
    setIsUpdating(true)
    
    // Optimistic update - instant feedback
    onOptimisticToggle(task.id)
    
    // Background sync with server
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.metadata.completed })
      })
      
      if (response.ok && onSyncComplete) {
        // Server confirmed the change, clear pending state
        onSyncComplete(task.id)
      }
    } catch (error) {
      console.error('Error toggling task:', error)
      // Revert on error
      onOptimisticToggle(task.id)
    } finally {
      setIsUpdating(false)
    }
  }
  
  // Changed: Direct delete without confirmation
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDeleting) return
    
    setIsDeleting(true)
    
    // Optimistic delete - instant feedback
    onOptimisticDelete(task.id)
    
    // Background sync with server
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error deleting task:', error)
      // Note: We don't revert on error since the task is already removed from UI
      // A page refresh will restore it if the delete failed
    } finally {
      setIsDeleting(false)
    }
  }
  
  // Changed: Handler for clicking the card area (not the checkbox)
  const handleCardClick = () => {
    setShowEditModal(true)
  }
  
  // Changed: Theme-aware confetti colors
  const getConfettiColors = () => {
    switch (styleTheme) {
      case 'ocean':
        return ['#06b6d4', '#0891b2', '#22d3ee', '#67e8f9', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4']
      case 'forest':
        return ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#84cc16', '#a3e635', '#bef264', '#d9f99d']
      case 'sunset':
        return ['#f97316', '#ea580c', '#fb923c', '#fdba74', '#ef4444', '#f87171', '#fca5a5', '#fecaca']
      default: // default blue
        return ['#3b82f6', '#2563eb', '#60a5fa', '#93c5fd', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']
    }
  }
  
  const confettiColors = getConfettiColors()

  // Changed: Checkbox component for reuse
  const CheckboxButton = (
    <div className="relative flex-shrink-0 flex items-center">
      {/* Changed: Confetti celebration that radiates outward from center */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-[5]">
          {confettiColors.map((color, i) => (
            <ConfettiParticle key={`a-${i}`} delay={i * 25} color={color} index={i} total={confettiColors.length} />
          ))}
          {confettiColors.map((color, i) => (
            <ConfettiParticle key={`b-${i}`} delay={i * 25 + 60} color={color} index={i + confettiColors.length} total={confettiColors.length * 2} />
          ))}
        </div>
      )}
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleToggleComplete()
        }}
        className="relative z-[1]"
        aria-label={task.metadata.completed ? 'Mark as incomplete' : 'Mark as complete'}
        disabled={isUpdating}
      >
        {/* Changed: Circle with proper flex centering - use accent color */}
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ease-out ${
          showCheckmark
            ? 'bg-accent border-accent'
            : 'border-gray-300 dark:border-gray-600 hover:border-accent/60 dark:hover:border-accent/60'
        } ${showCelebration ? 'scale-110 ring-4 ring-accent/30 dark:ring-accent/30' : ''}`}>
          {showCheckmark && (
            <svg className={`w-3 h-3 text-white transition-transform duration-200 ease-out ${showCelebration ? 'scale-110' : ''}`} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M5 13l4 4L19 7"></path>
            </svg>
          )}
        </div>
      </button>
    </div>
  )
  
  // Changed: If task should be hidden after animation, don't render anything
  if (shouldHide) {
    return null
  }
  
  return (
    <>
      {/* Changed: Simple render without collapse animation - task just disappears after confetti */}
      <div 
        ref={cardRef}
        className="relative"
      >
        {/* Changed: Removed overflow-hidden to allow confetti to be visible outside the card */}
        <div className="relative">
          <div 
            className="bg-white dark:bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-gray-200 dark:border-gray-800"
            style={{
              // Changed: Reverse flex direction when checkbox is on right
              flexDirection: checkboxPosition === 'right' ? 'row-reverse' : 'row',
            }}
            onClick={handleCardClick}
          >
            {/* Changed: Checkbox with confetti positioned around it - allow overflow */}
            {CheckboxButton}
            
            {/* Title - use showCheckmark for visual styling */}
            <span className={`flex-1 text-base transition-all duration-300 ease-out ${
              showCheckmark ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'
            }`}>
              {task.metadata.title}
            </span>
            
            {/* Delete button - only show for completed tasks that aren't celebrating */}
            {task.metadata.completed && !showCelebration && (
              <button
                onClick={handleDelete}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                aria-label="Delete task"
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Changed: Edit modal */}
      {showEditModal && (
        <EditTaskModal
          task={task}
          lists={lists}
          onClose={() => setShowEditModal(false)}
          onOptimisticUpdate={onOptimisticUpdate}
        />
      )}
    </>
  )
}