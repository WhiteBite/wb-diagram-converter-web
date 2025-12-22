import { useState, useRef, useCallback, ReactNode } from 'react';
import { GripVertical, GripHorizontal } from 'lucide-react';

interface ResizablePanelProps {
    children: ReactNode;
    direction?: 'horizontal' | 'vertical';
    defaultSize?: number;
    minSize?: number;
    maxSize?: number;
    className?: string;
}

export function ResizablePanel({
    children,
    direction = 'horizontal',
    defaultSize = 50,
    minSize = 20,
    maxSize = 80,
    className = '',
}: ResizablePanelProps) {
    const [size, setSize] = useState(defaultSize);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            let newSize: number;

            if (direction === 'horizontal') {
                newSize = ((e.clientX - rect.left) / rect.width) * 100;
            } else {
                newSize = ((e.clientY - rect.top) / rect.height) * 100;
            }

            newSize = Math.max(minSize, Math.min(maxSize, newSize));
            setSize(newSize);
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [direction, minSize, maxSize]);

    const childArray = Array.isArray(children) ? children : [children];
    if (childArray.length !== 2) {
        return <div className={className}>{children}</div>;
    }

    const isHorizontal = direction === 'horizontal';

    return (
        <div
            ref={containerRef}
            className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} ${className}`}
        >
            <div
                style={{ [isHorizontal ? 'width' : 'height']: `${size}%` }}
                className="overflow-hidden"
            >
                {childArray[0]}
            </div>

            {/* Resizer */}
            <div
                onMouseDown={handleMouseDown}
                className={`
                    flex-shrink-0 flex items-center justify-center
                    ${isHorizontal ? 'w-2 cursor-col-resize hover:bg-indigo-500/20' : 'h-2 cursor-row-resize hover:bg-indigo-500/20'}
                    bg-slate-200 dark:bg-slate-700 transition-colors group
                `}
            >
                {isHorizontal ? (
                    <GripVertical className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                ) : (
                    <GripHorizontal className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                )}
            </div>

            <div
                style={{ [isHorizontal ? 'width' : 'height']: `${100 - size}%` }}
                className="overflow-hidden"
            >
                {childArray[1]}
            </div>
        </div>
    );
}
