'use client'

import { useState, useEffect, useRef, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { Task, List, StyleTheme } from '@/types'
import { Trash2, FileText, Flag, Calendar, GripVertical } from 'lucide-react'
import EditTaskModal from '@/components/EditTaskModal'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/components/ThemeProvider'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TaskCardProps {
  task: Task
  lists: List[]
  onOptimisticToggle: (taskId: string) => void
  onOptimisticDelete: (taskId: string) => void
  onOptimisticUpdate: (taskId: string, updates: Partial<Task['metadata']>) => void
  onSyncComplete?: (taskId: string) => void
  // Changed: Added callback to notify parent when task should be removed after animation
  onAnimationComplete?: (taskId: string) => void
  // Changed: Props for drag and drop
  isDragging?: boolean
  showDragHandle?: boolean
  // Changed: Drag handle listeners and attributes for handle-only dragging
  dragHandleListeners?: React.HTMLAttributes<HTMLButtonElement>
  dragHandleAttributes?: React.HTMLAttributes<HTMLButtonElement>
  // Changed: Callback to notify parent when a modal opens/closes (for disabling drag)
  onModalOpenChange?: (isOpen: boolean) => void
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

// Changed: Confetti container that renders at body level via portal
function ConfettiOverlay({ colors, position }: { colors: string[]; position: { x: number; y: number } }) {
  return createPortal(
    <div 
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="relative w-0 h-0">
        {colors.map((color, i) => (
          <ConfettiParticle key={`a-${i}`} delay={i * 25} color={color} index={i} total={colors.length} />
        ))}
        {colors.map((color, i) => (
          <ConfettiParticle key={`b-${i}`} delay={i * 25 + 60} color={color} index={i + colors.length} total={colors.length * 2} />
        ))}
      </div>
    </div>,
    document.body
  )
}

export default function TaskCard({ 
  task, 
  lists,
  onOptimisticToggle,
  onOptimisticDelete,
  onOptimisticUpdate,
  onSyncComplete,
  onAnimationComplete,
  isDragging: isDraggingProp,
  showDragHandle,
  dragHandleListeners,
  dragHandleAttributes,
  onModalOpenChange
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
  // Changed: Track confetti position for portal rendering
  const [confettiPosition, setConfettiPosition] = useState<{ x: number; y: number } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const checkboxRef = useRef<HTMLButtonElement>(null)
  
  // Changed: Track previous completed state with ref to detect transitions
  const prevCompletedRef = useRef(task.metadata.completed)
  
  useEffect(() => {
    // Changed: If task just became completed (wasn't before, is now)
    if (!prevCompletedRef.current && task.metadata.completed) {
      // Changed: Show checkmark immediately for visual feedback
      setShowCheckmark(true)
      setShowCelebration(true)
      setShouldHide(false)
      
      // Changed: Capture checkbox position for portal rendering
      if (checkboxRef.current) {
        const rect = checkboxRef.current.getBoundingClientRect()
        setConfettiPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        })
      }
      
      // Changed: Wait for confetti animation to complete (600ms) then instantly remove
      // The confetti animation is 0.6s, so we wait for it to finish
      const removeTimer = setTimeout(() => {
        setShowCelebration(false)
        setConfettiPosition(null)
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
      setConfettiPosition(null)
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
    onModalOpenChange?.(true)
  }
  
  // Changed: Handler for closing modal
  const handleCloseModal = () => {
    setShowEditModal(false)
    onModalOpenChange?.(false)
  }
  
  // Changed: Theme-aware confetti colors - properly typed
  const getConfettiColors = (): string[] => {
    const themeColors: Record<StyleTheme, string[]> = {
      'ocean': ['#06b6d4', '#0891b2', '#22d3ee', '#67e8f9', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'],
      'forest': ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#84cc16', '#a3e635', '#bef264', '#d9f99d'],
      'sunset': ['#f97316', '#ea580c', '#fb923c', '#fdba74', '#ef4444', '#f87171', '#fca5a5', '#fecaca'],
      'rose': ['#ec4899', '#db2777', '#f472b6', '#f9a8d4', '#e879f9', '#d946ef', '#c026d3', '#a855f7'],
      'lavender': ['#8b5cf6', '#7c3aed', '#a78bfa', '#c4b5fd', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8'],
      'peach': ['#fb923c', '#f97316', '#fdba74', '#fed7aa', '#fca5a5', '#f87171', '#ef4444', '#fb7185'],
      'mint': ['#34d399', '#10b981', '#6ee7b7', '#a7f3d0', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e'],
      'default': ['#3b82f6', '#2563eb', '#60a5fa', '#93c5fd', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']
    }
    return themeColors[styleTheme] || themeColors['default']
  }
  
  const confettiColors = getConfettiColors()

  // Changed: Checkbox component for reuse - increased sizes for mobile
  const CheckboxButton = (
    <div className="relative flex-shrink-0 flex items-center">
      <button
        ref={checkboxRef}
        onClick={(e) => {
          e.stopPropagation()
          handleToggleComplete()
        }}
        className="relative z-[1]"
        aria-label={task.metadata.completed ? 'Mark as incomplete' : 'Mark as complete'}
        disabled={isUpdating}
      >
        {/* Changed: Circle with proper flex centering - use accent color - increased from w-6 h-6 to w-7 h-7 on mobile */}
        <div className={`w-7 h-7 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ease-out ${
          showCheckmark
            ? 'bg-accent border-accent'
            : 'border-gray-300 dark:border-gray-600 hover:border-accent/60 dark:hover:border-accent/60'
        } ${showCelebration ? 'scale-110 ring-4 ring-accent/30 dark:ring-accent/30' : ''}`}>
          {showCheckmark && (
            <svg className={`w-3.5 h-3.5 md:w-3 md:h-3 text-white transition-transform duration-200 ease-out ${showCelebration ? 'scale-110' : ''}`} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
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
        className={`relative ${isDraggingProp ? 'z-50' : ''}`}
      >
        {/* Changed: Removed overflow-hidden to allow confetti to be visible outside the card - increased padding for mobile */}
        <div className="relative">
          <div 
            className={`bg-white dark:bg-gray-900 rounded-xl px-4 py-4 md:py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-gray-200 dark:border-gray-800 group ${
              isDraggingProp ? 'shadow-lg ring-2 ring-accent/50 opacity-90 cursor-grabbing' : ''
            } ${showDragHandle && !task.metadata.completed ? 'md:cursor-grab' : ''} cursor-pointer`}
            onClick={handleCardClick}
          >
            {/* Drag handle - mobile only, LEFT side when checkbox is on right */}
            {showDragHandle && !task.metadata.completed && checkboxPosition === 'right' && (
              <button
                className="md:hidden flex-shrink-0 touch-none cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 -ml-1"
                onClick={(e) => e.stopPropagation()}
                aria-label="Drag to reorder"
                {...dragHandleAttributes}
                {...dragHandleListeners}
              >
                <GripVertical className="w-5 h-5" />
              </button>
            )}
            
            {/* Checkbox - left or right based on preference */}
            {checkboxPosition === 'left' && CheckboxButton}
            
            {/* Title - use showCheckmark for visual styling - increased text size on mobile */}
            <span className={`flex-1 text-lg md:text-base transition-all duration-300 ease-out ${
              showCheckmark ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'
            }`}>
              {task.metadata.title}
            </span>
            
            {/* Delete button - only show for completed tasks that aren't celebrating */}
            {task.metadata.completed && !showCelebration && (
              <button
                onClick={handleDelete}
                className="flex-shrink-0 p-2 md:p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                aria-label="Delete task"
                disabled={isDeleting}
              >
                <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
              </button>
            )}
            
            {/* Task attribute indicators - description and due date */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Description indicator */}
              {task.metadata.description && (
                <span title="Has description">
                  <FileText className={`w-4 h-4 ${showCheckmark ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'}`} />
                </span>
              )}
              
              {/* Due date indicator */}
              {task.metadata.due_date && (
                <span title={`Due: ${new Date(task.metadata.due_date).toLocaleDateString()}`}>
                  <Calendar className={`w-4 h-4 ${showCheckmark ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'}`} />
                </span>
              )}
            </div>

            {/* Priority flag - next to checkbox */}
            {task.metadata.priority && (
              <span title={`Priority: ${task.metadata.priority.value}`} className="flex-shrink-0">
                <Flag className={`w-4 h-4 ${
                  showCheckmark 
                    ? 'text-gray-300 dark:text-gray-600' 
                    : task.metadata.priority.key === 'high' 
                      ? 'text-red-500 dark:text-red-400' 
                      : task.metadata.priority.key === 'medium' 
                        ? 'text-gray-500 dark:text-gray-400' 
                        : 'text-blue-500 dark:text-blue-400'
                }`} />
              </span>
            )}

            {/* Checkbox - right side if preference is right */}
            {checkboxPosition === 'right' && CheckboxButton}
            
            {/* Drag handle - mobile only, RIGHT side when checkbox is on left */}
            {showDragHandle && !task.metadata.completed && checkboxPosition === 'left' && (
              <button
                className="md:hidden flex-shrink-0 touch-none cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 -mr-1"
                onClick={(e) => e.stopPropagation()}
                aria-label="Drag to reorder"
                {...dragHandleAttributes}
                {...dragHandleListeners}
              >
                <GripVertical className="w-5 h-5" />
              </button>
            )}
            
          </div>
        </div>
      </div>
      
      {/* Changed: Confetti rendered via portal to appear above all elements */}
      {showCelebration && confettiPosition && typeof document !== 'undefined' && (
        <ConfettiOverlay colors={confettiColors} position={confettiPosition} />
      )}
      
      {/* Changed: Edit modal - using portal to render at body level for proper z-index stacking */}
      {showEditModal && typeof document !== 'undefined' && createPortal(
        <EditTaskModal
          task={task}
          lists={lists}
          onClose={handleCloseModal}
          onOptimisticUpdate={onOptimisticUpdate}
        />,
        document.body
      )}
    </>
  )
}