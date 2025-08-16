import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { motion } from 'motion/react'

export interface Context {
  id: string
  name: string
  type: string
  favicon: string
  url: string
  unavailable: boolean
}

export interface ContextSuggestionProps {
  items: Context[]
  command: (item: Context) => void
}

export interface ContextSuggestionRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const ContextList = forwardRef<ContextSuggestionRef, ContextSuggestionProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

    // Group items by browser
    const groupedItems = props.items.reduce((acc: Record<string, Context[]>, item: Context) => {
      if (!acc[item.type]) {
        acc[item.type] = []
      }
      acc[item.type].push(item)
      return acc
    }, {} as Record<string, Context[]>)

    // Get flat array for keyboard navigation
    const flatItems: Context[] = []
    Object.keys(groupedItems).forEach(browserType => {
      groupedItems[browserType].forEach((item: Context) => {
        flatItems.push(item)
      })
    })

    const selectItem = (index: number) => {
      const item = flatItems[index]
      if (item && !item.unavailable) {
        props.command(item)
      }
    }

    const scrollIntoView = (index: number) => {
      const item = itemRefs.current[index]
      if (item && scrollContainerRef.current) {
        const container = scrollContainerRef.current
        const itemTop = item.offsetTop
        const itemBottom = itemTop + item.offsetHeight
        const containerTop = container.scrollTop
        const containerBottom = containerTop + container.offsetHeight

        if (itemTop < containerTop) {
          container.scrollTop = itemTop
        } else if (itemBottom > containerBottom) {
          container.scrollTop = itemBottom - container.offsetHeight
        }
      }
    }

    const upHandler = () => {
      const newIndex = (selectedIndex + flatItems.length - 1) % flatItems.length
      setSelectedIndex(newIndex)
      scrollIntoView(newIndex)
    }

    const downHandler = () => {
      const newIndex = (selectedIndex + 1) % flatItems.length
      setSelectedIndex(newIndex)
      scrollIntoView(newIndex)
    }

    const enterHandler = () => {
      selectItem(selectedIndex)
    }

    useEffect(() => {
      setSelectedIndex(0)
      itemRefs.current = new Array(flatItems.length).fill(null)
    }, [props.items, flatItems.length])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          upHandler()
          return true
        }

        if (event.key === 'ArrowDown') {
          downHandler()
          return true
        }

        if (event.key === 'Enter') {
          enterHandler()
          return true
        }

        return false
      },
    }))


    return (
      <motion.div initial={{y: 10, opacity: 0}} animate={{y: 0, opacity: 10}} className="bg-background border rounded-lg overflow-hidden w-xs">
        <div ref={scrollContainerRef} className="max-h-64 overflow-auto">
          {Object.keys(groupedItems).length > 0 ? (
            Object.keys(groupedItems).map((browserType, browserIndex) => (
              <div key={browserType}>
                {/* Browser section header */}
                <div className="px-3 pt-1 pb-1">
                  <span className="text-xs font-medium text-foreground/70">
                    {browserType.charAt(0).toUpperCase() + browserType.slice(1)}
                  </span>
                </div>
                
                {/* Browser tabs */}
                {groupedItems[browserType].map((item: Context, itemIndex: number) => {
                  const globalIndex = flatItems.findIndex(flatItem => flatItem.id === item.id)
                  return (
                    <button
                      key={item.id}
                      ref={(el) => {
                        itemRefs.current[globalIndex] = el
                      }}
                      disabled={item.unavailable}
                      onClick={() => selectItem(globalIndex)}
                      className={`w-full text-left px-3 py-2.5 disabled:pointer-events-none disabled:opacity-50 hover:bg-neutral-50 hover:dark:bg-neutral-800/50 ${
                        globalIndex === selectedIndex ? 'bg-neutral-100 dark:bg-neutral-800/70' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 flex items-center">
                          <img src={item.favicon} alt={`${item.name} favicon`} className="w-5 h-5 rounded-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground/80 truncate">
                            {item.name}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-gray-500 text-sm">
              No websites found
            </div>
          )}
        </div>
      </motion.div>
    )
  }
)
