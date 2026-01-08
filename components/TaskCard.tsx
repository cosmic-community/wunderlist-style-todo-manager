'use client'

import { useState, useEffect, useRef } from 'react'
import { Task, List } from '@/types'
import { Trash2 } from 'lucide-react'
import EditTaskModal from '@/components/EditTaskModal'

interface TaskCardProps {
  task: Task
  lists: List[]
  onOptimisticToggle: (taskId: string) => void
  onOptimisticDelete: (taskId: string) => void
  onOptimisticUpdate: (taskId: string, updates: Partial<Task['metadata']>) => void
  onSyncComplete?: (taskId: string) => void
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
  onSyncComplete
}: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [isCollapsing, setIsCollapsing] = useState(false)
  // Changed: Track if fully collapsed for smooth removal
  const [isFullyCollapsed, setIsFullyCollapsed] = useState(false)
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
      setIsFullyCollapsed(false)
      
      // Changed: Increased delay - Start collapse after confetti animation has time to display (1200ms)
      const collapseTimer = setTimeout(() => {
        setIsCollapsing(true)
      }, 1200)
      
      // Changed: Mark as fully collapsed after animation completes (1200ms celebration + 500ms collapse)
      const fullyCollapsedTimer = setTimeout(() => {
        setIsFullyCollapsed(true)
      }, 1700)
      
      // Changed: Hide celebration after transition completes
      const hideTimer = setTimeout(() => {
        setShowCelebration(false)
        setIsCollapsing(false)
      }, 1800)
      
      return () => {
        clearTimeout(collapseTimer)
        clearTimeout(fullyCollapsedTimer)
        clearTimeout(hideTimer)
      }
    } else if (prevCompletedRef.current && !task.metadata.completed) {
      // Changed: Task was uncompleted, reset states
      setShowCheckmark(false)
      setShowCelebration(false)
      setIsCollapsing(false)
      setIsFullyCollapsed(false)
    }
    
    // Changed: Update ref after checking
    prevCompletedRef.current = task.metadata.completed
  }, [task.metadata.completed])
  
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
  
  // Changed: More vibrant confetti colors
  const confettiColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
  
  // Changed: Don't render at all once fully collapsed - this prevents the jump
  if (isFullyCollapsed) {
    return null
  }
  
  return (
    <>
      {/* Changed: Smoother transition with grid-based height animation for collapse */}
      <div 
        ref={cardRef}
        className={`grid transition-all duration-500 ease-out ${
          isCollapsing 
            ? 'grid-rows-[0fr] opacity-0' 
            : 'grid-rows-[1fr] opacity-100'
        }`}
      >
        {/* Changed: Removed overflow-hidden to allow confetti to be visible outside the card */}
        <div className="min-h-0">
          <div className="relative">
            <div 
              className={`bg-white dark:bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-gray-200 dark:border-gray-800 ${
                isCollapsing ? 'scale-98 -translate-y-1' : ''
              }`}
              style={{
                // Changed: Add margin-bottom that transitions to 0 for smoother collapse
                marginBottom: isCollapsing ? '-8px' : '0px',
                transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onClick={handleCardClick}
            >
              {/* Changed: Checkbox with confetti positioned around it - allow overflow */}
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
                  {/* Changed: Circle with proper flex centering - use showCheckmark for visual state */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ease-out ${
                    showCheckmark
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                  } ${showCelebration ? 'scale-110 ring-4 ring-blue-200/50 dark:ring-blue-900/50' : ''}`}>
                    {showCheckmark && (
                      <svg className={`w-3 h-3 text-white transition-transform duration-200 ease-out ${showCelebration ? 'scale-110' : ''}`} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                </button>
              </div>
              
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